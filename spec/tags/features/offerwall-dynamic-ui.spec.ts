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

import * as fs from 'fs';
import {Page} from 'puppeteer';
import * as browser from '../../helpers/browser';

const OFFERWALL_MOCK = fs
    .readFileSync('spec/helpers/offerwall_mock.html')
    .toString();

/**
 * Dynamically inject offerwall UI to document.
 * @param {Page} page
 */
async function mockOfferwall(page: Page) {
  await page.evaluate(
      'document.body.insertAdjacentHTML(\'beforeend\', `' +
      OFFERWALL_MOCK.replaceAll('`', '\\`') +
      '`)'
  );
}

describe('Offerwall Dynamic UI', () => {
  beforeEach(browser.launch);
  afterEach(browser.close);

  it('should do nothing if MutationObserver isn\'t avaiable', async () => {
    const page = await browser.generatePage({
      injection: {
        beforeSnippet: '<script>window.MutationObserver = undefined</script>',
      },
      variantByFeature: {'offerwall-dynamic-ui': 'test1_exp1'},
      variables: {
        'tagsmith.offerwallDynamicUi.headlineText': 'mod headline',
        'tagsmith.offerwallDynamicUi.bodyText': 'mod body',
        'tagsmith.offerwallDynamicUi.rewardedAdOptionText':
          'mod rewarded ad option text',
        'tagsmith.offerwallDynamicUi.rewardedAdOptionSubtext':
          'mod rewarded ad option subtext',
      },
      forceAbFactor: 0.07,
    });

    await mockOfferwall(page);

    expect(
        await page.evaluate(
            `document.querySelector('.fc-dialog-headline-text').innerText`
        )
    ).toEqual('headline text');
    expect(
        await page.evaluate(
            `document.querySelector('.fc-dialog-body-text').innerText`
        )
    ).toEqual('body text');
    expect(
        await page.evaluate(
            `document.querySelector('.fc-rewarded-ad-option-text').innerText`
        )
    ).toEqual('rewarded ad option text');
    expect(
        await page.evaluate(
            `document.querySelector('.fc-rewarded-ad-option-subtext').innerText`
        )
    ).toEqual('rewarded ad option subtext');
  });

  it('should modify UI when MutationObserver is avaiable', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'offerwall-dynamic-ui': 'test1_exp1'},
      variables: {
        'tagsmith.offerwallDynamicUi.headlineText': 'mod headline',
        'tagsmith.offerwallDynamicUi.bodyText': 'mod body',
        'tagsmith.offerwallDynamicUi.rewardedAdOptionText':
          'mod rewarded ad option text',
        'tagsmith.offerwallDynamicUi.rewardedAdOptionSubtext':
          'mod rewarded ad option subtext',
      },
      forceAbFactor: 0.07,
    });

    await mockOfferwall(page);

    expect(
        await page.evaluate(
            `document.querySelector('.fc-dialog-headline-text').innerText`
        )
    ).toEqual('mod headline');
    expect(
        await page.evaluate(
            `document.querySelector('.fc-dialog-body-text').innerText`
        )
    ).toEqual('mod body');
    expect(
        await page.evaluate(
            `document.querySelector('.fc-rewarded-ad-option-text').innerText`
        )
    ).toEqual('mod rewarded ad option text');
    expect(
        await page.evaluate(
            `document.querySelector('.fc-rewarded-ad-option-subtext').innerText`
        )
    ).toEqual('mod rewarded ad option subtext');
  });

  it('should keep original text if replacement value is _', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'offerwall-dynamic-ui': 'test1_exp1'},
      variables: {
        'tagsmith.offerwallDynamicUi.headlineText': '_',
        'tagsmith.offerwallDynamicUi.bodyText': '_',
        'tagsmith.offerwallDynamicUi.rewardedAdOptionText': '_',
        'tagsmith.offerwallDynamicUi.rewardedAdOptionSubtext': '_',
      },
      forceAbFactor: 0.07,
    });

    await mockOfferwall(page);

    expect(
        await page.evaluate(
            `document.querySelector('.fc-dialog-headline-text').innerText`
        )
    ).toEqual('headline text');
    expect(
        await page.evaluate(
            `document.querySelector('.fc-dialog-body-text').innerText`
        )
    ).toEqual('body text');
    expect(
        await page.evaluate(
            `document.querySelector('.fc-rewarded-ad-option-text').innerText`
        )
    ).toEqual('rewarded ad option text');
    expect(
        await page.evaluate(
            `document.querySelector('.fc-rewarded-ad-option-subtext').innerText`
        )
    ).toEqual('rewarded ad option subtext');
  });

  it('should log events', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'offerwall-dynamic-ui': 'test1_exp1'},
      variables: {
        'tagsmith.offerwallDynamicUi.headlineText': 'mod headline',
        'tagsmith.offerwallDynamicUi.bodyText': 'mod body',
        'tagsmith.offerwallDynamicUi.rewardedAdOptionText':
          'mod rewarded ad option text',
        'tagsmith.offerwallDynamicUi.rewardedAdOptionSubtext':
          'mod rewarded ad option subtext',
      },
      forceAbFactor: 0.07,
    });

    await mockOfferwall(page);

    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'offerwallDynamicUi.prompt',
    });

    await page.click(`.fc-rewarded-ad-button`);

    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'offerwallDynamicUi.click',
      value: 'fc-rewarded-ad-button',
    });

    await new Promise((r) => setTimeout(r, 500));

    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'offerwallDynamicUi.complete',
    });
  });
});
