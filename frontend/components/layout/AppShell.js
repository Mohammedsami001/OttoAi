"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Link2, Calendar as CalendarIcon, Clock, Settings as SettingsIcon, Search, Mail, LogOut, ChevronUp, FileText } from "lucide-react"
import { useState } from "react"

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: <Link2 className="w-5 h-5" /> },
  { href: "/gmail", label: "Gmail Summaries", icon: <Mail className="w-5 h-5" /> },
  { href: "/docs", label: "Google Docs", icon: <FileText className="w-5 h-5" /> },
  { href: "/spending", label: "Subscriptions", icon: <Search className="w-5 h-5" /> },
  { href: "/bookings", label: "Bookings", icon: <CalendarIcon className="w-5 h-5" /> },
  { href: "/settings", label: "Settings", icon: <SettingsIcon className="w-5 h-5" /> }
]

export default function AppShell({ children }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/signup"
  const [profileOpen, setProfileOpen] = useState(false)
  const SIGNOUT_REDIRECT_URL = "https://otto-ai.vercel.app/"

  if (isPublicPage) {
    return <>{children}</>
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: SIGNOUT_REDIRECT_URL })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex w-64 h-screen sticky top-0 border-r border-gray-200 bg-gray-50 flex-col">
        <div className="p-4 px-6 flex items-center gap-2">
          <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">O</span>
          </div>
          <span className="font-semibold text-gray-900">OttoAi</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active 
                    ? "bg-gray-200 text-gray-900" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>
        
        {/* Profile Section */}
        <div className="p-4 border-t border-gray-200 relative">
          {/* Profile Popover */}
          {profileOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="p-4 border-b border-gray-100">
                <p className="font-semibold text-gray-900 text-sm">{session?.user?.name || "User"}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{session?.user?.email || ""}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}

          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-semibold flex-shrink-0">
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex flex-col text-left flex-1 min-w-0">
              <span className="font-medium text-gray-900 truncate">{session?.user?.name || "User"}</span>
              <span className="text-xs text-gray-500">Free Plan</span>
            </div>
            <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white md:m-2 md:rounded-xl md:border md:border-gray-200 md:shadow-sm overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 px-4 pt-3 pb-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">O</span>
              </div>
              <span className="font-semibold truncate">OttoAi</span>
            </div>

            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-2 py-1.5 hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-semibold flex-shrink-0 text-sm">
                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? '' : 'rotate-180'}`} />
            </button>
          </div>

          {profileOpen && (
            <div className="mt-3 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <p className="font-semibold text-gray-900 text-sm">{session?.user?.name || "User"}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{session?.user?.email || ""}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}

          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {nav.map((item) => {
              const active = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-colors border ${
                    active
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </header>

        <div className="flex-1 overflow-auto bg-gray-50/30">
          <div className="max-w-5xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
