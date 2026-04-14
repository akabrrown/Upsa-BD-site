/** @type {import('next').NextConfig} */
const nextConfig = {

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://*.supabase.co https://vercel.live https://*.vercel.live https://www.google-analytics.com https://www.googletagmanager.com blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com https://vercel.live https://*.vercel.live; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://vercel.live https://*.vercel.live https://www.google-analytics.com https://*.google-analytics.com; frame-src https://accounts.google.com https://vercel.live;",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
