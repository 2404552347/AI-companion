import type { Metadata, Viewport } from "next"
import { Inter, Noto_Serif_SC, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { PWAInstallBanner } from "@/components/shared/pwa-installer"
import "./globals.css"

export const viewport: Viewport = {
  themeColor: "#B8956A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
})

const notoSerif = Noto_Serif_SC({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "AI Companion — 你的成长伙伴",
  description: "一个会记住你是谁、主动关心你人生的 AI 伙伴",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  appleWebApp: {
    capable: true,
    title: "AI Companion",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${notoSerif.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <PWAInstallBanner />
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  )
}
