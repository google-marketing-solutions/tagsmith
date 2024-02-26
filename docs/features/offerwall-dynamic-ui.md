# Offerwall Dynamic UI

Feature ID: `offerwallDynamicUi`

## What it is?

Dynamically change offerwall's UI for UX testing.

## What it fits for?

Pages where offerwall is enabled.

## Setup

1. In Google Tag Manager, add following variable(s):

- **Name**: `tagsmith.abVariant.offerwallDynamicUi`
  - **Type**: `Constant`
  - **Value**: Any available experiment variant (e.g. `test1_exp1`)
- **Name**: `tagsmith.offerwallDynamicUi.headlineText`
  - **Type**: `Constant`
  - **Value**: The text you would like to show in headline. (Set to `_` if you want to use the text you set in Ad Manager)
- **Name**: `tagsmith.offerwallDynamicUi.bodyText`
  - **Type**: `Constant`
  - **Value**: The text you would like to show in subtitle. (Set to `_` if you want to use the text you set in Ad Manager)
- **Name**: `tagsmith.offerwallDynamicUi.rewardedAdOptionText`
  - **Type**: `Constant`
  - **Value**: The text you would like to show in rewarded button title. (Set to `_` if you want to use the text you set in Ad Manager)
- **Name**: `tagsmith.offerwallDynamicUi.rewardedAdOptionSubtext`
  - **Type**: `Constant`
  - **Value**: The text you would like to show in rewarded button subtitle. (Set to `_` if you want to use the text you set in Ad Manager)

2. In Google Tag Manager, add following trigger(s):

- **Name**: `Tagsmith - Offerwall Dynamic UI`
  - **Type**: `Page View - DOM Ready`
  - **Fires on**: `Some DOM Ready Events`, choose `Page Path` or `Page URL` (both are built-in variables), and set appropriate condition & value to match the pages where offerwall is enabled. (You can also choose `All DOM Ready Events` if offerwall is enabled in all pages).

3. In Google Tag Manager, add following tag(s):

- **Name**: `Tagsmith - Offerwall Dynamic UI`
  - **Type**: `Custom HTML`
  - **HTML**: Copy/paste from [this file](https://raw.githubusercontent.com/google-marketing-solutions/tagsmith/main/dist/tags/features/offerwall-dynamic-ui.html)
  - **Advanced Settings**
    - **Tag firing options**: `Once per page`
  - **Firing Triggers**: `Tagsmith - Offerwall Dynamic UI`

4. Preview to see if everything works
5. Submit & publish

## Notice

After testing, instead of setting `tagsmith.abVariant.offerwallDynamicUi` to `all`, please update your offerwall configs in Ad Manager to reflect the better UI options, then discontinue this feature.

## Automatically collected GA4 events for A/B testing

| tagsmith_event_id | tagsmith_event_value | Description |
| ----------------- | -------------------- | ----------- |
| offerwallDynamicUi.prompt | N/A | Recorded when offerwall popup opens. |
| offerwallDynamicUi.click | ID of the offer user clicked. Possible values are `fc-rewarded-ad-button`, `fc-user-interests-button`, `fc-laterpay-button`, and `fc-publisher-custom-impl-button`. | Recorded when user clicks an offer. |
| offerwallDynamicUi.complete | N/A | Recorded when user completed an offer and page becomes viewable. |


