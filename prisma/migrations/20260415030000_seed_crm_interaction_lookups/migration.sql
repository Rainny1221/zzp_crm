-- Seed CRM interaction lookup values used by customer interaction logging.

INSERT INTO crm_interaction_channels (code, label, sort_order, is_active)
VALUES
  ('call', 'Call', 1, TRUE),
  ('message', 'Message', 2, TRUE)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

INSERT INTO crm_call_outcomes (code, label, sort_order, is_active)
VALUES
  ('connected', 'Connected', 1, TRUE),
  ('no_answer', 'No answer', 2, TRUE),
  ('busy', 'Busy', 3, TRUE),
  ('wrong_number', 'Wrong number', 4, TRUE)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

INSERT INTO crm_message_outcomes (code, label, sort_order, is_active)
VALUES
  ('replied', 'Replied', 1, TRUE),
  ('seen', 'Seen', 2, TRUE),
  ('no_reply', 'No reply', 3, TRUE)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;
