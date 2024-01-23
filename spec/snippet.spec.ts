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

import * as browser from './helpers/browser';

describe('Snippet', () => {
  beforeEach(browser.launch);
  afterEach(browser.close);

  it('should assign and maintain userVariant', async () => {
    let page = await browser.generatePage({frameworks: []});

    const userVariant = await page.evaluate('__tagsmith.userVariant()');
    expect(userVariant).toMatch(/^test\d+_(con|exp\d+)$/);

    await page.close();

    page = await browser.generatePage({frameworks: []});

    const newUserVariant = await page.evaluate(`__tagsmith.userVariant()`);
    expect(newUserVariant).toEqual(userVariant);
  });

  it('should enable feature for experiment variant', async () => {
    const page = await browser.generatePage({
      frameworks: [],
      forceAbFactor: 0.07,
    });

    const userVariant = await page.evaluate('__tagsmith.userVariant()');

    expect(
        await page.evaluate(`__tagsmith.enable('anyFeature', '${userVariant}')`)
    ).toBeTrue();
  });

  it('should not enable multiple feature for the same variant', async () => {
    const page = await browser.generatePage({
      frameworks: [],
      forceAbFactor: 0.07,
    });

    const userVariant = await page.evaluate('__tagsmith.userVariant()');

    expect(
        await page.evaluate(`__tagsmith.enable('anyFeature', '${userVariant}')`)
    ).toBeTrue();

    expect(
        await page.evaluate(
            `__tagsmith.enable('anotherFeature', '${userVariant}')`
        )
    ).toBeFalse();
  });

  it('should not enable feature for non-targeted variant', async () => {
    const page = await browser.generatePage({
      frameworks: [],
      forceAbFactor: 0.07,
    });

    expect(
        await page.evaluate(`__tagsmith.enable('anyFeature', 'test2_exp1')`)
    ).toBeFalse();
  });

  it('should enable feature for all', async () => {
    const page = await browser.generatePage({frameworks: []});

    expect(
        await page.evaluate(`__tagsmith.enable('anyFeature', 'all')`)
    ).toBeTrue();
  });

  it('should not enable feature for control variant', async () => {
    const page = await browser.generatePage({
      frameworks: [],
      forceAbFactor: 0.03,
    });

    const userVariant = await page.evaluate('__tagsmith.userVariant()');

    expect(
        await page.evaluate(`__tagsmith.enable('anyFeature', '${userVariant}')`)
    ).toBeFalse();
  });

  it('should return false for getLogger', async () => {
    const page = await browser.generatePage({frameworks: []});

    expect(
        await page.evaluate(`__tagsmith.getLogger('anyFeature', 'test1_exp1')`)
    ).toBeFalse();
  });

  it('should return debug info', async () => {
    const page = await browser.generatePage({frameworks: []});

    const debugInfo = (await page.evaluate(`__tagsmith.__debug()`)) as {
      AB_CONF: unknown;
    };

    expect(debugInfo.AB_CONF).toBeDefined();
  });

  it('should register with GPT', async () => {
    const page = await browser.generatePage({frameworks: []});

    const debugInfo = (await page.evaluate(
        `window.googletag.cmd`
    )) as unknown[];

    expect(debugInfo.length).toEqual(1);
  });
});
