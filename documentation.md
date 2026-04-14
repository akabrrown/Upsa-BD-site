Here's the complete, final, copy-paste ready prompt:

---

**PROJECT OVERVIEW**

Build a full-stack school birthday wishes web application for the University of Professional Studies, Accra (UPSA). The site allows an admin to manage staff and student records, and automatically sends personalized birthday wish emails on each person's birthday. The entire project must be in one unified Next.js codebase — no separated frontend/backend.

---

**BRAND & DESIGN**

Primary Color: `#FFD700` (UPSA Gold/Yellow)
Secondary Color: `#003087` (UPSA Royal Blue)
Accent: `#FFFFFF` (White)
Font: Inter or Poppins from Google Fonts
Style: Clean, professional, modern university aesthetic. Use gold for buttons, highlights, and accents. Use royal blue for navbars, headers, sidebar, and backgrounds. White for card surfaces and text areas. Subtle card shadows, rounded corners (rounded-xl), smooth hover transitions.

---

**TECH STACK**

- Framework: Next.js 14 (App Router)
- Styling: Tailwind CSS + shadcn/ui
- Database: Prisma ORM + PostgreSQL (via Supabase)
- Auth: Supabase Auth (email/password + Google OAuth)
- Email: Resend API + React Email
- Automation: Vercel Cron Jobs (runs daily at 8:00 AM)
- Deployment: Vercel
- Form handling: React Hook Form + Zod validation
- Security: helmet, rate-limiter-flexible, zod, bcryptjs, csrf (all free)

---

**AUTHENTICATION**

Authentication is handled entirely through Supabase Auth using `@supabase/supabase-js` and `@supabase/ssr`. Remove any reference to NextAuth.js.

Two sign-in methods on the login page:

**1. Email & Password**
- Admin enters email and password
- Authenticated via `supabase.auth.signInWithPassword()`
- Passwords are hashed using bcryptjs before any comparison outside Supabase
- Show inline error messages for wrong credentials
- Rate limit login attempts to 5 per 15 minutes per IP using `rate-limiter-flexible` to block brute force attacks

**2. Sign in with Google (Gmail)**
- "Continue with Google" button with the Google logo icon below the email/password form, separated by an "or" divider
- Authenticated via `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Google OAuth must be enabled in Supabase dashboard under Authentication → Providers → Google
- Redirect back to `/dashboard` on success

**Session Management**
- Use Supabase SSR helpers to manage session cookies across server and client components
- `middleware.ts` checks for a valid Supabase session on all `/dashboard` routes and redirects unauthenticated users to `/login`
- On logout, call `supabase.auth.signOut()` and redirect to `/login`
- Sessions automatically expire and refresh via Supabase's built-in token rotation

**Admin Restriction**
- After login via either method, check that the signed-in user's email matches the `ADMIN_EMAIL` environment variable
- If the email does not match, immediately sign the user out and display: "Access denied. This portal is for admins only."
- This prevents any Google account from accessing the dashboard

---

**SECURITY LIBRARIES & MEASURES (All Free)**

**1. Zod — Input Validation**
- Validate all form inputs and API request bodies with Zod schemas on both client and server side
- Reject any request that does not match the expected schema with a 400 error

**2. rate-limiter-flexible — Brute Force Protection**
- Limit login attempts to 5 per 15 minutes per IP address
- Limit the Add Person API to 30 requests per minute per IP
- Return a 429 Too Many Requests response when limit is exceeded
- Use in-memory store (no Redis needed for MVP)

**3. bcryptjs — Password Hashing**
- Hash any passwords stored or compared outside of Supabase with bcryptjs (salt rounds: 12)
- Never store or log plain text passwords anywhere

**4. helmet — HTTP Security Headers**
- Add helmet via a Next.js custom server or middleware to set the following headers automatically:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`
  - `Content-Security-Policy` (restrict to own origin + Supabase + Google + Resend domains)

**5. CSRF Protection**
- Use the `csrf` npm package to generate and validate CSRF tokens on all state-changing API routes (POST, PUT, DELETE)
- Embed the CSRF token in forms as a hidden field and verify it server-side on every mutation

**6. Environment Variable Protection**
- All secrets (Supabase keys, Resend key, Cron secret, Admin email) must only be accessed server-side
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `RESEND_API_KEY` to the client bundle
- Prefix only truly public variables with `NEXT_PUBLIC_`

**7. Cron Route Protection**
- The `/api/cron/birthday` route must verify a `Authorization: Bearer <CRON_SECRET>` header on every request
- Return 401 Unauthorized if the secret does not match
- This prevents anyone from triggering the cron manually

**8. SQL Injection Prevention**
- All database queries go through Prisma's parameterized query system — never use raw SQL strings with user input

**9. Input Sanitization**
- Sanitize all text inputs (name, department, email) to strip HTML tags and script content before saving to the database using a lightweight sanitizer

**10. Secure Cookies**
- Supabase SSR session cookies must be set with `HttpOnly`, `Secure`, and `SameSite=Lax` flags
- Never store session tokens in localStorage

---

**PAGES & FEATURES**

**1. Login Page (`/login`)**
- Centered card with UPSA logo placeholder at top
- "UPSA Birthday Portal" as the heading
- Email input and password input fields with show/hide password toggle
- "Sign In" button in gold (#FFD700) with blue text
- Divider line with "or" text between the two auth methods
- "Continue with Google" button with Google icon (white background, blue border)
- Inline error messages for failed login or access denied
- Rate limited to 5 attempts per 15 minutes per IP
- Redirect to `/dashboard` on successful login

**2. Admin Dashboard (`/dashboard`)**
- Top navbar: UPSA logo left, "Birthday Portal" title center, logout button right (royal blue navbar, gold accents)
- Stats cards row showing: Total Staff, Total Students, Birthdays This Month, Birthdays Today — each with an icon and gold left-border accent
- Upcoming Birthdays section: next 5 upcoming birthdays with name, role badge (Staff = blue, Student = gold), formatted date, and days remaining countdown
- Quick Add button that opens a modal to add a new person

**3. People Management Page (`/dashboard/people`)**
- Searchable, filterable data table of all staff and students
- Columns: Name, Email, Role, Birthday (Month and Day), Department, Date Added, Actions
- Filter by role: All / Staff / Students
- Search by name or email (debounced input)
- Actions: Edit (pencil icon) and Delete (trash icon with confirmation dialog)
- Pagination: 10 records per page
- "Add Person" button top right in gold
- Horizontal scroll on mobile

**4. Add / Edit Person Modal**
- Fields: Full Name, Email Address, Birthday (day and month picker, year optional), Role (Staff / Student dropdown), Department (optional)
- Zod validation: required fields, valid email format, no duplicate emails
- Submit button in gold, Cancel in outlined blue
- Success toast notification on save
- All inputs sanitized before database write

**5. Birthday Wish Template Management Page (`/dashboard/templates`)**

- Table of existing email templates with columns: Template Name, Subject, Created Date, Status (Active/Inactive), Actions
- Searchable and sortable table (by name, date)
- "Create Template" button top right in gold
- Actions: Edit (pencil icon), Preview (eye icon), Delete (trash icon with confirmation dialog)
- Preview modal shows rendered email template with sample data
- Create/Edit Template Modal:
  - Fields: Template Name, Email Subject, Email Body (rich text editor or HTML)
  - Zod validation: required fields, unique template names
  - Save as draft or publish
  - Test send button to send preview to admin email
- Set Default Template: radio button to select which template is used for automatic birthday emails
- Pagination: 10 templates per page
- Empty state: "No templates created yet. Create your first birthday wish template!"
- Mobile responsive with horizontal scroll

**6. Birthday Email Template (`/emails/BirthdayEmail.tsx`)** 
- Built with React Email
- Header: royal blue background, UPSA name in gold text, "Happy Birthday!" headline
- Body: white card, personalized "Dear [Name]," greeting, warm birthday message from UPSA management, birthday cake emoji
- Footer: "University of Professional Studies, Accra" in blue, gold divider line
- Professional, warm, and celebratory tone

**7. Cron Job API Route (`/api/cron/birthday`)**
- Runs every day at 8:00 AM via Vercel Cron
- Protected with `Authorization: Bearer <CRON_SECRET>` header verification
- Queries the database for all people whose `birthMonth` and `birthDay` match today's date
- Sends a personalized birthday email to each matched person via Resend
- Logs success or failure per send

---

**DATABASE SCHEMA (Prisma)**

```prisma
model Person {
  id         String   @id @default(cuid())
  name       String
  email      String   @unique
  birthMonth Int
  birthDay   Int
  role       Role     @default(STUDENT)
  department String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model Template {
  id        String   @id @default(cuid())
  name      String   @unique
  subject   String
  body      String   // HTML content for email body
  isActive  Boolean  @default(true)
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  STAFF
  STUDENT
}
```

---

**ENVIRONMENT VARIABLES**

```
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL=
RESEND_API_KEY=
CRON_SECRET=
```

---

**PACKAGES TO INSTALL**

```
Core:
next, react, react-dom, typescript, tailwindcss, @shadcn/ui

Database:
prisma, @prisma/client

Auth & Supabase:
@supabase/supabase-js, @supabase/ssr

Email:
resend, @react-email/components, react-email

Forms & Validation:
react-hook-form, zod, @hookform/resolvers

Security:
bcryptjs, rate-limiter-flexible, helmet, csrf, @types/bcryptjs

Utilities:
clsx, tailwind-merge, date-fns, sonner (toasts), lucide-react
```

---

**FOLDER STRUCTURE**
/app
  /login
    page.tsx
  /dashboard
    page.tsx               → Stats + Upcoming Birthdays
    /people
      page.tsx             → People Table
    /templates
      page.tsx             → Template Management
  /api
    /cron
      /birthday
        route.ts
    /people
      route.ts             → GET all, POST new
    /people/[id]
      route.ts             → PUT update, DELETE
    /templates
      route.ts             → GET all, POST new
    /templates/[id]
      route.ts             → PUT update, DELETE
/components
  Navbar.tsx
  StatsCard.tsx
  PeopleTable.tsx
  AddPersonForm.tsx
  UpcomingBirthdays.tsx
  ConfirmDeleteDialog.tsx
  /ui                      → shadcn components
/emails
  BirthdayEmail.tsx
/lib
  supabase.ts              → browser Supabase client
  supabase-server.ts       → server Supabase client
  db.ts                    → Prisma client
  email.ts                 → Resend helper
  rateLimit.ts             → rate-limiter-flexible config
  sanitize.ts              → input sanitizer helper
/prisma
  schema.prisma
middleware.ts              → session guard for /dashboard
vercel.json                → cron schedule config
.env.local
README.md
```

---

**VERCEL CRON CONFIG (`vercel.json`)**

```json
{
  "crons": [
    {
      "path": "/api/cron/birthday",
      "schedule": "0 8 * * *"
    }
  ]
}
```

---

**ADDITIONAL REQUIREMENTS**

- All `/dashboard` routes protected via `middleware.ts` — unauthenticated users redirected to `/login`
- Mobile responsive — cards stack vertically, table scrolls horizontally on small screens
- Empty states with a friendly message when no records exist
- Loading skeletons on the people table while data is fetching
- All forms show inline Zod validation errors
- Delete action requires confirmation dialog before executing
- Favicon using UPSA gold and blue colors
- README with full setup instructions including how to enable Google OAuth in Supabase
- No plain text secrets in the codebase — everything through `.env.local`

---

This is the complete, production-grade prompt. Every piece — auth, security, design, database, email, automation, and structure — is unified and ready to paste directly into your AI builder.