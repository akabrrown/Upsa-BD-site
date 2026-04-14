-- Migration: Add attachments column to Template table
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "attachments" JSONB DEFAULT '[]'::jsonb;
