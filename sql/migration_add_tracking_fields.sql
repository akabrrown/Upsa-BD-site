-- Add tracking columns to BirthdayEmail table
ALTER TABLE "BirthdayEmail" 
ADD COLUMN IF NOT EXISTS "openedAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "repliedAt" TIMESTAMP WITH TIME ZONE;

-- Update status constraint or documentation:
-- status can now be 'sent', 'opened', 'replied', 'failed'
