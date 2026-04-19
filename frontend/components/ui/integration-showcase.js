"use client"

import { motion } from "framer-motion"
import { cn } from "../../lib/utils"

function HighlightedTitle({ text }) {
  const parts = text.split(/~/)
  return (
    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
      {parts.map((part, index) =>
        index === 1 ? (
          <span key={`${part}-${index}`} className="relative whitespace-nowrap text-gray-900 dark:text-white">
            <span className="relative">{part}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 418 42"
              className="absolute -bottom-1.5 left-0 h-auto w-full text-emerald-200"
              preserveAspectRatio="none"
            >
              <path
                d="M203.371.916c-26.013-2.078-76.686 1.98-114.243 8.919-37.556 6.939-78.622 17.103-122.256 28.703-43.633 11.6-4.984 14.306 43.123 7.021 48.107-7.285 93.638-16.096 146.446-17.742 52.808-1.646 105.706 5.429 158.649 14.13 52.943 8.701 105.886 19.342 158.826 29.483 52.94 10.141 52.94 10.141-11.41-19.043C371.18 14.363 322.753 5.488 281.339 2.143 239.925-1.201 203.371.916 203.371.916z"
                fill="currentColor"
              />
            </svg>
          </span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </h2>
  )
}

export function IntegrationShowcase({
  title,
  subtitle,
  illustrationSrc,
  illustrationAlt,
  integrations,
  className,
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        ease: "easeOut",
      },
    },
  }

  return (
    <section className={cn("w-full py-16 sm:py-20", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-x-12 gap-y-10 lg:grid-cols-2">
          <div className="max-w-xl">
            <HighlightedTitle text={title} />
            <p className="mt-4 text-base text-gray-600 sm:text-lg dark:text-gray-400">{subtitle}</p>
          </div>
          <div className="flex items-center justify-center lg:justify-center">
            <img src={illustrationSrc} alt={illustrationAlt} className="h-auto w-64 object-contain dark:invert" />
          </div>
        </div>

        <motion.div
          className="mt-14 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {integrations.map((item) => (
            <motion.div key={item.name} variants={itemVariants} className="flex items-start space-x-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:bg-black dark:border-gray-800">
              <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-transparent">
                <img src={item.iconSrc} alt={`${item.name} logo`} className={`h-5 w-5 object-contain ${item.invertDark ? 'dark:brightness-0 dark:invert' : ''}`} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-8 text-sm text-gray-400">And many more integrations coming soon to expand your automation platform.</p>
      </div>
    </section>
  )
}
