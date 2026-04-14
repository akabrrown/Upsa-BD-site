-- Run this in your Supabase SQL Editor to update the existing table
ALTER TABLE "BirthdayEmail"
  ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "subject" text;

-- Optional: If you want to update the foreign key to ON DELETE CASCADE
-- ALTER TABLE "BirthdayEmail" DROP CONSTRAINT "BirthdayEmail_personId_fkey";
-- ALTER TABLE "BirthdayEmail" ADD CONSTRAINT "BirthdayEmail_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE;
