-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "position" VARCHAR(100),
    "is_primary_contact" BOOLEAN NOT NULL DEFAULT false,
    "is_escalation_contact" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contacts_tenant_id_idx" ON "contacts"("tenant_id");

-- CreateIndex
CREATE INDEX "contacts_company_id_idx" ON "contacts"("company_id");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- RLS POLICIES FOR CONTACTS
-- ============================================================

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts FORCE ROW LEVEL SECURITY;

-- Policy SELECT
CREATE POLICY "tenant_isolation_contacts_select"
ON contacts FOR SELECT
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Policy INSERT
CREATE POLICY "tenant_isolation_contacts_insert"
ON contacts FOR INSERT
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Policy UPDATE
CREATE POLICY "tenant_isolation_contacts_update"
ON contacts FOR UPDATE
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Policy DELETE
CREATE POLICY "tenant_isolation_contacts_delete"
ON contacts FOR DELETE
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ============================================================
-- SQL FUNCTIONS FOR ATOMIC SWAPS
-- ============================================================

-- Function to swap primary contact atomically
CREATE OR REPLACE FUNCTION swap_primary_contact(
  p_company_id UUID,
  p_new_primary_id UUID
) RETURNS void AS $$
BEGIN
  -- Unmark all primary contacts for this company
  UPDATE contacts
  SET is_primary_contact = false, updated_at = NOW()
  WHERE company_id = p_company_id
    AND is_primary_contact = true
    AND tenant_id = current_setting('app.current_tenant_id', true)::uuid;

  -- Mark the new one as primary
  UPDATE contacts
  SET is_primary_contact = true, updated_at = NOW()
  WHERE id = p_new_primary_id
    AND company_id = p_company_id
    AND tenant_id = current_setting('app.current_tenant_id', true)::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to swap escalation contact atomically
CREATE OR REPLACE FUNCTION swap_escalation_contact(
  p_company_id UUID,
  p_new_escalation_id UUID
) RETURNS void AS $$
BEGIN
  -- Unmark all escalation contacts for this company
  UPDATE contacts
  SET is_escalation_contact = false, updated_at = NOW()
  WHERE company_id = p_company_id
    AND is_escalation_contact = true
    AND tenant_id = current_setting('app.current_tenant_id', true)::uuid;

  -- Mark the new one as escalation (only if ID provided)
  IF p_new_escalation_id IS NOT NULL THEN
    UPDATE contacts
    SET is_escalation_contact = true, updated_at = NOW()
    WHERE id = p_new_escalation_id
      AND company_id = p_company_id
      AND tenant_id = current_setting('app.current_tenant_id', true)::uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count primary contacts for a company
CREATE OR REPLACE FUNCTION count_primary_contacts(
  p_company_id UUID
) RETURNS integer AS $$
DECLARE
  contact_count integer;
BEGIN
  SELECT COUNT(*) INTO contact_count
  FROM contacts
  WHERE company_id = p_company_id
    AND is_primary_contact = true
    AND is_active = true
    AND tenant_id = current_setting('app.current_tenant_id', true)::uuid;

  RETURN contact_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
