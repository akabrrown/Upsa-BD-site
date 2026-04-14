-- Add rank column (nullable initially)
ALTER TABLE "Person" ADD COLUMN "rank" text;

-- Data normalization:
-- Anyone whose role is not 'STAFF' or 'STUDENT' gets their custom rank moved into the 'rank' column, and their role is defaulted to 'STAFF'.
-- If someone's role was strictly 'STAFF' or 'STUDENT', their rank will naturally remain NULL unless updated later.
UPDATE "Person"
SET "rank" = "role", 
    "role" = 'STAFF'
WHERE "role" NOT IN ('STAFF', 'STUDENT');
