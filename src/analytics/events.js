// Single source of truth for analytics events. Names and allowed parameters live here;
// track() drops anything not listed, so a typo can't create a new event or parameter.
// Keep in sync with docs/ga4-events.md.
export const EVENT_SPEC = {
  cta_click:              ['cta_location', 'cta_text', 'source_page'],
  quiz_start:             ['source_page'],
  quiz_question_answered: ['step', 'step_name', 'source_page'],
  quiz_exit:              ['exit_reason', 'source_page'],
  quiz_complete:          ['source_page'],
  generate_lead:          ['lead_type', 'source_page'],
}
