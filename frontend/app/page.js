'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { Marquee } from '../components/ui/marquee'
import { IntegrationShowcase } from '../components/ui/integration-showcase'

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
  { name: 'Google Analytics', description: 'Planned: traffic, engagement, and conversion metrics.', iconSrc: 'https://cdn.worldvectorlogo.com/logos/google-analytics-3.svg' },
  { name: 'Slack', description: 'Coming soon: alerting and team notifications.', iconSrc: 'https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg' },
  { name: 'Notion', description: 'Coming soon: notes and workspace sync.', iconSrc: 'https://cdn.worldvectorlogo.com/logos/notion-2.svg' },
  { name: 'And many more', description: 'Coming soon: more integrations are on the roadmap.', iconSrc: 'https://img.icons8.com/ios-glyphs/60/plus-math.png' },
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
    <div className="min-h-screen bg-white text-gray-900 selection:bg-gray-200">
      {/* Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
              <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
                <span className="text-white text-xs font-bold">O</span>
              </div>
              <span className="text-lg font-semibold tracking-tight text-black">OttoAi</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Features</Link>
              <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Pricing</Link>
              <Link href="#blog" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Blog</Link>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleAuthClick} className="text-sm font-medium text-gray-600 hover:text-black transition-colors hidden sm:block">
                Log in
              </button>
              <button
                onClick={handleAuthClick}
                className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pb-32 overflow-hidden">
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.h1 
            variants={itemVariants}
            className="text-5xl sm:text-7xl font-bold tracking-tight text-black mb-8 max-w-4xl mx-auto"
          >
            Your autonomous personal operations platform.
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto"
          >
            OttoAi connects your Gmail, Calendar, and Meet — then works in the background to summarize your inbox, track subscriptions, and keep you organized.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button 
              onClick={handleAuthClick}
              className="bg-black text-white px-8 py-3.5 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-sm text-base"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
          <motion.p variants={itemVariants} className="mt-4 text-sm text-gray-500">Powered by your Google account.</motion.p>
        </motion.div>
      </section>

      {/* Trust Badge Section */}
      <motion.section 
        className="py-14 border-y border-gray-100 bg-gradient-to-b from-gray-50 to-white"
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
              <span className="mx-10 text-2xl font-medium tracking-tight text-gray-700 whitespace-nowrap">Google Calendar</span>
              <span className="mx-10 text-2xl font-medium tracking-tight text-gray-700 whitespace-nowrap">Google Meet</span>
              <span className="mx-10 text-2xl font-medium tracking-tight text-gray-700 whitespace-nowrap">Gmail</span>
              <span className="mx-10 text-2xl font-medium tracking-tight text-gray-700 whitespace-nowrap">Google Docs</span>
            </Marquee>
          </div>
        </div>
      </motion.section>

      <section id="features" className="bg-white">
        <IntegrationShowcase
          title="Connect your ~Google~ stack"
          subtitle="Use what works today, with more integrations coming soon."
          illustrationSrc="https://tally.so/images/demo/v2/strategy.png"
          illustrationAlt="Checklist strategy illustration"
          integrations={integrationsData}
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
              <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
                <span className="text-white text-xs font-bold">O</span>
              </div>
              <span className="text-lg font-semibold tracking-tight text-black">OttoAi</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="#" className="hover:text-black">Privacy Policy</Link>
              <Link href="#" className="hover:text-black">Terms of Service</Link>
              <Link href="#" className="hover:text-black">Contact</Link>
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
