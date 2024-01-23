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

import * as browser from '../../helpers/browser';

describe('Logger', () => {
  beforeEach(browser.launch);
  afterEach(browser.close);

  it('should not be enabled for feature enabled for all', async () => {
    const page = await browser.generatePage({
      frameworks: ['logger'],
    });

    expect(await page.evaluate(
        `__tagsmith.getLogger('anyFeature', 'all')`
    )).toBeFalse();
  });

  it(`should not be enabled for different test's variants`, async () => {
    const page = await browser.generatePage({
      frameworks: ['logger'],
      forceAbFactor: 0.07, // test1_exp1
    });

    expect(await page.evaluate(
        `__tagsmith.getLogger('anyFeature', 'test2_exp1')`
    )).toBeFalse();
  });

  it(`should be enabled for all test's variants`, async () => {
    const page = await browser.generatePage({
      frameworks: ['logger'],
      forceAbFactor: 0.07, // test1_exp1
    });

    expect(await page.evaluate(
        `__tagsmith.getLogger('anyFeature', 'test1_exp1')`
    )).not.toBeFalse();

    expect(await page.evaluate(
        `__tagsmith.getLogger('anotherFeature', 'test1_con')`
    )).not.toBeFalse();
  });

  it(`should only be enabled once for a feature-test set`, async () => {
    const page = await browser.generatePage({
      frameworks: ['logger'],
      forceAbFactor: 0.07, // test1_exp1
    });

    expect(await page.evaluate(
        `__tagsmith.getLogger('anyFeature', 'test1_exp1')`
    )).not.toBeFalse();

    expect(await page.evaluate(
        `__tagsmith.getLogger('anyFeature', 'test1_con')`
    )).toBeFalse();

    expect(await page.evaluate(
        `__tagsmith.getLogger('anotherFeature', 'test1_exp2')`
    )).not.toBeFalse();
  });

  it(`should log into dataLayer`, async () => {
    const page = await browser.generatePage({
      frameworks: ['logger'],
      forceAbFactor: 0.07, // test1_exp1
    });

    await page.evaluate(`
      const logger = __tagsmith.getLogger('sampleFeature', 'test1_exp1');
      logger('sampleEvent', 'sampleValue');
    `);

    const dataLayer = await page.evaluate(`window.dataLayer`);

    expect(dataLayer).toEqual([
      {
        event: 'tagsmith_event',
        userVariant: 'test1_exp1',
        id: 'sampleFeature.sampleEvent',
        value: 'sampleValue',
      },
    ]);
  });
});
