# Daily quiz

Feature ID: `dailyQuiz`

## What it is?

Adds a daily quiz widget to your pages to encourage users to explore more contents on your website, and to increase retention rate.

## What it fits for?

All websites.

## Setup

1. In Google Tag Manager, add following variable(s):

- **Name**: `tagsmith.abVariant.dailyQuiz`
  - **Type**: `Constant`
  - **Value**: Any available experiment variant (e.g. `test1_exp1`)
- **Name**: `tagsmith.dailyQuiz.logoUrl`
  - **Type**: `Constant`
  - **Value**: Logo URL to show in the quiz popup. (Set to `_` if you want to hide the logo)
- **Name**: `tagsmith.dailyQuiz.quizConfigs`
  - **Type**: `Custom JavaScript`
  - **Value**: Quiz configs. See [blow](#tagsmithdailyquizquizconfigs-format) for details.

2. In Google Tag Manager, add following trigger(s):

- **Name**: `Tagsmith - Daily quiz`
  - **Type**: `Page View - DOM Ready`
  - **Fires on**:
    - To enable for all pages: `All DOM Ready Events`
    - To enable for some pages: `Some DOM Ready Events`, choose `Page Path` or `Page URL` (both are built-in variables), and set appropriate condition & value to match the pages you want to enable for.

3. In Google Tag Manager, add following tag(s):

- **Name**: `Tagsmith - Daily quiz`
  - **Type**: `Custom HTML`
  - **HTML**: Copy/paste from [this file](https://raw.githubusercontent.com/google-marketing-solutions/tagsmith/main/dist/tags/features/daily-quiz.html)
    - To customize prompt button's position and/or UI text, search for `#region Customize` in the HTML above.
  - **Advanced Settings**
    - **Tag firing options**: `Once per page`
  - **Firing Triggers**: `Tagsmith - Daily quiz`

4. Preview to see if everything works
5. Submit & publish

## `tagsmith.dailyQuiz.quizConfigs` format

Basic format:
```js
function() {
  return {
    '{Date range}': [
      {
        question: '{Question text}',
        options: [
          '{Option 1 text}',
          '{Option 2 text}',
          '{Option 3 text}',
          '{Option 4 text}'
        ],
        answer: {Correct answer number},
        link: '{Link for reference}'
      }
    ]
  };
}
```

- `{Date range}`: Date range represented in `YYYYMMDD-YYYYMMDD`.
  - Single date example: `20240120` (Jan 20th, 2024)
  - Date range example 1: `20240120-20240126` (Jan 20th, 2024 to Jan 26th, 2024)
  - Date range example 2: `20240120-` (Jan 20th, 2024 to the end of time)
- `{Question text}`: The question.
  - If you have `'` in the text, replace it with `\'`
  - Don't include line breaks.
- `{Option 1/2/3… text}`: The options.
  - You can have as many/less options as needed.
  - If you have `'` in the text, replace it with `\'`
  - Don't include line breaks.
- `{Correct answer number}`: Correct answer's number (starting from 1).
  - Example, if the third option is correct, enter `3`.
  - Note that there **AREN'T** `'`s surrounding the number.
- `{Link for reference}`: URL to show below the quiz.
  - Typically, this should be the page where user can find answer to the quiz.
  - If you have `'` in the URL, replace it with `\'`

For easier operation, you can input multiple date range blocks and quiz blocks like below. (Please pay attention to the `,` between each date range and quiz.)
```js
function() {
  return {
    '20240120': [
      {
        question: 'Question 20240120',
        options: [
          'Option 1',
          'Option 2',
          'Option 3',
          'Option 4'
        ],
        answer: 2,
        link: 'https://example.com/20240120'
      }
    ],
    '20240121-20240127': [
      {
        question: 'Question 1',
        options: [
          'Option 1',
          'Option 2',
          'Option 3',
          'Option 4'
        ],
        answer: 3,
        link: 'https://example.com/1'
      },
      {
        question: 'Question 2',
        options: [
          'Option 1',
          'Option 2',
          'Option 3',
          'Option 4'
        ],
        answer: 1,
        link: 'https://example.com/2'
      },
      {
        question: 'Question 3',
        options: [
          'Option 1',
          'Option 2',
          'Option 3',
          'Option 4'
        ],
        answer: 4,
        link: 'https://example.com/3'
      }
    ]
  };
}
```
When there are multiple quizs in a date range, the quizs will be looped. In the example above, these are the questions used:
- `20240121`: Question 1
- `20240122`: Question 2
- `20240123`: Question 3
- `20240124`: Question 1
- `20240125`: Question 2
- `20240126`: Question 3
- `20240127`: Question 1

## Automatically collected GA4 events for A/B testing

| tagsmith_event_id | tagsmith_event_value | Description |
| ----------------- | -------------------- | ----------- |
| dailyQuiz.prompt.answered/notAnswered | N/A | Recorded when daily quiz prompt button is shown. |
| dailyQuiz.open.answered/notAnswered | N/A | Recorded when user clicks the prompt button and popup opened. |
| dailyQuiz.answer.correct/wrong.{optionChosen} | N/A | Recorded when user clicks an option. |
| dailyQuiz.openArticle.answered/notAnswered | N/A | Recorded when user clicks the article link. |
| dailyQuiz.dismiss.answered/notAnswered | N/A | Recorded when user clicks the "X" icon on prompt button and dismissed the quiz. |


