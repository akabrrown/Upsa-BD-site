-- Step 1: Add the new columns as nullable first
ALTER TABLE "Person" 
  ADD COLUMN "surname" TEXT,
  ADD COLUMN "otherNames" TEXT,
  ADD COLUMN "gender" TEXT,
  ADD COLUMN "birthYear" INTEGER;

-- Step 2: Migrate data from "name" to "surname" and "otherNames"
-- We'll assume the last word is the surname and everything before is otherNames.
-- If there's only one word, it becomes the surname.
UPDATE "Person"
SET 
  "surname" = COALESCE(NULLIF(reverse(split_part(reverse("name"), ' ', 1)), ''), "name"),
  "otherNames" = COALESCE(NULLIF(trim(both from substring("name" from 1 for length("name") - length(split_part(reverse("name"), ' ', 1)))), ''), "name"),
  "gender" = 'UNKNOWN'; -- Defaulting gender to UNKNOWN as we can't infer it

-- Optional: if the above string manipulation fails on some databases, a simpler split:
-- UPDATE "Person" SET "otherNames" = "name", "surname" = "name", "gender" = 'UNKNOWN';
-- (This simpler approach just copies the full name into both to prevent NOT NULL constraint errors if the advanced splitting fails).
-- I'll use the advanced split for PostgreSQL which works well.

-- Step 3: Make the new required columns NOT NULL
ALTER TABLE "Person" 
  ALTER COLUMN "surname" SET NOT NULL,
  ALTER COLUMN "otherNames" SET NOT NULL,
  ALTER COLUMN "gender" SET NOT NULL;

-- Step 4: Drop the old columns
ALTER TABLE "Person" 
  DROP COLUMN "name",
  DROP COLUMN "department";
