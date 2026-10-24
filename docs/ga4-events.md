# GA4 events

Every analytics event the site sends. Names and allowed parameters are defined once, in
`src/analytics/events.js`; `track()` (`src/analytics/track.js`) drops anything not listed there.
Update this file when that spec changes.

GA4 also records its own automatic and enhanced-measurement events (`page_view`, `click`, `scroll`,
`first_visit`, `session_start`, `user_engagement`). Those are not listed here.

## Custom events

| Event | Fires when | Parameters | Where in code |
|---|---|---|---|
| `cta_click` | An element with `data-track="cta_click"` is clicked (header button, home page quiz button) | `cta_location`, `cta_text`, `source_page` | `src/analytics/listener.js` |
| `quiz_start` | The visitor clicks "Check my eligibility" on the quiz intro screen | `source_page` | `Quiz.jsx`, `IntroScreen` `onStart` |
| `quiz_question_answered` | A question is answered (including re-answers after going Back) | `step`, `step_name`, `source_page` | `Quiz.jsx`, `handleAnswer` |
| `quiz_exit` | The visitor lands on a dead-end screen | `exit_reason`, `source_page` | `Quiz.jsx`, `goTo` |
| `quiz_complete` | The lead form on the normal path was saved (server returned a record ID) | `source_page` | `Quiz.jsx`, `submitLead` |
| `generate_lead` | Any lead form was saved (normal path or either exit form) | `lead_type`, `source_page` | `Quiz.jsx`, `submitLead` |

`quiz_complete` and `generate_lead` fire together on the normal path. `quiz_complete` is the funnel
step; `generate_lead` is GA's recommended lead event and the one to mark as a key event.
Neither fires if the save fails, even though the results screen still shows.

## Parameters

| Parameter | Values |
|---|---|
| `cta_location` | `header`, `home_hero` |
| `cta_text` | Link text, up to 100 characters (`Check my eligibility`, `Quiz`) |
| `source_page` | Path of the page that sent the visitor to the quiz, such as `/blog/mop-rules/`. `(direct)` if there was no referrer, `(external)` if the referrer was another site. On `cta_click` it is the page the click happened on. |
| `step` | Position in the visitor's own question list, starting at 1 (the list differs for singles and couples) |
| `step_name` | `age`, `citizenship`, `buyerType`, `partnerCitizenship`, `widowedOrphan`, `income`, `propertyOwnership` |
| `exit_reason` | `under_21`, `foreigner`, `single_pr` |
| `lead_type` | `full`, `foreigner_exit`, `single_pr_exit` |

Answers themselves (age, income, citizenship value) are never sent.

## Adding a CTA

Put the attributes on any link or button. No JavaScript needed:

```html
<a href="/quiz" data-track="cta_click" data-track-location="my_place">Check my eligibility</a>
```

Add the new `cta_location` value to the table above.

## How source_page works

`src/analytics/source.js` reads `document.referrer` when a quiz event fires. A same-site referrer
becomes the path; another site becomes `(external)`. The value is kept in `sessionStorage` so that
a click on the header button while already on the quiz does not overwrite the real source with
`/quiz/`. No query parameters are added, so URLs stay clean.

## Local testing

GA is only present when `PUBLIC_GA_ID` is set at build or dev time. In `astro dev`, events carry
`debug_mode`, so they appear in GA4 under Admin > DebugView. Without the variable, `track()` does
nothing.
