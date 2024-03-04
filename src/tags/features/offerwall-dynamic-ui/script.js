/*
 * Copyright 2024 Google LLC
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

(function() {
  // #region Customize configs
  var TEXT_BY_SELECTOR = {
    '.fc-dialog-headline-text': '{{tagsmith.offerwallDynamicUi.headlineText}}',
    '.fc-dialog-body-text': '{{tagsmith.offerwallDynamicUi.bodyText}}',
    '.fc-rewarded-ad-option-text':
      '{{tagsmith.offerwallDynamicUi.rewardedAdOptionText}}',
    '.fc-rewarded-ad-option-subtext':
      '{{tagsmith.offerwallDynamicUi.rewardedAdOptionSubtext}}'
  };
  // #endregion

  if (!('MutationObserver' in window)) {
    return;
  }

  var FEATURE_ID = 'offerwallDynamicUi';
  var variant = '{{tagsmith.abVariant.offerwallDynamicUi}}';
  var enabled = window.__tagsmith.enable(FEATURE_ID, variant);
  var logger = window.__tagsmith.getLogger(FEATURE_ID, variant);

  var observer = new MutationObserver(function(mutationList) {
    for (var i = 0; i < mutationList.length; i++) {
      var mutation = mutationList[i];
      for (var j = 0; j < mutation.addedNodes.length; j++) {
        var node = mutation.addedNodes[j];
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.className === 'fc-message-root' &&
          node.querySelector('.fc-monetization-dialog') !== null
        ) {
          enabled && modify(node);
          monitor(node);
          observer.disconnect();
        }
      }
    }
  });
  observer.observe(document.body, {childList: true});

  /**
   * Modify offerwall message UI
   * @param {Element} rootNode
   */
  function modify(rootNode) {
    var seletorList = Object.keys(TEXT_BY_SELECTOR);
    for (var i = 0; i < seletorList.length; i++) {
      var selector = seletorList[i];
      var text = TEXT_BY_SELECTOR[selector];
      var $element = rootNode.querySelector(selector);
      if ($element && text !== '' && text !== '_') {
        $element.innerText = text;
      }
    }
  }

  /**
   * Monitor offerwall user engagements
   * @param {Element} rootNode
   */
  function monitor(rootNode) {
    if (!logger) {
      return;
    }

    logger('prompt');

    var classNameList = [
      'fc-rewarded-ad-button',
      'fc-user-interests-button',
      'fc-laterpay-button',
      'fc-publisher-custom-impl-button'
    ];

    for (var i = 0; i < classNameList.length; i++) {
      var className = classNameList[i];
      var $button = rootNode.querySelector('.' + className);
      if ($button) {
        $button.addEventListener(
            'click',
            logger.bind(null, 'click', className)
        );
      }
    }

    var $thankYou = rootNode.querySelector('.fc-thank-you-snackbar');
    if ($thankYou) {
      var completionObserver = new MutationObserver(function(mutationList) {
        for (var i = 0; i < mutationList.length; i++) {
          var mutation = mutationList[i];
          if (
            mutation.type === 'attributes' &&
            mutation.attributeName === 'style' &&
            mutation.target.style.display !== 'none'
          ) {
            logger('complete');
            completionObserver.disconnect();
          }
        }
      });
      completionObserver.observe($thankYou, {
        attributes: true,
        attributeFilter: ['style']
      });
    }
  }
})();
