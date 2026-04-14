-- Add imageUrl column to Template table
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "imageUrl" text;
