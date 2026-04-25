'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import Pricing from '../../components/ui/pricing-component'
import { SwitchToggleTheme } from '../../components/ui/toggle-theme'

export default function PricingPage() {
  const router = useRouter()
  const { status } = useSession()

  const handleAuthClick = () => {
    if (status === 'authenticated') {
      router.push('/dashboard')
      return
    }
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-gray-200 dark:bg-black dark:text-gray-100 dark:selection:bg-gray-800 relative">
      <div className="absolute top-16 right-8 sm:right-32 z-40">
        <SwitchToggleTheme />
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 dark:border-gray-800 dark:bg-black/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
              <span className="text-lg font-semibold tracking-tight text-black dark:text-white">OttoAi</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/#features" className="text-sm font-medium text-gray-600 hover:text-black transition-colors dark:text-gray-400 dark:hover:text-white">Features</Link>
              <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-black transition-colors dark:text-gray-400 dark:hover:text-white">Pricing</Link>
              <Link href="/#blog" className="text-sm font-medium text-gray-600 hover:text-black transition-colors dark:text-gray-400 dark:hover:text-white">Blog</Link>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleAuthClick} className="text-sm font-medium text-gray-600 hover:text-black transition-colors hidden sm:block dark:text-gray-400 dark:hover:text-white">
                Log in
              </button>
              <button
                onClick={handleAuthClick}
                className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <Pricing />

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white pt-16 pb-8 mt-12 dark:bg-black dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
              <span className="text-lg font-semibold tracking-tight text-black dark:text-white">OttoAi</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
              <Link href="#" className="hover:text-black dark:hover:text-white">Privacy Policy</Link>
              <Link href="#" className="hover:text-black dark:hover:text-white">Terms of Service</Link>
              <Link href="#" className="hover:text-black dark:hover:text-white">Contact</Link>
            </div>
          </div>
          <div className="mt-8 text-center md:text-left text-sm text-gray-400">
            &copy; {new Date().getFullYear()} OttoAi. Built for your Google workflow.
          </div>
        </div>
      </footer>
    </div>
  )
}
