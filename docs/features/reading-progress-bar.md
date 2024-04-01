# Reading progress bar

Feature ID: `readingProgressBar`

## What it is?

Adds a reading progress bar to your pages to encourage visitors to scroll further down.

## What it fits for?

All article pages.

## Setup

1. In Google Tag Manager, add following variable(s):

- **Name**: `tagsmith.abVariant.readingProgressBar`
  - **Type**: `Constant`
  - **Value**: Any available experiment variant (e.g. `test1_exp1`)

2. In Google Tag Manager, add following trigger(s):

- **Name**: `Tagsmith - Reading progress bar`
  - **Type**: `Page View - DOM Ready`
  - **Fires on**: `Some DOM Ready Events`, choose `Page Path` or `Page URL` (both are built-in variables), and set appropriate condition & value to match your article pages

3. In Google Tag Manager, add following tag(s):

- **Name**: `Tagsmith - Reading progress bar`
  - **Type**: `Custom HTML`
  - **HTML**: Copy/paste from [this file](https://raw.githubusercontent.com/google-marketing-solutions/tagsmith/main/dist/tags/features/reading-progress-bar.html)
    - To customize progress bar's position/color and/or logic, search for `#region Customize` in the HTML above.
  - **Advanced Settings**
    - **Tag firing options**: `Once per page`
  - **Firing Triggers**: `Tagsmith - Reading progress bar`

4. Preview to see if everything works
5. Submit & publish

## Automatically collected GA4 events for A/B testing

| tagsmith_event_id | tagsmith_event_value |
| ----------------- | -------------------- |
| readingProgressBar.percentage | Percentage of how far user scrolled down the page. Available values are `50`, `75`, and `90`. |
