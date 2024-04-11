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

import * as browser from '../../helpers/browser';

type Quiz = {
  question: string;
  options: string[];
  answer: number;
  link: string;
};

/**
 * Generate quiz configs variable used in tag.
 */
function generateQuizConfigsVariable(configs: {
  [dateRange: string]: Quiz[];
}): string {
  return `(function() {
    return ${JSON.stringify(configs)};
  })()`;
}

const COMMON_QUIZ_CONFIGS = generateQuizConfigsVariable({
  '99999901': [
    {
      question: 'Question',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      answer: 2,
      link: 'https://sample.com',
    },
  ],
  '99999902': [
    {
      question: 'Another question',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      answer: 3,
      link: 'https://sample.com',
    },
  ],
});

describe('Daily quiz', () => {
  beforeEach(browser.launch);
  afterEach(browser.close);

  it('should destroy root and no-logging for irrelevant variant', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'daily-quiz': 'test1_exp1'},
      variables: {
        'tagsmith.dailyQuiz.quizConfigs': COMMON_QUIZ_CONFIGS,
        'tagsmith.dailyQuiz.logoUrl': '_',
      },
      forceAbFactor: 0.99,
      urlHash: '#__tagsmith.dailyQuiz.date=99999901',
    });

    expect(await page.$('#__tagsmith_dailyQuiz')).toBeNull();

    expect(await page.evaluate(`window.dataLayer.shift()`)).toBeUndefined();
  });

  it('should destroy root and no-logging for control variant', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'daily-quiz': 'test1_exp1'},
      variables: {
        'tagsmith.dailyQuiz.quizConfigs': COMMON_QUIZ_CONFIGS,
        'tagsmith.dailyQuiz.logoUrl': '_',
      },
      forceAbFactor: 0.01,
      urlHash: '#__tagsmith.dailyQuiz.date=99999901',
    });

    expect(await page.$('#__tagsmith_dailyQuiz')).toBeNull();

    expect(await page.evaluate(`window.dataLayer.shift()`)).toBeUndefined();
  });

  it('should destroy if no quiz is available for the day', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'daily-quiz': 'test1_exp1'},
      variables: {
        'tagsmith.dailyQuiz.quizConfigs': COMMON_QUIZ_CONFIGS,
        'tagsmith.dailyQuiz.logoUrl': '_',
      },
      forceAbFactor: 0.07,
      urlHash: '#__tagsmith.dailyQuiz.date=99999999',
    });

    expect(await page.$('#__tagsmith_dailyQuiz')).toBeNull();

    expect(await page.evaluate(`window.dataLayer.shift()`)).toBeUndefined();
  });

  it('should escape special characters', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'daily-quiz': 'test1_exp1'},
      variables: {
        'tagsmith.dailyQuiz.quizConfigs': generateQuizConfigsVariable({
          '99999901': [
            {
              question: '&lt; <b>tag</b>, "double quote", \'single quote\'',
              options: ['&lt; <b>tag</b>, "double quote", \'single quote\''],
              answer: 1,
              link: 'https://sample.com/&lt;<b>tag</b>,"double quote",\'single quote\'',
            },
          ],
        }),
        'tagsmith.dailyQuiz.logoUrl': '_',
      },
      forceAbFactor: 0.07,
      urlHash: '#__tagsmith.dailyQuiz.date=99999901',
    });

    expect(
        await (
          await page.$('.__tagsmith_dailyQuiz_question')
        )?.evaluate((ele) => ele.innerHTML)
    ).toEqual(
        // Browser converts &quot; and &#039; back to double/single quote.
        `&amp;lt; &lt;b&gt;tag&lt;/b&gt;, "double quote", 'single quote'`
    );

    expect(
        await (
          await page.$('.__tagsmith_dailyQuiz_option[data-option="1"]')
        )?.evaluate((ele) => ele.innerHTML)
    ).toEqual(
        // Browser converts &quot; and &#039; back to double/single quote.
        `&amp;lt; &lt;b&gt;tag&lt;/b&gt;, "double quote", 'single quote'`
    );

    expect(
        await (
          await page.$('#__tagsmith_dailyQuiz [name="articleLink"]')
        )?.evaluate((ele) => ele.innerHTML)
    ).toEqual(
        // Browser converts &quot; and &#039; back to double/single quote.
        `https://sample.com/&amp;lt;&lt;b&gt;tag&lt;/b&gt;,"double quote",'single quote'`
    );

    expect(
        await (
          await page.$('#__tagsmith_dailyQuiz [name="articleLink"]')
        )?.evaluate((ele) => ele.href)
    ).toEqual(
        `https://sample.com/&lt;%3Cb%3Etag%3C/b%3E,%22double%20quote%22,'single%20quote'`
    );
  });

  it('should show logo', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'daily-quiz': 'test1_exp1'},
      variables: {
        'tagsmith.dailyQuiz.quizConfigs': COMMON_QUIZ_CONFIGS,
        'tagsmith.dailyQuiz.logoUrl': 'https://placehold.co/300x60',
      },
      forceAbFactor: 0.07,
      urlHash: '#__tagsmith.dailyQuiz.date=99999901',
    });

    await page.click('.__tagsmith_dailyQuiz_open');

    expect(
        await (await page.$('.__tagsmith_dailyQuiz_logo'))?.isVisible()
    ).toBeTrue();

    expect(
        await (
          await page.$('.__tagsmith_dailyQuiz_logo')
        )?.evaluate((ele) => ele.src)
    ).toEqual('https://placehold.co/300x60');
  });

  it('should hide logo when it\'s _', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'daily-quiz': 'test1_exp1'},
      variables: {
        'tagsmith.dailyQuiz.quizConfigs': COMMON_QUIZ_CONFIGS,
        'tagsmith.dailyQuiz.logoUrl': '_',
      },
      forceAbFactor: 0.07,
      urlHash: '#__tagsmith.dailyQuiz.date=99999901',
    });

    await page.click('.__tagsmith_dailyQuiz_open');

    expect(
        await (await page.$('.__tagsmith_dailyQuiz_logo'))?.isHidden()
    ).toBeTrue();
  });

  it('should render even when no options exist', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'daily-quiz': 'test1_exp1'},
      variables: {
        'tagsmith.dailyQuiz.quizConfigs': generateQuizConfigsVariable({
          '99999901': [
            {
              question: 'No options',
              options: [],
              answer: 0,
              link: 'https://sample.com',
            },
          ],
        }),
        'tagsmith.dailyQuiz.logoUrl': '_',
      },
      forceAbFactor: 0.07,
      urlHash: '#__tagsmith.dailyQuiz.date=99999901',
    });

    await page.click('.__tagsmith_dailyQuiz_open');

    expect(
        await (
          await page.$('#__tagsmith_dailyQuiz [name="optionList"]')
        )?.evaluate((ele) => ele.childNodes.length)
    ).toEqual(0);
  });

  it('should render single option question', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'daily-quiz': 'test1_exp1'},
      variables: {
        'tagsmith.dailyQuiz.quizConfigs': generateQuizConfigsVariable({
          '99999901': [
            {
              question: '1 option',
              options: ['Option 1'],
              answer: 1,
              link: 'https://sample.com',
            },
          ],
        }),
        'tagsmith.dailyQuiz.logoUrl': '_',
      },
      forceAbFactor: 0.07,
      urlHash: '#__tagsmith.dailyQuiz.date=99999901',
    });

    await page.click('.__tagsmith_dailyQuiz_open');

    expect(
        await (
          await page.$('#__tagsmith_dailyQuiz [name="optionList"]')
        )?.evaluate((ele) => ele.childNodes.length)
    ).toEqual(1);

    expect(
        await (
          await page.$('.__tagsmith_dailyQuiz_option[data-option="1"]')
        )?.evaluate((ele) => ele.innerHTML)
    ).toEqual('Option 1');
  });

  it('should render 4 options question', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'daily-quiz': 'test1_exp1'},
      variables: {
        'tagsmith.dailyQuiz.quizConfigs': generateQuizConfigsVariable({
          '99999901': [
            {
              question: '4 options',
              options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
              answer: 2,
              link: 'https://sample.com',
            },
          ],
        }),
        'tagsmith.dailyQuiz.logoUrl': '_',
      },
      forceAbFactor: 0.07,
      urlHash: '#__tagsmith.dailyQuiz.date=99999901',
    });

    await page.click('.__tagsmith_dailyQuiz_open');

    expect(
        await (
          await page.$('#__tagsmith_dailyQuiz [name="optionList"]')
        )?.evaluate((ele) => ele.childNodes.length)
    ).toEqual(4);

    for (let i = 1; i <= 4; i++) {
      expect(
          await (
            await page.$(`.__tagsmith_dailyQuiz_option[data-option="${i}"]`)
          )?.evaluate((ele) => ele.innerHTML)
      ).toEqual(`Option ${i}`);
    }
  });

  it('should render 10 options question', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'daily-quiz': 'test1_exp1'},
      variables: {
        'tagsmith.dailyQuiz.quizConfigs': generateQuizConfigsVariable({
          '99999901': [
            {
              question: '10 options',
              options: [
                'Option 1',
                'Option 2',
                'Option 3',
                'Option 4',
                'Option 5',
                'Option 6',
                'Option 7',
                'Option 8',
                'Option 9',
                'Option 10',
              ],
              answer: 8,
              link: 'https://sample.com',
            },
          ],
        }),
        'tagsmith.dailyQuiz.logoUrl': '_',
      },
      forceAbFactor: 0.07,
      urlHash: '#__tagsmith.dailyQuiz.date=99999901',
    });

    await page.click('.__tagsmith_dailyQuiz_open');

    expect(
        await (
          await page.$('#__tagsmith_dailyQuiz [name="optionList"]')
        )?.evaluate((ele) => ele.childNodes.length)
    ).toEqual(10);

    for (let i = 1; i <= 10; i++) {
      expect(
          await (
            await page.$(`.__tagsmith_dailyQuiz_option[data-option="${i}"]`)
          )?.evaluate((ele) => ele.innerHTML)
      ).toEqual(`Option ${i}`);
    }
  });

  it('should render even when answer is outside options', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'daily-quiz': 'test1_exp1'},
      variables: {
        'tagsmith.dailyQuiz.quizConfigs': generateQuizConfigsVariable({
          '99999901': [
            {
              question: 'Answer outside options',
              options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
              answer: 5,
              link: 'https://sample.com',
            },
          ],
        }),
        'tagsmith.dailyQuiz.logoUrl': '_',
      },
      forceAbFactor: 0.07,
      urlHash: '#__tagsmith.dailyQuiz.date=99999901',
    });

    await page.click('.__tagsmith_dailyQuiz_open');

    for (let i = 1; i <= 4; i++) {
      expect(
          await (
            await page.$(`.__tagsmith_dailyQuiz_option[data-option="${i}"]`)
          )?.evaluate((ele) => ele.innerHTML)
      ).toEqual(`Option ${i}`);
    }

    await page.click('.__tagsmith_dailyQuiz_option[data-option="1"]');

    expect(await page.$(`.__tagsmith_dailyQuiz_answer`)).toBeNull();
  });

  /**
   * Test if the right question is rendered for `date`.
   * @returns {Page}
   */
  async function testDateRange(
      quizConfigs: { [dateRange: string]: Quiz[] },
      date: string,
      exptectedQuestion: string | null
  ) {
    const page = await browser.generatePage({
      variantByFeature: {'daily-quiz': 'test1_exp1'},
      variables: {
        'tagsmith.dailyQuiz.quizConfigs':
          generateQuizConfigsVariable(quizConfigs),
        'tagsmith.dailyQuiz.logoUrl': '_',
      },
      forceAbFactor: 0.07,
      urlHash: '#__tagsmith.dailyQuiz.date=' + date,
    });

    if (exptectedQuestion !== null) {
      expect(
          await (
            await page.$('#__tagsmith_dailyQuiz [name="question"]')
          )?.evaluate((ele) => ele.innerHTML)
      ).toEqual(exptectedQuestion);
    } else {
      expect(await page.$('#__tagsmith_dailyQuiz')).toBeNull();
    }

    return page;
  }

  it('should loop questions in date range', async () => {
    const quizConfigs = {
      '99999901-99999910': [
        {
          question: 'Question 1',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          answer: 2,
          link: 'https://sample.com',
        },
        {
          question: 'Question 2',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          answer: 2,
          link: 'https://sample.com',
        },
        {
          question: 'Question 3',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          answer: 2,
          link: 'https://sample.com',
        },
      ],
    };

    // Within date range
    await testDateRange(quizConfigs, '99999901', 'Question 1');
    await testDateRange(quizConfigs, '99999902', 'Question 2');
    await testDateRange(quizConfigs, '99999903', 'Question 3');
    await testDateRange(quizConfigs, '99999904', 'Question 1');
    await testDateRange(quizConfigs, '99999905', 'Question 2');
    await testDateRange(quizConfigs, '99999906', 'Question 3');
    await testDateRange(quizConfigs, '99999910', 'Question 1');

    // Outside date range
    await testDateRange(quizConfigs, '99999900', null);
    await testDateRange(quizConfigs, '99999911', null);
  });

  it('should support start date only config', async () => {
    const quizConfigs = {
      '99999901-': [
        {
          question: 'Question 1',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          answer: 2,
          link: 'https://sample.com',
        },
        {
          question: 'Question 2',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          answer: 2,
          link: 'https://sample.com',
        },
        {
          question: 'Question 3',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          answer: 2,
          link: 'https://sample.com',
        },
      ],
    };

    // Within date range
    await testDateRange(quizConfigs, '99999901', 'Question 1');
    await testDateRange(quizConfigs, '99999902', 'Question 2');
    await testDateRange(quizConfigs, '99999903', 'Question 3');
    await testDateRange(quizConfigs, '99999904', 'Question 1');
    await testDateRange(quizConfigs, '99999905', 'Question 2');
    await testDateRange(quizConfigs, '99999906', 'Question 3');
    await testDateRange(quizConfigs, '99999910', 'Question 1');

    // Outside date range
    await testDateRange(quizConfigs, '99999900', null);
  });

  it('should support end date only config', async () => {
    const quizConfigs = {
      '-99999910': [
        {
          question: 'Question 1',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          answer: 2,
          link: 'https://sample.com',
        },
        {
          question: 'Question 2',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          answer: 2,
          link: 'https://sample.com',
        },
        {
          question: 'Question 3',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          answer: 2,
          link: 'https://sample.com',
        },
      ],
    };

    // Within date range
    await testDateRange(quizConfigs, '99999901', 'Question 3');
    await testDateRange(quizConfigs, '99999902', 'Question 1');
    await testDateRange(quizConfigs, '99999903', 'Question 2');
    await testDateRange(quizConfigs, '99999904', 'Question 3');
    await testDateRange(quizConfigs, '99999905', 'Question 1');
    await testDateRange(quizConfigs, '99999906', 'Question 2');
    await testDateRange(quizConfigs, '99999910', 'Question 3');

    // Outside date range
    await testDateRange(quizConfigs, '99999911', null);
  });

  fit('should report error for invalid date range', async () => {
    const quizConfigs = {
      '２０２４０１０１-２０２４０１１０': [
        {
          question: 'Question',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          answer: 2,
          link: 'https://sample.com',
        },
      ],
    };

    const page = await testDateRange(quizConfigs, '20240102', null);

    const errors = await browser.getErrorsFromDebugger(page);
    expect(errors.pop()).toEqual(
        '"dailyQuiz": Invalid date range: ２０２４０１０１-２０２４０１１０'
    );
  });

  it('should open/close popup', async () => {
    const pageConfig = {
      variantByFeature: {'daily-quiz': 'test1_exp1'},
      variables: {
        'tagsmith.dailyQuiz.quizConfigs': COMMON_QUIZ_CONFIGS,
        'tagsmith.dailyQuiz.logoUrl': '_',
      },
      forceAbFactor: 0.07,
      urlHash: '#__tagsmith.dailyQuiz.date=99999901',
    };
    let page = await browser.generatePage(pageConfig);

    // Root exists
    expect(await page.$('#__tagsmith_dailyQuiz')).not.toBeNull();

    // Open button visible
    expect(
        await (await page.$('.__tagsmith_dailyQuiz_open'))?.isVisible()
    ).toBeTrue();

    // Sent prompt event
    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'dailyQuiz.prompt.notAnswered',
    });

    // Click open button
    await page.click('.__tagsmith_dailyQuiz_open');

    // Popup visible
    expect(
        await (await page.$('.__tagsmith_dailyQuiz_popup'))?.isVisible()
    ).toBeTrue();

    // Sent popup open event
    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'dailyQuiz.open.notAnswered',
    });

    // Click close button
    await page.click('.__tagsmith_dailyQuiz_close');

    // Popup hidden
    expect(
        await (await page.$('.__tagsmith_dailyQuiz_popup'))?.isHidden()
    ).toBeTrue();

    // Container hidden
    expect(
        await (await page.$('.__tagsmith_dailyQuiz_container'))?.isHidden()
    ).toBeTrue();

    // Open again
    await page.click('.__tagsmith_dailyQuiz_open');

    // Open event sent again
    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'dailyQuiz.open.notAnswered',
    });

    // Click correct answer
    await page.click('.__tagsmith_dailyQuiz_option[data-option="2"]');

    // Reopen page
    page = await browser.generatePage(pageConfig);

    // Sent prompt event with answered status
    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'dailyQuiz.prompt.answered',
    });

    // Click open button
    await page.click('.__tagsmith_dailyQuiz_open');

    // Sent popup open event with answered status
    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'dailyQuiz.open.answered',
    });
  });

  it('should be dismissable before answering', async () => {
    const pageConfig = {
      variantByFeature: {'daily-quiz': 'test1_exp1'},
      variables: {
        'tagsmith.dailyQuiz.quizConfigs': COMMON_QUIZ_CONFIGS,
        'tagsmith.dailyQuiz.logoUrl': '_',
      },
      forceAbFactor: 0.07,
      urlHash: '#__tagsmith.dailyQuiz.date=99999901',
    };

    let page = await browser.generatePage(pageConfig);

    // Sent prompt event
    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'dailyQuiz.prompt.notAnswered',
    });

    // Dismiss
    await page.click('.__tagsmith_dailyQuiz_dismiss');

    // Root destroyed
    expect(await page.$('#__tagsmith_dailyQuiz')).toBeNull();

    // Sent dismiss event
    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'dailyQuiz.dismiss.notAnswered',
    });

    // Reopen page
    page = await browser.generatePage(pageConfig);

    // Root destroyed
    expect(await page.$('#__tagsmith_dailyQuiz')).toBeNull();

    // No event sent
    expect(await page.evaluate(`window.dataLayer.shift()`)).toBeUndefined();
  });

  it('should be dismissable after answering', async () => {
    const pageConfig = {
      variantByFeature: {'daily-quiz': 'test1_exp1'},
      variables: {
        'tagsmith.dailyQuiz.quizConfigs': COMMON_QUIZ_CONFIGS,
        'tagsmith.dailyQuiz.logoUrl': '_',
      },
      forceAbFactor: 0.07,
      urlHash: '#__tagsmith.dailyQuiz.date=99999901',
    };

    let page = await browser.generatePage(pageConfig);

    // Sent prompt event
    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'dailyQuiz.prompt.notAnswered',
    });

    // Click open button
    await page.click('.__tagsmith_dailyQuiz_open');

    // Skip open event
    await page.evaluate(`window.dataLayer.shift()`);

    // Click correct answer
    await page.click('.__tagsmith_dailyQuiz_option[data-option="2"]');

    // Skip answer event
    await page.evaluate(`window.dataLayer.shift()`);

    // Click close button
    await page.click('.__tagsmith_dailyQuiz_close');

    // Dismiss
    await page.click('.__tagsmith_dailyQuiz_dismiss');

    // Root destroyed
    expect(await page.$('#__tagsmith_dailyQuiz')).toBeNull();

    // Sent dismiss event
    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'dailyQuiz.dismiss.answered',
    });

    // Reopen page
    page = await browser.generatePage(pageConfig);

    // Root destroyed
    expect(await page.$('#__tagsmith_dailyQuiz')).toBeNull();

    // No event sent
    expect(await page.evaluate(`window.dataLayer.shift()`)).toBeUndefined();
  });

  it('should have article link', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'daily-quiz': 'test1_exp1'},
      variables: {
        'tagsmith.dailyQuiz.quizConfigs': COMMON_QUIZ_CONFIGS,
        'tagsmith.dailyQuiz.logoUrl': '_',
      },
      forceAbFactor: 0.07,
      urlHash: '#__tagsmith.dailyQuiz.date=99999901',
    });

    // Skip prompt event
    await page.evaluate(`window.dataLayer.shift()`);

    // Click open button
    await page.click('.__tagsmith_dailyQuiz_open');

    // Skip open event
    await page.evaluate(`window.dataLayer.shift()`);

    // Check article link navigation
    await browser.navigationHook(
        page,
        async () => await page.click('[name=articleLink]'),
        async (request) => {
          expect(request.isNavigationRequest()).toBeTrue();
          expect(request.frame() === page.mainFrame()).toBeTrue();
          expect(request.url()).toEqual('https://sample.com/');
        }
    );

    // Sent open article event with not answered status
    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'dailyQuiz.openArticle.notAnswered',
    });

    // Click correct answer
    await page.click('.__tagsmith_dailyQuiz_option[data-option="2"]');

    // Skip answer event
    await page.evaluate(`window.dataLayer.shift()`);

    // Check article link navigation
    await browser.navigationHook(
        page,
        async () => await page.click('[name=articleLink]'),
        async (request) => {
          expect(request.isNavigationRequest()).toBeTrue();
          expect(request.frame() === page.mainFrame()).toBeTrue();
          expect(request.url()).toEqual('https://sample.com/');
        }
    );

    // Sent open article event with answered status
    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'dailyQuiz.openArticle.answered',
    });
  });

  it('should be answerable: wrong answer case', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'daily-quiz': 'test1_exp1'},
      variables: {
        'tagsmith.dailyQuiz.quizConfigs': COMMON_QUIZ_CONFIGS,
        'tagsmith.dailyQuiz.logoUrl': '_',
      },
      forceAbFactor: 0.07,
      urlHash: '#__tagsmith.dailyQuiz.date=99999901',
    });

    // Skip prompt event
    await page.evaluate(`window.dataLayer.shift()`);

    // Click open button
    await page.click('.__tagsmith_dailyQuiz_open');

    // Skip open event
    await page.evaluate(`window.dataLayer.shift()`);

    // Click wrong answer
    await page.click('.__tagsmith_dailyQuiz_option[data-option="1"]');

    // Correct answer highlighted
    expect(
        await (
          await page.$('.__tagsmith_dailyQuiz_option[data-option="2"]')
        )?.evaluate((ele) => ele.className)
    ).toMatch(/\b__tagsmith_dailyQuiz_answer\b/);

    // Open button changed to completed
    expect(
        // eslint-disable-next-line max-len
        await page.$('.__tagsmith_dailyQuiz_open .__tagsmith_dailyQuiz_completed')
    ).not.toBeNull();

    // Sent answer event
    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'dailyQuiz.answer.wrong.1',
    });

    // Click wrong answer again
    await page.click('.__tagsmith_dailyQuiz_option[data-option="1"]');

    // No event sent
    expect(await page.evaluate(`window.dataLayer.shift()`)).toBeUndefined();

    // Click correct answer
    await page.click('.__tagsmith_dailyQuiz_option[data-option="2"]');

    // No event sent
    expect(await page.evaluate(`window.dataLayer.shift()`)).toBeUndefined();

    // Close popup
    await page.click('.__tagsmith_dailyQuiz_close');

    // Open popup again
    await page.click('.__tagsmith_dailyQuiz_open');

    // Correct answer still highlighted
    expect(
        await (
          await page.$('.__tagsmith_dailyQuiz_option[data-option="2"]')
        )?.evaluate((ele) => ele.className)
    ).toMatch(/\b__tagsmith_dailyQuiz_answer\b/);
  });

  it('should be answerable: correct answer case', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'daily-quiz': 'test1_exp1'},
      variables: {
        'tagsmith.dailyQuiz.quizConfigs': COMMON_QUIZ_CONFIGS,
        'tagsmith.dailyQuiz.logoUrl': '_',
      },
      forceAbFactor: 0.07,
      urlHash: '#__tagsmith.dailyQuiz.date=99999901',
    });

    // Skip prompt event
    await page.evaluate(`window.dataLayer.shift()`);

    // Click open button
    await page.click('.__tagsmith_dailyQuiz_open');

    // Skip open event
    await page.evaluate(`window.dataLayer.shift()`);

    // Click correct answer
    await page.click('.__tagsmith_dailyQuiz_option[data-option="2"]');

    // Correct answer highlighted
    expect(
        await (
          await page.$('.__tagsmith_dailyQuiz_option[data-option="2"]')
        )?.evaluate((ele) => ele.className)
    ).toMatch(/\b__tagsmith_dailyQuiz_answer\b/);

    // Open button changed to completed
    expect(
        // eslint-disable-next-line max-len
        await page.$('.__tagsmith_dailyQuiz_open .__tagsmith_dailyQuiz_completed')
    ).not.toBeNull();

    // Sent answer event
    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'dailyQuiz.answer.correct.2',
    });

    // Click correct answer again
    await page.click('.__tagsmith_dailyQuiz_option[data-option="2"]');

    // No event sent
    expect(await page.evaluate(`window.dataLayer.shift()`)).toBeUndefined();

    // Click wrong answer
    await page.click('.__tagsmith_dailyQuiz_option[data-option="1"]');

    // No event sent
    expect(await page.evaluate(`window.dataLayer.shift()`)).toBeUndefined();

    // Close popup
    await page.click('.__tagsmith_dailyQuiz_close');

    // Open popup again
    await page.click('.__tagsmith_dailyQuiz_open');

    // Correct answer still highlighted
    expect(
        await (
          await page.$('.__tagsmith_dailyQuiz_option[data-option="2"]')
        )?.evaluate((ele) => ele.className)
    ).toMatch(/\b__tagsmith_dailyQuiz_answer\b/);
  });

  it('should keep the answer status, but reset on next day', async () => {
    const pageConfig = {
      variantByFeature: {'daily-quiz': 'test1_exp1'},
      variables: {
        'tagsmith.dailyQuiz.quizConfigs': COMMON_QUIZ_CONFIGS,
        'tagsmith.dailyQuiz.logoUrl': '_',
      },
      forceAbFactor: 0.07,
      urlHash: '#__tagsmith.dailyQuiz.date=99999901',
    };
    let page = await browser.generatePage(pageConfig);

    // Click open button
    await page.click('.__tagsmith_dailyQuiz_open');

    // Click an answer
    await page.click('.__tagsmith_dailyQuiz_option[data-option="1"]');

    // Reopen the page
    page = await browser.generatePage(pageConfig);

    // Open button is in complete status
    expect(
        // eslint-disable-next-line max-len
        await page.$('.__tagsmith_dailyQuiz_open .__tagsmith_dailyQuiz_completed')
    ).not.toBeNull();

    // Sent prompt event with answered state
    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'dailyQuiz.prompt.answered',
    });

    // Open popup
    await page.click('.__tagsmith_dailyQuiz_open');

    // Sent open event with answered state
    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'dailyQuiz.open.answered',
    });

    // Correct answer still highlighted
    expect(
        await (
          await page.$('.__tagsmith_dailyQuiz_option[data-option="2"]')
        )?.evaluate((ele) => ele.className)
    ).toMatch(/\b__tagsmith_dailyQuiz_answer\b/);

    // Go to next day
    pageConfig.urlHash = '#__tagsmith.dailyQuiz.date=99999902';

    // Reopen the page
    page = await browser.generatePage(pageConfig);

    // Open button isn't in complete status
    expect(
        // eslint-disable-next-line max-len
        await page.$('.__tagsmith_dailyQuiz_open .__tagsmith_dailyQuiz_completed')
    ).toBeNull();

    // Sent prompt event with not answered state
    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'dailyQuiz.prompt.notAnswered',
    });

    // Open popup
    await page.click('.__tagsmith_dailyQuiz_open');

    // Sent open event with not answered state
    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'dailyQuiz.open.notAnswered',
    });

    // Correct answer not highlighted
    expect(
        await (
          await page.$('.__tagsmith_dailyQuiz_option[data-option="3"]')
        )?.evaluate((ele) => ele.className)
    ).not.toMatch(/\b__tagsmith_dailyQuiz_answer\b/);
  });
});
