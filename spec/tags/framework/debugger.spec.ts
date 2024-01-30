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

describe('Debugger', () => {
  beforeEach(browser.launch);
  afterEach(browser.close);

  it('should not log if Logger not presents', async () => {
    const page = await browser.generatePage({
      frameworks: ['debugger'],
      forceAbFactor: 0.07, // test1_exp1
    });

    page.once('dialog', async (dialog) => {
      expect( dialog.message()).toContain('Can\'t get logger');
      await dialog.dismiss();
    });

    await page.click('.__tagsmith_debugger_open');
    await page.click('.__tagsmith_debugger_more');
    await page.click('#__tagsmith_debugger_test_setup');

    const dataLayer = await page.evaluate(`window.dataLayer`);

    expect(dataLayer).toBeUndefined();
  });

  it(`should log into dataLayer`, async () => {
    const page = await browser.generatePage({
      frameworks: ['logger', 'debugger'],
      forceAbFactor: 0.07, // test1_exp1
    });

    page.once('dialog', async (dialog) => {
      expect( dialog.message()).toContain('Event sent');
      await dialog.dismiss();
    });

    await page.click('.__tagsmith_debugger_open');
    await page.click('.__tagsmith_debugger_more');
    await page.click('#__tagsmith_debugger_test_setup');

    const dataLayer = await page.evaluate(`window.dataLayer`);

    expect(dataLayer).toEqual([
      {
        event: 'tagsmith_event',
        userVariant: 'test1_exp1',
        id: 'debugger.testEventName',
        value: 'testEventValue',
      },
    ]);
  });
});
