-- CreateEnum
CREATE TYPE "monitor_type" AS ENUM ('HTTP', 'TCP');

-- CreateEnum
CREATE TYPE "monitor_status" AS ENUM ('Up', 'Down', 'Unknown');

-- CreateTable
CREATE TABLE "monitor" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "type" "monitor_type" NOT NULL DEFAULT 'HTTP',
    "interval_seconds" INTEGER NOT NULL DEFAULT 180,
    "last_status" "monitor_status",
    "last_status_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitor_check" (
    "id" TEXT NOT NULL,
    "response_time_ms" INTEGER NOT NULL,
    "status" "monitor_status" NOT NULL,
    "region_id" TEXT NOT NULL,
    "monitor_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitor_check_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monitor_org_id_idx" ON "monitor"("org_id");

-- CreateIndex
CREATE INDEX "monitor_check_monitor_id_createdAt_idx" ON "monitor_check"("monitor_id", "createdAt");

-- AddForeignKey
ALTER TABLE "monitor_check" ADD CONSTRAINT "monitor_check_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitor_check" ADD CONSTRAINT "monitor_check_monitor_id_fkey" FOREIGN KEY ("monitor_id") REFERENCES "monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
