-- Align the optional CRM customer user relation with Prisma's expected FK action.
ALTER TABLE "crm_customer_profiles"
  DROP CONSTRAINT "crm_customer_profiles_user_id_fkey";

ALTER TABLE "crm_customer_profiles"
  ADD CONSTRAINT "crm_customer_profiles_user_id_fkey"
  FOREIGN KEY ("user_id")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
