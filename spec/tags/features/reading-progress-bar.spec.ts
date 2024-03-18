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

describe('Reading progress bar', () => {
  beforeEach(browser.launch);
  afterEach(browser.close);

  it('should show and update progress bar', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'reading-progress-bar': 'test1_exp1'},
      forceAbFactor: 0.07,
      paragraphs: 20,
    });

    const $progress = await page.$('#__tagsmith_readingProgressBar_progress');
    expect($progress).not.toBeNull();

    expect((await $progress?.boundingBox())?.width).toEqual(0);

    await page.evaluate(`window.scrollTo(0, 1000)`);
    await page.evaluate(`new Promise((resolve) => setTimeout(resolve, 500))`);

    expect((await $progress?.boundingBox())?.width).toBeGreaterThan(0);
  });

  it('should log progress event', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'reading-progress-bar': 'test1_exp1'},
      forceAbFactor: 0.07,
      paragraphs: 20,
    });

    await page.evaluate(`window.scrollTo(0, 10000)`);
    await page.evaluate(`new Promise((resolve) => setTimeout(resolve, 500))`);

    const dataLayer = await page.evaluate(`window.dataLayer`);

    expect(dataLayer).toEqual([
      {
        event: 'tagsmith_event',
        userVariant: 'test1_exp1',
        id: 'readingProgressBar.percentage',
        value: 90,
      },
    ]);
  });

  it('should destroy root and no-logging for irrelevant variant', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'reading-progress-bar': 'test1_exp1'},
      forceAbFactor: 0.99,
      paragraphs: 20,
    });

    const $root = await page.$('#__tagsmith_readingProgressBar');
    expect($root).toBeNull();

    await page.evaluate(`window.scrollTo(0, 10000)`);
    await page.evaluate(`new Promise((resolve) => setTimeout(resolve, 500))`);

    expect(await page.evaluate(`window.dataLayer.shift()`)).toBeUndefined();
  });

  it('should destroy container but still log for control variant', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'reading-progress-bar': 'test1_exp1'},
      forceAbFactor: 0.01,
      paragraphs: 20,
    });

    const $container = await page.$('#__tagsmith_readingProgressBar_container');
    expect($container).toBeNull();

    await page.evaluate(`window.scrollTo(0, 10000)`);
    await page.evaluate(`new Promise((resolve) => setTimeout(resolve, 500))`);

    expect(await page.evaluate(`window.dataLayer`)).toEqual([
      {
        event: 'tagsmith_event',
        userVariant: 'test1_con',
        id: 'readingProgressBar.percentage',
        value: 90,
      },
    ]);
  });
});
