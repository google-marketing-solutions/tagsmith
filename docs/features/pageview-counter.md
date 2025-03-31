# Pageview Counter

Feature ID: `pageviewCounter`

## What it is?

Counte pageview as variable.

## What it fits for?

All pages.

Typically useful for implementing web interstitials with page view conditions.

## Setup

1. In Google Tag Manager, add following variable(s):

- **Name**: `tagsmith.abVariant.pageviewCounter`
  - **Type**: `Constant`
  - **Value**: Any available experiment variant (e.g. `test1_exp1`)

2. Preview to see if everything works.
3. Submit & publish
4. Add Key-Value conditions in Delivery > Line Items e.g. pv_counter = 5 or othres.
