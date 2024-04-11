/*
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function(w, o) {
  var LOCAL_STORAGE_KEY = '__tagsmith_ab_factor';
  var DEBUG = w[o].__debug();

  var errors = [];

  /** @type {!Array<{
   *   name: string,
   *   percentage: number,
   *   variants: !Array<{
   *     name: string,
   *     percentage: number,
   *     leftBoundary: number
   *   }
   * }}
   */
  var abStatus = [];
  /** @type {!Array<string>} */
  var validVariants = [];

  for (var i = 0; i < DEBUG.AB_CONF.length; i++) {
    var testConf = DEBUG.AB_CONF[i];
    var lastTestConf = i === 0 ? null : DEBUG.AB_CONF[i - 1];

    var leftBoundary = lastTestConf ? lastTestConf[lastTestConf.length - 1] : 0;

    var test = {
      name: testConf[0],
      percentage: testConf[testConf.length - 1] - leftBoundary,
      variants: []
    };
    abStatus.push(test);

    for (var j = 1; j < testConf.length; j++) {
      var isControlVariant = j === 1;
      var rightBoundary = testConf[j];

      var variant = {
        name: test.name + '_' + (isControlVariant ? 'con' : 'exp' + (j - 1)),
        percentage: rightBoundary - leftBoundary,
        leftBoundary: leftBoundary
      };
      test.variants.push(variant);

      leftBoundary = rightBoundary;

      if (!isControlVariant) {
        validVariants.push(variant.name);
      }
    }
  }

  var featuresForAll = [];
  var featureByVariant = {};

  var originalEnableFunc = w[o].enable;
  /**
   * Try enabling a feature for a specific variant.
   * This debugger version provides the same feature as original but records
   * all features enabled and logs any potential errors.
   * @param {string} feature
   * @param {string} forVariant
   * @return {boolean} `true` if the feature should be enabled for current user.
   */
  w[o].enable = function(feature, forVariant) {
    if (forVariant === 'all') {
      featuresForAll.push(feature);
    } else if (validVariants.indexOf(forVariant) === -1) {
      errors.push(forVariant + ' is not valid.');
    } else if (featureByVariant[forVariant]) {
      errors.push(
          forVariant + ' already used by ' + featureByVariant[forVariant]
      );
    } else {
      featureByVariant[forVariant] = feature;
    }

    return originalEnableFunc(feature, forVariant);
  };

  /** @type {!Object<string, !Array<string>>} */
  var loggersEnabledByTest = {};

  var originalGetLoggerFunc = w[o].getLogger;

  /** @typedef {function(string, string): void} */
  // eslint-disable-next-line no-unused-vars
  var Logger;

  /**
   * Get logger for feature on a specific variant.
   * This debugger version provides the same feature as original but records
   * all features enabled and logs any potential errors.
   * @param {string} feature
   * @param {string} forVariant
   * @return {!Logger|false} `false` when logger shouldn't be enabled.
   */
  w[o].getLogger = function(feature, forVariant) {
    if (forVariant !== 'all') {
      var forTestName = forVariant.substr(0, forVariant.lastIndexOf('_'));
      loggersEnabledByTest[forTestName] =
        loggersEnabledByTest[forTestName] || [];
      if (loggersEnabledByTest[forTestName].indexOf(feature) === -1) {
        loggersEnabledByTest[forTestName].push(feature);
      }
    }

    return originalGetLoggerFunc(feature, forVariant);
  };

  /**
   * Function for feature to report error.
   * @param {string} feature
   * @return {function(string): void}
   */
  w[o].__getErrorReporter = function(feature) {
    return function(error) {
      errors.push('"' + feature + '": ' + error);
    };
  };

  /**
   * Assign current user to a specific variant.
   * @param {string} variant
   */
  var activateVariant = function(variant) {
    if (!confirm('Assign current user to variant "' + variant.name + '"?')) {
      return;
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, variant.leftBoundary.toString());

    alert('Assigned. Refreshing page…');
    window.location.reload();
  };

  // #region UI implementations

  var $root = document.getElementById('__tagsmith_debugger');
  var $open = $root.querySelector('.__tagsmith_debugger_open');
  var $container = $root.querySelector('.__tagsmith_debugger_container');
  var $testSetup = $root.querySelector('#__tagsmith_debugger_test_setup');
  var $close = $root.querySelector('.__tagsmith_debugger_close');

  var testSetupLogger;

  /**
   * Test framework setup.
   */
  var testSetup = function() {
    var userVariant = w[o].userVariant();

    if (!testSetupLogger) {
      testSetupLogger = w[o].getLogger('debugger', userVariant);
    }

    if (testSetupLogger) {
      var eventName = 'testEventName';
      var eventValue = 'testEventValue';
      testSetupLogger(eventName, eventValue);
      alert('Event sent with name: ' + eventName + ', value: ' + eventValue);
    } else {
      alert('Can\'t get logger for debugger.');
    }
  };

  $testSetup.addEventListener('click', testSetup);

  /**
   * Refresh all UI elements.
   */
  var refresh = function() {
    refreshErrors();
    refreshFeaturesForAll();
    refreshAbStatus();
  };

  var $errors = $root.querySelector('#__tagsmith_debugger_errors');

  /**
   * Refresh errors.
   */
  var refreshErrors = function() {
    $errors.innerText = '';

    if (errors.length === 0) {
      $errors.innerText = 'None';
      return;
    }

    for (var i = 0; i < errors.length; i++) {
      var error = errors[i];
      var $error = document.createElement('div');
      $error.className = '__tagsmith_debugger_error';
      $error.innerText = error;
      $errors.append($error);
    }
  };

  var $featuresForAll = $root.querySelector(
      '#__tagsmith_debugger_featuresForAll'
  );

  /**
   * Refresh features enabled for all users.
   */
  var refreshFeaturesForAll = function() {
    $featuresForAll.innerText = '';

    if (featuresForAll.length === 0) {
      $featuresForAll.innerText = 'None';
      return;
    }

    for (var i = 0; i < featuresForAll.length; i++) {
      var $feature = document.createElement('div');
      $feature.className = '__tagsmith_debugger_feature';
      $feature.innerText = featuresForAll[i];
      $featuresForAll.append($feature);
    }
  };

  var $testStatus = $root.querySelector('#__tagsmith_debugger_testStatus');

  /**
   * Refresh features and loggers enabled for each variant.
   */
  var refreshAbStatus = function() {
    var userVariant = w[o].userVariant();

    $testStatus.innerText = '';

    for (var i = 0; i < abStatus.length; i++) {
      var test = abStatus[i];

      var $testName = document.createElement('td');
      $testName.className = '__tagsmith_debugger_testName';
      $testName.rowSpan = test.variants.length;
      $testName.innerText = test.name;

      var $testPercentage = document.createElement('div');
      $testPercentage.className = '__tagsmith_debugger_percentage';
      $testPercentage.innerText = (test.percentage * 100).toFixed(2) + '%';
      $testName.prepend($testPercentage);

      for (var j = 0; j < test.variants.length; j++) {
        var variant = test.variants[j];

        var $tr = document.createElement('tr');
        $testStatus.append($tr);

        if (j === 0) {
          $tr.append($testName);
        }

        var $variant = document.createElement('td');
        $variant.className = '__tagsmith_debugger_variant';
        $variant.innerText = variant.name;
        $tr.append($variant);

        if (variant.name === userVariant) {
          $variant.classList.add('active');
        } else {
          $variant.addEventListener(
              'click',
              activateVariant.bind(null, variant)
          );
        }

        var $variantPercentage = document.createElement('div');
        $variantPercentage.className = '__tagsmith_debugger_percentage';
        $variantPercentage.innerText =
          (variant.percentage * 100).toFixed(2) + '%';
        $variant.prepend($variantPercentage);

        var $featureEnabled = document.createElement('td');
        $tr.append($featureEnabled);

        if (featureByVariant[variant.name]) {
          var $feature = document.createElement('div');
          $feature.className = '__tagsmith_debugger_feature';
          $feature.innerText = featureByVariant[variant.name];
          $featureEnabled.append($feature);
        }

        var $loggersEnabled = document.createElement('td');
        $tr.append($loggersEnabled);

        if (loggersEnabledByTest[test.name]) {
          var loggers = loggersEnabledByTest[test.name];

          for (var k = 0; k < loggers.length; k++) {
            var $logger = document.createElement('div');
            $logger.className = '__tagsmith_debugger_logger';
            $logger.innerText = loggers[k];
            $loggersEnabled.append($logger);
          }
        }
      }
    }
  };

  $open.addEventListener('click', function() {
    $container.style.visibility = 'visible';

    refresh();
  });

  $close.addEventListener('click', function() {
    $container.style.visibility = 'hidden';
  });

  // #endregion
})(window, '__tagsmith');
