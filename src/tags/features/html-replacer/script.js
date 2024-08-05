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
  var cssSelector = '{{tagsmith.htmlReplacer.cssSelector}}';

  var FEATURE_ID = 'htmlReplacer';
  var variant = '{{tagsmith.abVariant.htmlReplacer}}';
  var enabled = window.__tagsmith.enable(FEATURE_ID, variant);
  var logger = window.__tagsmith.getLogger(FEATURE_ID, variant);

  var $root = document.getElementById('__tagsmith_htmlReplacer');

  if (
    (!enabled && !logger) ||
    typeof DocumentFragment === 'undefined' ||
    !('replaceChildren' in document.body)
  ) {
    $root.parentNode.removeChild($root);
    return;
  }

  if (enabled) {
    /**
     * Generate DocumentFragment from the content of <textarea>.
     * Note: GTM doesn't allow <template>.
     * @return {DocumentFragment}
     */
    var $template = (function() {
      var $textarea = $root.querySelector('[name=template]');

      // Any <script> element gets marked non-executable.
      var parser = new DOMParser();
      var doc = parser.parseFromString($textarea.textContent, 'text/html');

      var docFrag = new DocumentFragment();
      for (var j = 0; j < doc.head.childNodes.length; j++) {
        docFrag.append(doc.head.childNodes[j]);
      }
      for (var k = 0; k < doc.body.childNodes.length; k++) {
        docFrag.append(doc.body.childNodes[k]);
      }

      return docFrag;
    })();

    var $targets = document.querySelectorAll(cssSelector);

    for (var i = 0; i < $targets.length; i++) {
      $targets[i].replaceChildren($template.cloneNode(true));
    }

    logger && logger('replaced');
  } else {
    logger && logger('kept');
  }
})();
