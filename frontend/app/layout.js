import "../styles/globals.css"
import AppShell from "../components/layout/AppShell"
import AuthProvider from "../components/AuthProvider"
import { ThemeProvider } from "../components/ThemeProvider"

export const metadata = {
  title: "OttoAi - Personal Operations",
  description: "Your all-in-one personal operations platform"
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Roboto+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans dark:bg-black dark:text-white" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <AppShell>
              {children}
            </AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
