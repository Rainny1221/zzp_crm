DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'crm_feedbacks_pkey'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'crm_feedback_pkey'
  ) THEN
    ALTER TABLE crm_feedback
      RENAME CONSTRAINT crm_feedbacks_pkey TO crm_feedback_pkey;
  END IF;
END $$;
