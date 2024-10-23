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
    var FEATURE_ID = 'pageviewCounter';
    var variant = '{{tagsmith.abVariant.pageviewCounter}}';
    var enabled = window.__tagsmith.enable(FEATURE_ID, variant);
    var logger = window.__tagsmith.getLogger(FEATURE_ID, variant);
  
    var $root = document.getElementById('__tagsmith_pageviewCounter');
  
    /**
     * Set the maximum timeout time.
     * Default: 1 hour (= 60 x 60 x 1000)
     */

    var MAX_TIMEOUT = 60 * 60 * 1000

    var lastAccessTime = localStorage.getItem('lastAccessTime');
    var currentTime = new Date().getTime();

    if (lastAccessTime && (currentTime - lastAccessTime) < MAX_TIMEOUT) {
      pv_counter = pv_counter + 1
    } else {
      pv_counter = 1
    }

    localStorage.setItem('lastAccessTime', currentTime);
})();
  