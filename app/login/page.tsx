'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

import Image from 'next/image'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(searchParams.get('error') || '')
  
  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) setError(urlError)
  }, [searchParams])

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setError('')
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    })
    const data = await response.json()
    if (response.ok) {
      router.push('/dashboard')
    } else {
      setError(data.error)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-md bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden">
        <div className="bg-[#003087] relative overflow-hidden flex flex-col">

          <div className="w-full bg-white p-8 relative z-10 border-b-4 border-[#FFD700] mb-8">
            <div className="relative w-full h-32">
              <Image 
                src="/download.png" 
                alt="UPSA Logo" 
                fill 
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain drop-shadow-sm" 
                priority 
              />
            </div>
          </div>

          <div className="px-8 pb-12 text-center text-white relative z-10">
            <h1 className="text-3xl font-black tracking-tight uppercase leading-none">Birthday Portal</h1>
            <p className="text-blue-100/80 font-bold mt-3 text-sm tracking-wide">
              Celebrating our community,<br />one birthday at a time.
            </p>
          </div>
        </div>

        <CardContent className="p-8 md:p-10">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-bold ml-1">Official Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@upsamail.edu.gh"
                {...form.register('email')}
                className="h-12 rounded-xl border-gray-200 focus:ring-[#003087]/10 focus:border-[#003087] transition-all"
              />
              {form.formState.errors.email && <p className="text-red-500 text-xs font-bold pl-1">{form.formState.errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" title="Password" className="text-gray-700 font-bold ml-1">Access Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...form.register('password')}
                  className="h-12 rounded-xl border-gray-200 focus:ring-[#003087]/10 focus:border-[#003087] transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#003087] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {form.formState.errors.password && <p className="text-red-500 text-xs font-bold pl-1">{form.formState.errors.password.message}</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-bold animate-shake">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#FFD700] text-[#003087] font-black h-12 rounded-xl shadow-lg hover:bg-yellow-400 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Sign Into Portal
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500 font-medium">Or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full bg-white text-gray-700 font-bold h-12 rounded-xl shadow-sm border-blue-200 hover:bg-gray-50 hover:border-[#003087] transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                <path d="M1 1h22v22H1z" fill="none"/>
              </svg>
              Continue with Google
            </Button>

            <p className="text-center text-gray-400 font-medium text-xs mt-6">
              © {new Date().getFullYear()} UPSA IT Services. All rights reserved.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
