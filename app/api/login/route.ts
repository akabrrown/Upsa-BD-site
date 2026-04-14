import { NextRequest, NextResponse } from 'next/server'
import { loginLimiter } from '@/lib/rateLimit'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  try {
    await loginLimiter.consume(ip)
  } catch {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error for email:', email, 'Error:', error.message)
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  if (data.user?.email !== process.env.ADMIN_EMAIL) {
    console.warn('Unauthorized access attempt by:', data.user?.email, 'Admin email is:', process.env.ADMIN_EMAIL)
    await supabase.auth.signOut()
    return NextResponse.json({ error: 'Access denied. This portal is for admins only.' }, { status: 403 })
  }

  console.log('Successful login for admin:', data.user?.email)

  return NextResponse.json({ success: true })
}
