# Comprehensive Todo List for UPSA Birthday Wishes Web Application

This todo list is derived directly from the specification in `documentation.md`. Each task must be completed exactly as described, without additions or omissions. The project must be built in a unified Next.js 14 codebase with the specified tech stack.

## 1. Project Setup and Dependencies
- Install all specified packages: next, react, react-dom, typescript, tailwindcss, @shadcn/ui, prisma, @prisma/client, @supabase/supabase-js, @supabase/ssr, resend, @react-email/components, react-email, react-hook-form, zod, @hookform/resolvers, bcryptjs, rate-limiter-flexible, helmet, csrf, @types/bcryptjs, clsx, tailwind-merge, date-fns, sonner, lucide-react
- Set up Next.js 14 project with App Router
- Configure Tailwind CSS with shadcn/ui
- Create the exact folder structure as specified:
  - /app/login/page.tsx
  - /app/dashboard/page.tsx
  - /app/dashboard/people/page.tsx
  - /app/api/cron/birthday/route.ts
  - /app/api/people/route.ts
  - /app/api/people/[id]/route.ts
  - /components/Navbar.tsx, StatsCard.tsx, PeopleTable.tsx, AddPersonForm.tsx, UpcomingBirthdays.tsx, ConfirmDeleteDialog.tsx, /ui (shadcn components)
  - /emails/BirthdayEmail.tsx
  - /lib/supabase.ts, supabase-server.ts, db.ts, email.ts, rateLimit.ts, sanitize.ts
  - /prisma/schema.prisma
  - middleware.ts
  - vercel.json
  - .env.local
  - README.md
- Set up all environment variables in .env.local: DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, RESEND_API_KEY, CRON_SECRET
- Configure Prisma with PostgreSQL via Supabase
- Set up Supabase project with Auth enabled, Google OAuth provider
- Configure Resend API for emails
- Set up Vercel Cron with vercel.json for daily 8:00 AM run
- Create UPSA favicon using gold and blue colors

## 2. Brand and Design
- Implement color scheme: #FFD700 (gold), #003087 (blue), #FFFFFF (white)
- Use Inter or Poppins font from Google Fonts
- Apply clean, professional, modern university aesthetic: gold for buttons/highlights, blue for navbars/headers/sidebar, white for cards/text areas, subtle shadows, rounded-xl corners, smooth hover transitions

## 3. Database Schema
- Implement exact Prisma schema with Person model and Role enum
- Ensure unique email constraint
- Set up Prisma client in lib/db.ts

## 4. Authentication
- Implement login page at /login with centered card, UPSA logo placeholder, "UPSA Birthday Portal" heading, email/password fields with toggle, gold sign in button, divider, "Continue with Google" button with icon
- Use Supabase Auth for email/password via signInWithPassword and Google OAuth via signInWithOAuth
- Implement rate limiting for login: 5 attempts per 15 minutes per IP using rate-limiter-flexible
- Show inline error messages for wrong credentials
- Implement session management with Supabase SSR helpers, middleware.ts for /dashboard protection
- Restrict access to ADMIN_EMAIL only, sign out non-admins with "Access denied" message
- Handle logout with supabase.auth.signOut()

## 5. Security Measures
- Implement Zod validation for all forms and API bodies, reject invalid with 400 error
- Configure rate-limiter-flexible: 5 login per 15min/IP, 30 add person per min/IP, 429 responses
- Use bcryptjs for password hashing (salt rounds 12)
- Add helmet for security headers: X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, Referrer-Policy, Permissions-Policy, CSP (own + Supabase + Google + Resend)
- Implement CSRF protection on state-changing routes with csrf package, hidden tokens in forms
- Protect environment variables: server-side only for secrets, NEXT_PUBLIC_ prefix for public
- Secure cron route with Bearer token verification
- Use Prisma parameterized queries only, no raw SQL with user input
- Sanitize all text inputs (name, department, email) before DB save
- Set Supabase cookies with HttpOnly, Secure, SameSite=Lax

## 6. Pages and Features
### Login Page (/login)
- Build as specified with all elements, rate limiting, redirects

### Admin Dashboard (/dashboard)
- Navbar: UPSA logo left, "Birthday Portal" center, logout right (blue navbar, gold accents)
- Stats cards: Total Staff, Total Students, Birthdays This Month, Birthdays Today (icons, gold left-border)
- Upcoming Birthdays: next 5 with name, role badge (blue for Staff, gold for Student), formatted date, days remaining
- Quick Add button opening modal

### People Management Page (/dashboard/people)
- Searchable, filterable table: columns Name, Email, Role, Birthday (M/D), Department, Date Added, Actions
- Filters: All/Staff/Students
- Debounced search by name/email
- Actions: Edit pencil, Delete trash with confirmation
- Pagination: 10 per page
- Add Person button gold top right
- Horizontal scroll on mobile

### Add/Edit Person Modal
- Fields: Full Name, Email, Birthday (day/month picker, year optional), Role dropdown, Department optional
- Zod validation: required, valid email, no duplicates
- Gold submit, outlined blue cancel
- Success toast
- Sanitize inputs

### Birthday Email Template (/emails/BirthdayEmail.tsx)
- React Email: royal blue header, UPSA gold text, "Happy Birthday!" headline
- White card body, "Dear [Name]," greeting, warm message, cake emoji
- Blue footer "University of Professional Studies, Accra", gold divider

## 7. Cron Job
- Implement /api/cron/birthday route: Bearer token verification, query birthdays matching today, send personalized emails via Resend, log success/failure
- Configure vercel.json for daily 8:00 AM schedule

## 8. Additional Requirements
- Protect /dashboard routes with middleware.ts, redirect to /login
- Ensure mobile responsiveness: stack cards, horizontal table scroll
- Add empty states for no records
- Loading skeletons on people table
- Inline Zod validation errors on forms
- Confirmation dialog for delete
- README with setup instructions, including Google OAuth enablement in Supabase
- No plain text secrets in codebase

## 9. Deployment
- Deploy to Vercel with all configs
- Ensure production-quality code: complete, working, TypeScript typed

All tasks must adhere to the exact tech stack, no substitutions. Build production-ready code without placeholders.
