'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

import Image from 'next/image'

function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-md bg-white border-0 shadow-2xl rounded-3xl overflow-hidden">
        <div className="bg-[#003087] relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-400/10 rounded-full -ml-12 -mb-12 blur-xl"></div>

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

            <p className="text-center text-gray-400 font-medium text-xs mt-6">
              © {new Date().getFullYear()} UPSA IT Services. All rights reserved.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage
