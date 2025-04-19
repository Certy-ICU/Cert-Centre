import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ToastProvider } from '@/components/providers/toaster-provider'
import { ConfettiProvider } from '@/components/providers/confetti-provider'
import QueryProvider from '@/components/providers/query-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { BadgeAchievementProvider } from '@/providers/badge-achievement-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Cert Centre",
  description: "Your gateway to limitless learning.",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0",
  manifest: "/manifest.json",
  themeColor: "#020817",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cert Centre"
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <BadgeAchievementProvider>
                <ConfettiProvider />
                <ToastProvider />
                {children}
              </BadgeAchievementProvider>
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
