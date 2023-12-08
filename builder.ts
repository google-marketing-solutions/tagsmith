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

import * as fs from 'node:fs';
import {
  CompileOptions,
  compiler as ClosureCompiler,
} from 'google-closure-compiler';

/**
 * Synchronously and recursively creates a directory if it didn't exist.
 * @param path Directory path
 */
function tryMkdirSync(path: string): void {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, {recursive: true});
  }
}

/**
 * Synchronously reads file content if it exists.
 * @param path File path
 * @return File content or null when file not exists.
 */
function tryReadFileContentSync(path: string): string | null {
  return fs.existsSync(path) ? fs.readFileSync(path).toString() : null;
}

/**
 * Build snippet with ClosureCompiler.
 * @param srcFile Source file path
 * @param distFile Distribution file path
 * @param wrapperFile Optional wrapper file path
 */
function buildSnippet(
    srcFile: string,
    distFile: string,
    wrapperFile?: string
): Promise<void> {
  const snippet = tryReadFileContentSync(srcFile);

  if (!snippet) {
    throw new Error(`Can't read snippet from ${srcFile}.`);
  }

  const option: CompileOptions = {
    js: srcFile,
  };

  const compiler = new ClosureCompiler(option);

  const promise = new Promise<void>((resolve, reject) => {
    compiler.run((exitCode, stdout, stderr) => {
      if (stderr) {
        reject(stderr);
        return;
      }

      let output = stdout.trim();

      if (wrapperFile) {
        const wrapper = tryReadFileContentSync(wrapperFile);

        if (!wrapper) {
          reject(new Error(`Can't read wrapper file: ${wrapperFile}.`));
          return;
        }

        const snippetName = snippet.match(/@name\s(.+)/)?.[1];
        if (!snippetName) {
          reject(new Error(
              `Not name provided in ${srcFile}. ` +
              'Specify one with `@name theName`.'
          ));
          return;
        }

        const snippetVersion = snippet.match(/@version\s(.+)/)?.[1];
        if (!snippetVersion) {
          reject(new Error(
              `Not version provided in ${srcFile}. ` +
              'Specify one with `@version theVersion`.'
          ));
          return;
        }

        output = wrapper
            .replace(/<%\s+name\s+%>/g, snippetName)
            .replace(/<%\s+version\s+%>/g, snippetVersion)
            .replace(/<%\s+script\s+%>/g, `<script>\n${output}\n</script>`);
      }

      fs.writeFileSync(distFile, output);

      resolve();
    });
  });

  return promise;
}

/**
 * Build tags for use in Google Tag Manager.
 * @param srcDir Source directory
 * @param distDir Distribution directory
 */
function buildTags(srcDir: string, distDir: string): void {
  tryMkdirSync(distDir);

  const tagList = fs.readdirSync(srcDir);

  for (let i = 0; i < tagList.length; i++) {
    const tagName = tagList[i];
    const tagDir = `${srcDir}/${tagName}`;

    let tag = tryReadFileContentSync(`${tagDir}/tag.html`);
    let script = tryReadFileContentSync(`${tagDir}/script.js`);
    let style = tryReadFileContentSync(`${tagDir}/style.css`);

    const copyrightRegexp = new RegExp(/\/\*\s*(\*\s?)?Copyright\b.+?\*\//s);

    if (!tag) {
      throw new Error(`Can't read content from ${tagDir}/tag.html.`);
    }

    if (script) {
      const targetRegexp = new RegExp(/<%\s+script\s+%>/g);

      if (!tag.match(targetRegexp)) {
        throw new Error(
            'Script file exists but no <% script %> is found in ' +
            `${tagDir}/tag.html.`
        );
      }

      // Remove copyright since it should be included in tag.html.
      script = script.replace(copyrightRegexp, '').trim();
      tag = tag.replace(targetRegexp, `<script>\n${script}\n</script>`);
    }

    if (style) {
      const targetRegexp = new RegExp(/<%\s+style\s+%>/g);

      if (!tag.match(targetRegexp)) {
        throw new Error(
            'Style file exists but no <% style %> is found in ' +
            `${tagDir}/tag.html.`
        );
      }

      // Remove copyright since it should be included in tag.html.
      style = style.replace(copyrightRegexp, '').trim();
      tag = tag.replace(targetRegexp, `<style>\n${style}\n</style>`);
    }

    fs.writeFileSync(`${distDir}/${tagName}.html`, tag);
  }
}

/**
 * Build snippet and tags.
 */
function buildAll() {
  const SRC_DIR = 'src';
  const DIST_DIR = 'dist';

  buildSnippet(
      `${SRC_DIR}/snippet.js`,
      `${DIST_DIR}/snippet.html`,
      `${SRC_DIR}/snippet.wrapper.html`
  );

  buildTags(`${SRC_DIR}/tags/framework`, `${DIST_DIR}/tags/framework`);
  buildTags(`${SRC_DIR}/tags/features`, `${DIST_DIR}/tags/features`);
}

buildAll();
