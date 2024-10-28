/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @fileoverview
 * @name Tagsmith
 * @version 1.0.1
 */
(function(w, o) {
  /**
   * A/B test groups and variants configuration.
   * Each array element is an array in the format of
   * [
   *   testName: string,
   *   controlGroupPercentageBoundary: number,
   *   ...experimentGroupPercentageBoundaries: number[]
   * ]
   * @type {!Array<!Array<string|number>>}
   */
  var AB_CONF = [
    ['test1', 0.050, 0.100], // 5.0% per group
    ['test2', 0.150, 0.200], // 5.0% per group
    ['test3', 0.250, 0.300], // 5.0% per group
    ['test4', 0.350, 0.400], // 5.0% per group
    ['test5', 0.450, 0.500], // 5.0% per group
    ['test6', 0.533, 0.566, 0.599], // 3.3% per group
    ['test7', 0.632, 0.665, 0.698], // 3.3% per group
    ['test8', 0.732, 0.766, 0.800], // 3.4% per group
    ['test9', 0.825, 0.850, 0.875, 0.900], // 2.5% per group
    ['test10', 0.925, 0.950, 0.975, 1.000] // 2.5% per group
  ];
  var LOCAL_STORAGE_KEY = '__tagsmith_ab_factor';
  var GAM_KEY_VALUE = 'tagsmith_ab_variant';

  /**
   * Get the variant name for current user.
   * This function will randomly assign current user to a variant if it's not
   * yet assigned.
   * @return {?string} E.g. test1_con, test1_exp1, test9_exp3,or null when no
   * matching
   */
  var getUserVariant = function() {
    var factor = parseFloat(localStorage.getItem(LOCAL_STORAGE_KEY));

    if (isNaN(factor) || factor < 0 || factor >= 1) {
      factor = Math.random();
      localStorage.setItem(LOCAL_STORAGE_KEY, factor.toString());
    }

    for (var i = 0; i < AB_CONF.length; i++) {
      var testName = AB_CONF[i][0];

      for (var j = 1; j < AB_CONF[i].length; j++) {
        var rightBoundary = AB_CONF[i][j];

        if (factor < rightBoundary) {
          return testName + '_' + (j === 1 ? 'con' : 'exp' + (j - 1));
        }
      }
    }

    return null;
  };

  var userVariant = getUserVariant();

  /** @type {!Object<string, string}} */
  var featureByVariant = {};

  w[o] = w[o] || {};

  /**
   * Return the variant name for current user.
   * @return {?string}
   */
  w[o].userVariant = function() {
    return userVariant;
  };

  /**
   * Try enabling a feature for a specific variant.
   * @param {string} feature
   * @param {string} forVariant
   * @return {boolean} `true` if the feature should be enabled for current user.
   */
  w[o].enable = function(feature, forVariant) {
    if (forVariant === 'all') {
      return true;
    }

    // Prevent use of control group
    if (forVariant.lastIndexOf('_con') + 4 === forVariant.length) {
      return false;
    }

    // Prevent multiple features using the same group
    if (featureByVariant[forVariant]) {
      return false;
    }

    featureByVariant[forVariant] = feature;

    return userVariant === forVariant;
  };

  /** @typedef {function(string, string): void} */
  // eslint-disable-next-line no-unused-vars
  var Logger;

  /**
   * Get logger for feature on a specific variant.
   * Implementation is overridden dynamically by `logger.html` to speed up page
   * loading.
   * @param {string} feature
   * @param {string} forVariant
   * @return {!Logger|false} `false` when logger shouldn't be enabled.
   */
  w[o].getLogger = function(feature, forVariant) {
    return false;
  };

  /**
   * Returns debug info.
   * @return {{ AB_CONF: !AB_CONF }}
   */
  w[o].__debug = function() {
    return {
      AB_CONF: AB_CONF
    };
  };

  if (userVariant) {
    // Register with GPT
    w.googletag = w.googletag || {cmd: []};

    /**
     * Assign page-level key-value.
     */
    var setTargeting = function() {
      w.googletag.pubads().setTargeting(GAM_KEY_VALUE, userVariant);
    };

    if (w.googletag.cmd instanceof Array) {
      w.googletag.cmd.unshift(setTargeting);
    } else {
      w.googletag.cmd.push(setTargeting);
    }
  }
})(window, '__tagsmith');
