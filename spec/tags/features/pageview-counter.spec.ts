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

describe('Pageview counter', () => {
  beforeEach(browser.launch);
  afterEach(browser.close);

  it('should store if lastAccessTime does not exist', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'pageview-counter': 'test1_exp1'},
      forceAbFactor: 0.07,
      injection: {
        beforeSnippet: '<script>localStorage.clear();</script>',
      },
    });

    const pageview = (await page.evaluate('pv_counter')) as number;
    const lastAccessTime = (await page.evaluate(
      'localStorage.getItem("lastAccessTime")',
    )) as number;
    expect(lastAccessTime.toString()).toMatch(/^\d+$/);
    expect(pageview).toEqual(1);

    await page.close();
  });

  it('should store as 2 when browser opened before within 1 hour', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'pageview-counter': 'test1_exp1'},
      forceAbFactor: 0.07,
      injection: {
        beforeSnippet:
          '<script>localStorage.setItem("lastAccessTime", new Date().getTime()' +
          '- (60 * 1000));pv_counter = 1;</script>',
      },
    });

    const pageview = (await page.evaluate('pv_counter')) as number;
    expect(pageview).toEqual(2);

    await page.close();
  });

  it('should initilize when browser opened more than an hour ago', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'pageview-counter': 'test1_exp1'},
      forceAbFactor: 0.07,
      injection: {
        beforeSnippet:
          '<script>localStorage.setItem("lastAccessTime", new Date().getTime()' +
          '- (2 * 60 * 60 * 1000));</script>',
      },
    });

    const pageview = (await page.evaluate('pv_counter')) as number;
    expect(pageview).toEqual(1);

    await page.close();
  });
});
