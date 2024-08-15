# HTML replacer

Feature ID: `htmlReplacer`

## What it is?

Replaces the HTML content of any page element(s) specified by a CSS selector. Typically useful for running customized UI A/B test (by putting `<style>` in replacing HTML to overwrite CSS styles).

**Limitation**: `<script>` tag(s) in the replaced HTML won't work.

## What it fits for?

All pages.

## Setup

1. In Google Tag Manager, add following variable(s):

- **Name**: `tagsmith.abVariant.htmlReplacer`
  - **Type**: `Constant`
  - **Value**: Any available experiment variant (e.g. `test1_exp1`)
- **Name**: `tagsmith.htmlReplacer.cssSelector`
  - **Type**: `Constant`
  - **Value**: CSS selector to match the HTML element(s) you want to replace.
               If the selector matches multiple elements, all will be replaced.

1. In Google Tag Manager, add following trigger(s):

- **Name**: `Tagsmith - HTML replacer`
  - **Type**: `Page View - DOM Ready`
  - **Fires on**: `Some DOM Ready Events`, choose `Page Path` or `Page URL` (both are built-in variables), and set appropriate condition & value to match the pages you want to enable this feature.

3. In Google Tag Manager, add following tag(s):

- **Name**: `Tagsmith - HTML replacer`
  - **Type**: `Custom HTML`
  - **HTML**: Copy/paste from [this file](https://raw.githubusercontent.com/google-marketing-solutions/tagsmith/main/dist/tags/features/html-replacer.html)
    - Search for `#region Customize` in the HTML above, then put your replacing HTML in side the `<textarea>` tag.
  - **Advanced Settings**
    - **Tag firing options**: `Once per page`
  - **Firing Triggers**: `Tagsmith - HTML replacer`

4. Preview to see if everything works
5. Submit & publish

## Automatically collected GA4 events for A/B testing

| tagsmith_event_id | tagsmith_event_value | Description |
| ----------------- | -------------------- | ----------- |
| htmlReplacer.replaced | N/A | Recorded when target element(s) is replaced. |
| htmlReplacer.kept | N/A | Recorded when target element(s) is kept as it is. |
