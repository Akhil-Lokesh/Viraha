-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "ip" VARCHAR(64),
ADD COLUMN     "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_agent" VARCHAR(512);

-- CreateTable
CREATE TABLE "mutes" (
    "id" UUID NOT NULL,
    "muter_id" UUID NOT NULL,
    "muted_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mutes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mutes_muter_id_idx" ON "mutes"("muter_id");

-- CreateIndex
CREATE INDEX "mutes_muted_id_idx" ON "mutes"("muted_id");

-- CreateIndex
CREATE UNIQUE INDEX "mutes_muter_id_muted_id_key" ON "mutes"("muter_id", "muted_id");

-- AddForeignKey
ALTER TABLE "mutes" ADD CONSTRAINT "mutes_muter_id_fkey" FOREIGN KEY ("muter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutes" ADD CONSTRAINT "mutes_muted_id_fkey" FOREIGN KEY ("muted_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
