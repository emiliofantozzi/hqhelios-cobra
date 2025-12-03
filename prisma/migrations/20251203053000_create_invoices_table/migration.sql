-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "invoice_number" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "issue_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "confirmed_payment_date" DATE,
    "paid_date" DATE,
    "payment_status" VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    "payment_reference" VARCHAR(255),
    "description" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invoices_amount_check" CHECK (amount > 0),
    CONSTRAINT "invoices_due_date_check" CHECK (due_date >= issue_date),
    CONSTRAINT "invoices_payment_status_check" CHECK (
        payment_status IN ('pendiente', 'fecha_confirmada', 'pagada', 'escalada', 'suspendida', 'cancelada')
    )
);

-- CreateIndex - Unique constraint on tenant_id + invoice_number
CREATE UNIQUE INDEX "invoices_tenant_id_invoice_number_key" ON "invoices"("tenant_id", "invoice_number");

-- CreateIndex - Index for filtering by payment status
CREATE INDEX "invoices_tenant_id_payment_status_idx" ON "invoices"("tenant_id", "payment_status");

-- CreateIndex - Index for filtering by due date (for collection workflows)
CREATE INDEX "invoices_tenant_id_due_date_idx" ON "invoices"("tenant_id", "due_date");

-- CreateIndex - Index for company lookups
CREATE INDEX "invoices_company_id_idx" ON "invoices"("company_id");

-- AddForeignKey - Tenant relationship with CASCADE delete
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey - Company relationship with RESTRICT delete (can't delete company with invoices)
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Comments
COMMENT ON TABLE "invoices" IS 'Facturas asociadas a empresas cliente';
COMMENT ON COLUMN "invoices"."payment_status" IS 'Estados: pendiente, fecha_confirmada, pagada, escalada, suspendida, cancelada';
COMMENT ON COLUMN "invoices"."amount" IS 'Monto de la factura en la moneda especificada';
COMMENT ON COLUMN "invoices"."due_date" IS 'Fecha de vencimiento, debe ser >= issue_date';
