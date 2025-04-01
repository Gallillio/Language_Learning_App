import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { WordBankProvider } from "@/contexts/word-bank-context"
import { AuthProvider } from "@/contexts/auth-context"
import { StoryProvider } from "@/contexts/story-context"
import { StatsProvider } from "@/contexts/stats-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Language Learning App",
  description: "A fun and interactive language learning application",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <StatsProvider>
              <StoryProvider>
                <WordBankProvider>
                  {children}
                </WordBankProvider>
              </StoryProvider>
            </StatsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'