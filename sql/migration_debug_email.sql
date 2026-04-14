-- Migration: Add error column to BirthdayEmail table
ALTER TABLE "BirthdayEmail" ADD COLUMN IF NOT EXISTS "error" text;
