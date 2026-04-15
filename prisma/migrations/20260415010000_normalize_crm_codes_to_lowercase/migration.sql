BEGIN;

-- =========================================================
-- 1) Seed lowercase CRM statuses.
-- =========================================================
INSERT INTO crm_statuses (code, label, sort_order, is_active)
VALUES
  ('new', 'New', 1, TRUE),
  ('trial', 'Trial', 2, TRUE),
  ('failed', 'Failed', 3, TRUE),
  ('success', 'Success', 4, TRUE)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- =========================================================
-- 2) Seed lowercase CRM pipeline stages.
-- =========================================================
INSERT INTO crm_pipeline_stages (
  code,
  label,
  stage_order,
  mapped_status_code,
  is_terminal,
  is_active
)
VALUES
  ('new_lead', 'New Lead - Khách hàng mới thêm vào CRM', 1, 'new', FALSE, TRUE),
  ('connect', 'Connect - Đã có giao tiếp với khách hàng', 2, 'new', FALSE, TRUE),
  ('qualified', 'Qualified - Đã xác nhận khách hàng mục tiêu', 3, 'trial', FALSE, TRUE),
  ('booking_demo', 'Booking Demo - Đã hẹn lịch tư vấn', 4, 'trial', FALSE, TRUE),
  ('demo', 'Demo - Đã tư vấn', 5, 'trial', FALSE, TRUE),
  ('proposal', 'Proposal - Đã gửi tài liệu', 6, 'trial', FALSE, TRUE),
  ('negotiation', 'Negotiation - Chờ thanh toán', 7, 'trial', FALSE, TRUE),
  ('close_deal', 'Close Deal - Đã thanh toán', 8, 'success', TRUE, TRUE),
  ('fail', 'Fail - Khách hàng không mua thời điểm này', 9, 'failed', TRUE, TRUE),
  ('lost_unqualified', 'Lost/Unqualified - Loại bỏ', 10, 'failed', TRUE, TRUE)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  stage_order = EXCLUDED.stage_order,
  mapped_status_code = EXCLUDED.mapped_status_code,
  is_terminal = EXCLUDED.is_terminal,
  is_active = EXCLUDED.is_active;

-- =========================================================
-- 3) Seed lowercase CRM pipeline stage notes.
-- =========================================================
INSERT INTO crm_pipeline_stage_notes (stage_code, note)
VALUES
  ('new_lead', 'Khách hàng mới được đưa vào CRM'),
  ('connect', 'Đã có ít nhất một lần liên hệ với khách hàng'),
  ('qualified', 'Đã xác nhận đây là khách hàng phù hợp'),
  ('booking_demo', 'Đã chốt lịch tư vấn/demo'),
  ('demo', 'Đã thực hiện tư vấn/demo'),
  ('proposal', 'Đã gửi proposal / báo giá / tài liệu'),
  ('negotiation', 'Đang đàm phán điều khoản hoặc chờ thanh toán'),
  ('close_deal', 'Khách hàng đã thanh toán / chốt deal'),
  ('fail', 'Khách chưa mua ở thời điểm hiện tại'),
  ('lost_unqualified', 'Khách không phù hợp hoặc đã mất cơ hội')
ON CONFLICT (stage_code) DO UPDATE
SET note = EXCLUDED.note;

-- =========================================================
-- 4) Normalize current deal stage and status.
-- Schema uses crm_deals.pipeline_stage_code and crm_deals.status.
-- =========================================================
UPDATE crm_deals
SET
  pipeline_stage_code = CASE pipeline_stage_code
    WHEN 'NEW_LEAD' THEN 'new_lead'
    WHEN 'CONNECT' THEN 'connect'
    WHEN 'QUALIFIED' THEN 'qualified'
    WHEN 'BOOKING_DEMO' THEN 'booking_demo'
    WHEN 'DEMO' THEN 'demo'
    WHEN 'PROPOSAL' THEN 'proposal'
    WHEN 'NEGOTIATION' THEN 'negotiation'
    WHEN 'CLOSE_DEAL' THEN 'close_deal'
    WHEN 'FAIL' THEN 'fail'
    WHEN 'LOST' THEN 'lost_unqualified'
    ELSE pipeline_stage_code
  END,
  status = CASE status
    WHEN 'NEW' THEN 'new'
    WHEN 'CONNECT' THEN 'new'
    WHEN 'QUALIFIED' THEN 'trial'
    WHEN 'BOOKING_DEMO' THEN 'trial'
    WHEN 'DEMO' THEN 'trial'
    WHEN 'PROPOSAL' THEN 'trial'
    WHEN 'NEGOTIATION' THEN 'trial'
    WHEN 'WON' THEN 'success'
    WHEN 'SUCCESS' THEN 'success'
    WHEN 'FAIL' THEN 'failed'
    WHEN 'FAILED' THEN 'failed'
    WHEN 'LOST' THEN 'failed'
    ELSE status
  END;

-- =========================================================
-- 5) Normalize pipeline record stage history.
-- =========================================================
UPDATE crm_pipeline_records
SET stage_code = CASE stage_code
  WHEN 'NEW_LEAD' THEN 'new_lead'
  WHEN 'CONNECT' THEN 'connect'
  WHEN 'QUALIFIED' THEN 'qualified'
  WHEN 'BOOKING_DEMO' THEN 'booking_demo'
  WHEN 'DEMO' THEN 'demo'
  WHEN 'PROPOSAL' THEN 'proposal'
  WHEN 'NEGOTIATION' THEN 'negotiation'
  WHEN 'CLOSE_DEAL' THEN 'close_deal'
  WHEN 'FAIL' THEN 'fail'
  WHEN 'LOST' THEN 'lost_unqualified'
  ELSE stage_code
END;

-- =========================================================
-- 6) Remove old uppercase stage notes.
-- =========================================================
DELETE FROM crm_pipeline_stage_notes
WHERE stage_code IN (
  'NEW_LEAD',
  'CONNECT',
  'QUALIFIED',
  'BOOKING_DEMO',
  'DEMO',
  'PROPOSAL',
  'NEGOTIATION',
  'CLOSE_DEAL',
  'FAIL',
  'LOST'
);

-- =========================================================
-- 7) Remove old uppercase stages after dependent rows are normalized.
-- =========================================================
DELETE FROM crm_pipeline_stages
WHERE code IN (
  'NEW_LEAD',
  'CONNECT',
  'QUALIFIED',
  'BOOKING_DEMO',
  'DEMO',
  'PROPOSAL',
  'NEGOTIATION',
  'CLOSE_DEAL',
  'FAIL',
  'LOST'
);

-- =========================================================
-- 8) Remove old uppercase/status-like lookup rows.
-- =========================================================
DELETE FROM crm_statuses
WHERE code IN (
  'NEW',
  'CONNECT',
  'QUALIFIED',
  'BOOKING_DEMO',
  'DEMO',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'SUCCESS',
  'FAIL',
  'FAILED',
  'LOST'
);

COMMIT;
