# UPSA Birthday Wishes

A full-stack web application for managing staff and student records and sending automated birthday emails at the University of Professional Studies, Accra (UPSA).

## Features

- Admin authentication with email/password and Google OAuth
- Manage staff and student records
- Automated daily birthday email sending
- Responsive design with UPSA branding

## Tech Stack

- Next.js 14 App Router
- Tailwind CSS
- shadcn/ui
- Prisma
- Supabase (database + auth)
- Resend + React Email
- Vercel Cron
- React Hook Form + Zod
- Security: helmet, rate-limiter-flexible, bcryptjs, csrf

## Setup Instructions

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd upsa-birthday-wishes
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Supabase**

   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your project URL and anon/public key
   - Go to Settings > Database to get the database URL
   - Enable Authentication > Providers > Google
     - Create a Google OAuth app at [Google Cloud Console](https://console.cloud.google.com)
     - Add the client ID and secret to Supabase under Authentication > Providers > Google

4. **Set up Resend**

   - Create an account at [resend.com](https://resend.com)
   - Get your API key

5. **Environment Variables**

   Create a `.env.local` file in the root directory with the following:

   ```
   DATABASE_URL=your_supabase_database_url
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ADMIN_EMAIL=admin@example.com
   RESEND_API_KEY=your_resend_api_key
   CRON_SECRET=your_cron_secret
   ```

6. **Database Setup**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

7. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

8. **Deploy to Vercel**

   - Push to GitHub
   - Import to Vercel
   - Set environment variables in Vercel dashboard
   - The cron job will run daily at 8:00 AM UTC

## Usage

- Login with the admin email
- Add staff and students
- The system will automatically send birthday emails daily

## Security

- All passwords are hashed
- Rate limiting on login and API calls
- CSRF protection
- Input sanitization
- Secure cookies
- Cron route protected with Bearer token
