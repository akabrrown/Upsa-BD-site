'use client'

import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'

function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'People', href: '/dashboard/people' },
    { name: 'Templates', href: '/dashboard/templates' },
  ]

  return (
    <nav className="bg-white text-[#003087] py-2.5 px-4 shadow-sm relative z-50">
      <div className="flex justify-between items-center bg-white">
        <div className="flex items-center gap-6">
          <Image src="/download.png" alt="UPSA Logo" width={44} height={44} className="object-contain" style={{ width: 'auto', height: 'auto' }} priority />

          {/* Desktop Nav */}
          <div className="hidden md:flex gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`bg-[#003087] text-white px-4 py-2 rounded-full hover:bg-[#FFD700] hover:text-[#003087] transition-colors font-medium ${pathname === link.href ? 'bg-[#FFD700] text-[#003087]' : ''
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop Title & Logout */}
        <div className="hidden md:block text-center font-bold absolute left-1/2 -translate-x-1/2">
          Birthday Portal
        </div>
        <div className="hidden md:block">
          <button onClick={handleLogout} className="bg-[#003087] text-white px-4 py-2 rounded-full hover:bg-[#FFD700] hover:text-[#003087] transition-colors font-medium">Logout</button>
        </div>

        {/* Mobile Header Elements */}
        <div className="md:hidden font-bold absolute left-1/2 -translate-x-1/2 text-sm">
          Birthday Portal
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-[#003087] p-1">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-xl py-4 px-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl font-medium ${pathname === link.href ? 'bg-[#003087] text-white' : 'bg-gray-50 text-[#003087] hover:bg-gray-100'
                }`}
            >
              {link.name}
            </Link>
          ))}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false)
              handleLogout()
            }}
            className="mt-2 w-full text-left px-4 py-3 rounded-xl font-medium bg-red-50 text-red-600 hover:bg-red-100"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}

export default Navbar
