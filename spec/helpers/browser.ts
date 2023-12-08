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

import * as fs from 'fs';
import puppeteer, {Browser, Page} from 'puppeteer';

const SNIPPET = fs.readFileSync('dist/snippet.html').toString();
const TEMPLATE = fs
    .readFileSync('spec/template.html')
    .toString()
    .replace(/<%\s+snippet\s+%>/, SNIPPET);
const FRAMEWORK_TAG_MAP = {
  logger: 'dist/tags/framework/logger.html',
  debugger: 'dist/tags/framework/debugger.html',
};
const FEATURE_TAG_DIR = 'dist/tags/features';

const PARAGRAPH_PLACEHOLDER = `<p>
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris a urna
nisl. Mauris aliquam ligula eu enim tincidunt, in convallis nunc
iaculis. Sed placerat tellus sed felis tincidunt, nec interdum felis
consectetur. Vivamus in ligula vitae urna eleifend elementum. In hac
habitasse platea dictumst. Curabitur euismod, lorem quis hendrerit
malesuada, sapien orci egestas diam, vel aliquam felis lectus at ante.
</p>`;

let browser: Browser | undefined;

/**
 * Launch test browser if it isn't launched
 */
export async function launch() {
  if (browser) {
    return;
  }

  browser = await puppeteer.launch({headless: 'new'});
}

/**
 * Close test browser
 */
export async function close() {
  if (!browser) {
    return;
  }

  await browser.close();
  browser = undefined;
}

/**
 * Generate test page
 * @param `args.variantByFeature` Enable feature tag by variant.
 *          Default `{}`.
 * @param `args.frameworks` Enable framework tags.
 *          Default `['logger', 'debugger']`
 * @param `args.forceAbFactor` Manually set user's A/B factor.
 *          Default `undefined`
 * @param `args.paragraphs` Set how many paragraphs to generate in article body.
 *          Default `5`
 */
export async function generatePage(args: {
  variantByFeature?: { [feature: string]: string };
  frameworks?: (keyof typeof FRAMEWORK_TAG_MAP)[];
  forceAbFactor?: number;
  paragraphs?: number;
}): Promise<Page> {
  if (!browser) {
    throw new Error('Run `await prepare();` before any test.');
  }

  if (args.variantByFeature === undefined) {
    args.variantByFeature = {};
  }

  if (args.frameworks === undefined) {
    args.frameworks = ['logger', 'debugger'];
  }

  if (args.paragraphs === undefined) {
    args.paragraphs = 5;
  }

  const tags: string[] = [];

  for (let i = 0; i < args.frameworks.length; i++) {
    const path = FRAMEWORK_TAG_MAP[args.frameworks[i]];
    tags.push(fs.readFileSync(path).toString());
  }

  const features = Object.keys(args.variantByFeature);
  for (let i = 0; i < features.length; i++) {
    const name = features[i];
    const variant = args.variantByFeature[name];
    const path = `${FEATURE_TAG_DIR}/${name}.html`;
    const tag = fs
        .readFileSync(path)
        .toString()
        .replaceAll(/\{\{tagsmith\.abVariant\..+?\}\}/g, variant);
    tags.push(tag);
  }

  const html = String(TEMPLATE)
      .replace(
          /<%\s+paragraphs\s+%>/,
          PARAGRAPH_PLACEHOLDER.repeat(args.paragraphs)
      )
      .replace(/<%\s+tags\s+%>/, tags.join('\n'));

  const page = await browser.newPage();

  // Open an actual file so features that require URL(e.g. localStorage) works.
  await page.goto(`file://${process.cwd()}/spec/empty.html`);

  if (args.forceAbFactor !== undefined) {
    await page.evaluate(
        `localStorage.setItem('__tagsmith_ab_factor', ${args.forceAbFactor})`
    );
  }

  await page.setContent(html);

  return page;
}
