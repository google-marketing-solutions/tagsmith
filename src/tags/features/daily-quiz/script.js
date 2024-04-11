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
  /** @typedef {!{
   *   question: string,
   *   options: !Array<string>,
   *   answer: number,
   *   link: string
   * }} Quiz
   */

  /** @type {!Object<string, !Array<!Quiz>>} */
  var quizConfigs = {{tagsmith.dailyQuiz.quizConfigs}};

  var FEATURE_ID = 'dailyQuiz';
  var variant = '{{tagsmith.abVariant.dailyQuiz}}';
  var enabled = window.__tagsmith.enable(FEATURE_ID, variant);
  var logger = window.__tagsmith.getLogger(FEATURE_ID, variant);
  var errorReporter = window.__tagsmith.__getErrorReporter(FEATURE_ID);

  var LOCAL_STORAGE_KEY = '__tagsmith_dailyQuiz';

  var $root = document.getElementById('__tagsmith_dailyQuiz');

  /**
   * Remove all UI elements from page.
   */
  var destroy = function() {
    $root.parentNode.removeChild($root);
  };

  if (!enabled) {
    destroy();
    return;
  }

  /** @typedef {!{
   *   date: ?number,
   *   option: ?number,
   * }} State
   */

  /**
   * Load state from localStorage.
   * @return {!State}
   */
  var loadState = function() {
    var raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  };

  /**
   * Save state into localStorage.
   * @param {!State} state
   */
  var saveState = function(state) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  };

  var dateObj = new Date();
  var today =
    dateObj.getFullYear() * 10000 +
    (dateObj.getMonth() + 1) * 100 +
    dateObj.getDate();
  var debugRegex = new RegExp(/__tagsmith\.dailyQuiz\.date=(\d+)/);
  if (debugRegex.test(location.hash)) {
    today = parseInt(location.hash.match(debugRegex)[1], 10);
  }

  var state = loadState();

  // If user dismissed today's quiz
  if (state.date === today && state.option === -1) {
    destroy();
    return;
  }

  /**
   * Get today's quiz config.
   * @return {?Quiz} Quiz config or null when no quiz is available.
   */
  var getTodaysQuiz = function() {
    var rangeList = Object.keys(quizConfigs);

    for (var i = 0; i < rangeList.length; i++) {
      var range = rangeList[i].split('-');
      var from = range[0] === '' ? -1 : parseInt(range[0], 10);
      var to =
          // When only single date is specified (e.g. 20240101)
          range.length === 1 ? from :
          // When end date is empty (e.g. 20240101-)
          range[1] === '' ? Infinity :
          // Otherwise
          parseInt(range[1], 10);

      if (isNaN(from) || isNaN(to)) {
        errorReporter && errorReporter('Invalid date range: ' + rangeList[i]);
        continue;
      }

      if (today >= from && today <= to) {
        var quizList = quizConfigs[rangeList[i]];
        var index = (today - from) % quizList.length;
        return quizList[index];
      }
    }

    return null;
  };

  var quiz = getTodaysQuiz();

  if (quiz === null) {
    destroy();
    return;
  }

  var answered = state.date === today && state.option !== -1;

  /**
   * Get answered status to be used in logging.
   * @return {string}
   */
  var answerStatus = function() {
    return answered ? 'answered' : 'notAnswered';
  };

  /**
   * Escape special characters to be used in HTML
   * @param {string} str
   * @return {string} Escaped string
   */
  var escapeHtml = function(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
  };

  var $open = $root.querySelector('.__tagsmith_dailyQuiz_open');
  var $dismiss = $root.querySelector('.__tagsmith_dailyQuiz_dismiss');
  var $container = $root.querySelector('.__tagsmith_dailyQuiz_container');
  var $close = $root.querySelector('[name=close]');

  $open.addEventListener('click', function() {
    $container.style.display = 'flex';

    logger && logger('open.' + answerStatus());
  });

  $dismiss.addEventListener('click', function(e) {
    e.stopPropagation();
    saveState({date: today, option: -1});
    destroy();

    logger && logger('dismiss.' + answerStatus());
  });

  $close.addEventListener('click', function() {
    $container.style.display = 'none';
  });

  var $question = $root.querySelector('[name=question]');
  var $optionList = $root.querySelector('[name=optionList]');
  var $articleLink = $root.querySelector('[name=articleLink]');

  $question.innerHTML = escapeHtml(quiz.question);
  $articleLink.innerHTML = escapeHtml(quiz.link);
  $articleLink.href = quiz.link;

  $articleLink.addEventListener('click', function() {
    logger && logger('openArticle.' + answerStatus());
  });

  /**
   * Check and show the correct answer.
   * @param {number} option The option user chose.
   */
  var answer = function(option) {
    saveState({date: today, option: option});

    var $anwser = $root.querySelector('[data-option="' + quiz.answer + '"]');
    if ($anwser.className.indexOf('__tagsmith_dailyQuiz_answer') === -1) {
      $anwser.className += ' __tagsmith_dailyQuiz_answer';
    }

    var $openIcon = $open.querySelector('.__tagsmith_dailyQuiz_icon');
    if ($openIcon) {
      $openIcon.className = '__tagsmith_dailyQuiz_completed';
    }

    if (!answered) {
      answered = true;
      logger &&
        logger(
            'answer.' +
            (option === quiz.answer ? 'correct.' : 'wrong.') + option
        );
    }
  };

  for (var i = 0; i < quiz.options.length; i++) {
    var number = i + 1;
    var $option = document.createElement('div');
    $option.setAttribute('tabindex', -1);
    $option.className = '__tagsmith_dailyQuiz_option';
    $option.setAttribute('data-option', number);
    $option.innerHTML = escapeHtml(quiz.options[i]);
    $option.addEventListener('click', answer.bind(null, number));
    $optionList.appendChild($option);
  }

  if (answered) {
    answer(state.option);
  }

  $root.style.display = '';

  logger && logger('prompt.' + answerStatus());
})();
