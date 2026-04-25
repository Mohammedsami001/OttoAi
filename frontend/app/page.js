'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { Marquee } from '../components/ui/marquee'
import { BackgroundPaths } from '../components/ui/background-paths'
import { IntegrationShowcase } from '../components/ui/integration-showcase'
import { SwitchToggleTheme } from '../components/ui/toggle-theme'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

const fadeVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8, ease: 'easeOut' } }
}

const integrationsData = [
  { name: 'Gmail', description: 'Live now: AI inbox summaries and smart replies.', iconSrc: 'https://img.icons8.com/color/48/gmail-new.png' },
  { name: 'Google Calendar', description: 'Live now: booking sync and conflict handling.', iconSrc: 'https://img.icons8.com/color/48/google-calendar--v2.png' },
  { name: 'Google Meet', description: 'Live now: automatic Meet link creation.', iconSrc: 'https://img.icons8.com/color/48/google-meet--v1.png' },
  { name: 'Google Docs', description: 'Live now: document listing and AI summaries.', iconSrc: 'https://img.icons8.com/color/48/google-docs--v1.png' },
  { name: 'Google Health', description: 'Live now: daily step tracking and health metrics.', iconSrc: 'https://img.icons8.com/color/48/heart-health.png' },
  { name: 'Google Analytics', description: 'Planned: traffic, engagement, and conversion metrics.', iconSrc: 'https://cdn.worldvectorlogo.com/logos/google-analytics-3.svg' },
  { name: 'Slack', description: 'Coming soon: alerting and team notifications.', iconSrc: 'https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg' },
  { name: 'Notion', description: 'Coming soon: notes and workspace sync.', iconSrc: 'https://cdn.worldvectorlogo.com/logos/notion-2.svg', invertDark: true },
]

const marqueePhrases = [
  'Self-evolving automation',
  'Designed to adapt',
  'Workflow intelligence redefined',
  'Built to keep improving',
]

export default function Home() {
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
              <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-black transition-colors dark:text-gray-400 dark:hover:text-white">Features</Link>
              <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-black transition-colors dark:text-gray-400 dark:hover:text-white">Pricing</Link>
              <Link href="#blog" className="text-sm font-medium text-gray-600 hover:text-black transition-colors dark:text-gray-400 dark:hover:text-white">Blog</Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center mr-2">
                <SwitchToggleTheme />
              </div>
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

      {/* Hero Section */}
      <BackgroundPaths
        title="Your autonomous personal operations platform."
        subtitle="OttoAi connects your Gmail, Calendar, and Meet — then works in the background to summarize your inbox, track subscriptions, and keep you organized."
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <button 
            onClick={handleAuthClick}
            className="bg-black text-white px-8 py-3.5 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-sm text-base dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">Powered by your Google account.</p>
      </BackgroundPaths>

      {/* Trust Badge Section */}
      <motion.section 
        className="py-14 border-y border-gray-100 bg-gradient-to-b from-gray-50 to-white dark:border-gray-800 dark:from-gray-950 dark:to-black"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={fadeVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.28em]">Integrates seamlessly with your favorite tools</p>
          </div>

          <div className="relative overflow-hidden py-2">
            <Marquee pauseOnHover duration={24} fade fadeAmount={12} className="py-4">
              {marqueePhrases.map((phrase) => (
                <span key={phrase} className="mx-10 text-2xl font-medium tracking-tight text-gray-700 whitespace-nowrap dark:text-gray-300">
                  {phrase}
                </span>
              ))}
            </Marquee>
          </div>
        </div>
      </motion.section>

      <section id="features" className="bg-white dark:bg-black">
        <IntegrationShowcase
          title="Connect your ~evolving~ stack"
          subtitle="Use the apps that work today, and grow into the ones that are coming soon."
          illustrationSrc="https://tally.so/images/demo/v2/strategy.png"
          illustrationAlt="Checklist strategy illustration"
          integrations={integrationsData}
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white pt-16 pb-8 dark:bg-black dark:border-gray-800">
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
