-- Create User table
CREATE TABLE "User" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text UNIQUE NOT NULL,
  "password" text NOT NULL,
  "role" text NOT NULL,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

-- Create Person table
CREATE TABLE "Person" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "email" text UNIQUE NOT NULL,
  "birthMonth" integer NOT NULL,
  "birthDay" integer NOT NULL,
  "role" text NOT NULL,
  "rank" text,
  "department" text,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

-- Create BirthdayEmail table
CREATE TABLE "BirthdayEmail" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "personId" uuid NOT NULL REFERENCES "Person"("id") ON DELETE CASCADE,
  "status" text NOT NULL DEFAULT 'pending',
  "subject" text,
  "sentAt" timestamptz DEFAULT now()
);

-- Create Template table
CREATE TABLE "Template" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text UNIQUE NOT NULL,
  "subject" text NOT NULL,
  "body" text NOT NULL,
  "isActive" boolean DEFAULT true,
  "isDefault" boolean DEFAULT false,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);
