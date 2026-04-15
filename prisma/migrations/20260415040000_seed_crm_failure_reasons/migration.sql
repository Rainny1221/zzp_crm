-- Seed CRM failure reasons used by pipeline stage transitions.

INSERT INTO crm_failure_reasons (code, label, sort_order, is_active)
VALUES
  ('high_price', 'High price', 1, TRUE),
  ('no_budget', 'No budget', 2, TRUE),
  ('no_need', 'No current need', 3, TRUE),
  ('not_fit', 'Not fit', 4, TRUE),
  ('competitor', 'Using competitor', 5, TRUE),
  ('no_response', 'No response', 6, TRUE),
  ('other', 'Other', 7, TRUE)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;
