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
  /**
   * Set the maximum scroll top position to be used when calculating reading
   * percentage. Change this as needed.
   */
  var setMaxScrollTop = function() {
    var contentHeight = document.body.clientHeight;
    var viewportHeight = window.innerHeight;
    maxScrollTop = contentHeight - viewportHeight;
  };
  /**
   * Function to get the current scroll top position.
   * Change this as needed.
   * @return {number}
   */
  var getScrollTop = function() {
    return window.scrollY;
  };
  // #endregion

  var FEATURE_ID = 'readingProgressBar';
  var variant = '{{tagsmith.abVariant.readingProgressBar}}';
  var enabled = window.__tagsmith.enable(FEATURE_ID, variant);
  var logger = window.__tagsmith.getLogger(FEATURE_ID, variant);

  var $root = document.getElementById('__tagsmith_readingProgressBar');

  if (!enabled && !logger) {
    $root.parentNode.removeChild($root);
    return;
  }

  var maxScrollTop = 0;
  setMaxScrollTop();
  window.addEventListener('resize', setMaxScrollTop);

  var $progress;
  if (enabled) {
    $progress = document.getElementById(
        '__tagsmith_readingProgressBar_progress'
    );
  } else {
    var $ele = document.getElementById(
        '__tagsmith_readingProgressBar_container'
    );
    $ele.parentNode.removeChild($ele);
  }

  var loggedPercentage = {};

  /**
   * Update progress bar appearance.
   * Also logs reading percentage when it exceeds 50%, 75%, and 90%.
   * @param {number} timestamp
   */
  var update = function(timestamp) {
    var percentage =
      maxScrollTop <= 0 ?
        100 :
        Math.round((getScrollTop() / maxScrollTop) * 100);

    if (enabled) {
      $progress.style.width = percentage + '%';
    }

    if (percentage >= 50) {
      var p = percentage >= 90 ? 90 : percentage >= 75 ? 75 : 50;
      if (!loggedPercentage[p]) {
        loggedPercentage[p] = true;
        logger && logger('percentage', p);
      }
    }

    setTimeout(function() {
      window.requestAnimationFrame(update);
    }, 100);
  };
  window.requestAnimationFrame(update);
})();
