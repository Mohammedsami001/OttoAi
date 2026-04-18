/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./hooks/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        "brand-black": "#1a1a1a",
        "brand-gray": "#666666",
        "brand-orange": "#f97316",
        "brand-white": "#ffffff",
        "brand-red": "#ef4444",
        "brand-yellow": "#eab308",
        "brand-green": "#22c55e",
        "brand-blue": "#3b82f6",
        "brand-blue-dark": "#2563eb"
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
        base: "0 1px 3px rgba(0, 0, 0, 0.08)",
        md: "0 4px 12px rgba(0, 0, 0, 0.1)",
        lg: "0 12px 24px rgba(0, 0, 0, 0.12)",
        xl: "0 20px 40px rgba(0, 0, 0, 0.15)"
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Roboto"',
          '"Oxygen"',
          '"Ubuntu"',
          '"Cantarell"',
          '"Fira Sans"',
          '"Droid Sans"',
          '"Helvetica Neue"',
          'Poppins',
          'sans-serif'
        ],
        mono: ["'Roboto Mono'", "monospace"]
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        rise: "rise 0.6s ease-out forwards",
        fadeIn: "fadeIn 0.6s ease-out forwards",
        slideInUp: "slideInUp 0.6s ease-out forwards"
      },
      spacing: {
        section: "80px"
      }
    }
  },
  plugins: []
}

export default config
