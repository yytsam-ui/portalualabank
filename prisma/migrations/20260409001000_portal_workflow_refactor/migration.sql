-- CreateEnum
CREATE TYPE "InvoiceSourceType" AS ENUM ('AREA', 'AP_MONITOR');

-- AlterEnum
BEGIN;
CREATE TYPE "InvoiceStatus_new" AS ENUM ('DRAFT', 'PENDING_AREA_APPROVAL', 'REJECTED_BY_AREA', 'DERIVED_TO_AP', 'RETURNED_BY_AP', 'ACCOUNTED', 'CANCELED');
ALTER TABLE "public"."Invoice" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Invoice" ALTER COLUMN "status" TYPE "InvoiceStatus_new" USING ("status"::text::"InvoiceStatus_new");
ALTER TYPE "InvoiceStatus" RENAME TO "InvoiceStatus_old";
ALTER TYPE "InvoiceStatus_new" RENAME TO "InvoiceStatus";
DROP TYPE "public"."InvoiceStatus_old";
ALTER TABLE "Invoice" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_purchaseOrderId_fkey";

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "accountCode" TEXT,
ADD COLUMN     "areaAssigned" TEXT,
ADD COLUMN     "costCenter" TEXT,
ADD COLUMN     "sourceType" "InvoiceSourceType" NOT NULL DEFAULT 'AREA',
ALTER COLUMN "purchaseOrderId" DROP NOT NULL,
ALTER COLUMN "invoiceNumber" DROP NOT NULL,
ALTER COLUMN "invoiceType" DROP NOT NULL,
ALTER COLUMN "invoiceDate" DROP NOT NULL,
ALTER COLUMN "currency" DROP NOT NULL,
ALTER COLUMN "subtotal" DROP NOT NULL,
ALTER COLUMN "taxes" DROP NOT NULL,
ALTER COLUMN "totalAmount" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "accountCode" TEXT NOT NULL,
ADD COLUMN     "costCenter" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

