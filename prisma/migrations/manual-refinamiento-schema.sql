-- Migration: Refinamiento de Schema - Companies e Invoices
-- Date: 2025-12-04
-- Description:
--   - Company: quitar email y payment_terms_days, agregar has_portal
--   - Invoice: agregar payment_terms_days y projected_payment_date

-- ============================================
-- STEP 1: Agregar nuevas columnas (no destructivo)
-- ============================================

-- Agregar has_portal a companies
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS has_portal BOOLEAN DEFAULT false;

-- Agregar payment_terms_days a invoices (movido desde companies)
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER DEFAULT 30;

-- Agregar projected_payment_date a invoices
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS projected_payment_date DATE;

-- ============================================
-- STEP 2: Quitar columnas obsoletas (destructivo)
-- ============================================

-- Quitar email de companies (el email es del contacto, no de la empresa)
ALTER TABLE companies
DROP COLUMN IF EXISTS email;

-- Quitar payment_terms_days de companies (movido a invoices)
ALTER TABLE companies
DROP COLUMN IF EXISTS payment_terms_days;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify companies structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'companies'
-- ORDER BY ordinal_position;

-- Verify invoices structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'invoices'
-- ORDER BY ordinal_position;
