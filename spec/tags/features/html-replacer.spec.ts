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

/**
 * Create a htmlPostProcessor to set replacer in <textarea>.
 * @param {string} content
 * @return {(html: string): string}
 */
function setReplacer(content: string) {
  return function(html: string) {
    return html.replace(
        /(<textarea name="template".*?>)([\s\S]+)(<\/textarea>)/m,
        `$1${content}$3`
    );
  };
}

describe('HTML replacer', () => {
  beforeEach(browser.launch);
  afterEach(browser.close);

  it('should do nothing if DocumentFragment isn\'t available', async () => {
    const page = await browser.generatePage({
      injection: {
        beforeSnippet: '<script>delete DocumentFragment</script>',
      },
      variantByFeature: {'html-replacer': 'test1_exp1'},
      variables: {
        'tagsmith.htmlReplacer.cssSelector': 'article',
      },
      htmlPostProcessor: setReplacer('replaced content'),
      forceAbFactor: 0.07,
    });

    expect(
        await page.evaluate(`document.querySelector('article').innerText`)
    ).not.toEqual('replaced content');

    expect(await page.$('#__tagsmith_htmlReplacer')).toBeNull();
    expect(await page.evaluate(`window.dataLayer.shift()`)).toBeUndefined();
  });

  it('should do nothing if replaceChildren isn\'t available', async () => {
    const page = await browser.generatePage({
      injection: {
        beforeSnippet:
          '<script>delete Element.prototype.replaceChildren</script>',
      },
      variantByFeature: {'html-replacer': 'test1_exp1'},
      variables: {
        'tagsmith.htmlReplacer.cssSelector': 'article',
      },
      htmlPostProcessor: setReplacer('replaced content'),
      forceAbFactor: 0.07,
    });

    expect(
        await page.evaluate(`document.querySelector('article').innerText`)
    ).not.toEqual('replaced content');

    expect(await page.$('#__tagsmith_htmlReplacer')).toBeNull();
    expect(await page.evaluate(`window.dataLayer.shift()`)).toBeUndefined();
  });

  it('should replace article content', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'html-replacer': 'test1_exp1'},
      variables: {
        'tagsmith.htmlReplacer.cssSelector': 'article',
      },
      htmlPostProcessor: setReplacer('replaced content'),
      forceAbFactor: 0.07,
    });

    expect(
        await page.evaluate(`document.querySelector('article').innerText`)
    ).toEqual('replaced content');

    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'htmlReplacer.replaced',
    });
  });

  it('should replace multiple targets', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'html-replacer': 'test1_exp1'},
      variables: {
        'tagsmith.htmlReplacer.cssSelector': 'p',
      },
      htmlPostProcessor: setReplacer('replaced paragraph'),
      forceAbFactor: 0.07,
    });

    const $paragraphs = await page.$$('p');

    for (let i = 0; i < $paragraphs.length; i++) {
      const $p = $paragraphs[i];
      expect(await $p.evaluate((ele) => ele.innerText)).toEqual(
          'replaced paragraph'
      );
    }

    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'htmlReplacer.replaced',
    });
  });

  it('should not replace if no target matches', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'html-replacer': 'test1_exp1'},
      variables: {
        'tagsmith.htmlReplacer.cssSelector': 'random selector',
      },
      htmlPostProcessor: setReplacer('replaced content'),
      forceAbFactor: 0.07,
    });

    expect(
        await page.evaluate(`document.querySelector('article').innerText`)
    ).not.toEqual('replaced content');

    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'htmlReplacer.replaced',
    });
  });

  it('should modify article style', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'html-replacer': 'test1_exp1'},
      variables: {
        'tagsmith.htmlReplacer.cssSelector': '#placeholder',
      },
      htmlPostProcessor: setReplacer('<style>h1 { font-size: 100px; }</style>'),
      forceAbFactor: 0.07,
    });

    expect(
        await page.evaluate(
            `window.getComputedStyle(document.querySelector('h1')).fontSize`
        )
    ).toEqual('100px');

    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_exp1',
      id: 'htmlReplacer.replaced',
    });
  });

  it('should not show <textarea> on page', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'html-replacer': 'test1_exp1'},
      variables: {
        'tagsmith.htmlReplacer.cssSelector': 'article',
      },
      htmlPostProcessor: setReplacer('replaced content'),
      forceAbFactor: 0.07,
    });

    expect(
        await (await page.$(`#__tagsmith_htmlReplacer textarea`))?.isVisible()
    ).toBeFalse();
  });

  it('should not run script in replacing html', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'html-replacer': 'test1_exp1'},
      variables: {
        'tagsmith.htmlReplacer.cssSelector': 'article',
      },
      injection: {
        beforeSnippet: `<script>window.safeCodes = true</script>`,
      },
      htmlPostProcessor: setReplacer(
          `replaced content<script>window.badCodes = true</script>`
      ),
      forceAbFactor: 0.07,
    });

    expect(await page.evaluate(`window.safeCodes`)).toBeTrue();
    expect(await page.evaluate(`window.badCodes`)).toBeUndefined();
  });

  it('should not replace, and no-logging for irrelevant variant', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'html-replacer': 'test1_exp1'},
      variables: {
        'tagsmith.htmlReplacer.cssSelector': 'article',
      },
      htmlPostProcessor: setReplacer('replaced content'),
      forceAbFactor: 0.99,
    });

    expect(
        await page.evaluate(`document.querySelector('article').innerText`)
    ).not.toEqual('replaced content');

    expect(await page.$('#__tagsmith_htmlReplacer')).toBeNull();
    expect(await page.evaluate(`window.dataLayer.shift()`)).toBeUndefined();
  });

  it('should not replace but still log for control variant', async () => {
    const page = await browser.generatePage({
      variantByFeature: {'html-replacer': 'test1_exp1'},
      variables: {
        'tagsmith.htmlReplacer.cssSelector': 'article',
      },
      htmlPostProcessor: setReplacer('replaced content'),
      forceAbFactor: 0.01,
    });

    expect(
        await page.evaluate(`document.querySelector('article').innerText`)
    ).not.toEqual('replaced content');

    expect(await page.evaluate(`window.dataLayer.shift()`)).toEqual({
      event: 'tagsmith_event',
      userVariant: 'test1_con',
      id: 'htmlReplacer.kept',
    });
  });
});
