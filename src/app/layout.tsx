import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Noto_Sans_JP } from "next/font/google"

import { SiteHeader } from "@/components/layout/site-header"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { siteConfig } from "@/lib/site"
import { sharedOpenGraph } from "@/lib/site-metadata"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  weight: ["400", "500", "700"],
  // 日本語フォントはサイズが大きいため preload せず、表示時に読み込む
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Next.jsの内部処理を見て学ぶ`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    ...sharedOpenGraph,
    type: "website",
    title: siteConfig.name,
    description: siteConfig.description,
  },
}

// ブラウザのバーの色を背景色（globals.css の --background）に合わせる。
// 端末のテーマ設定に連動し、サイト内のテーマ切り替えには追従しない
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0c0c" },
  ],
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      // next-themes が描画前に class を付与するため、html 要素の差分警告を抑制する
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansJp.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <a
            href="#main-content"
            className="sr-only z-50 rounded-md bg-background px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:ring-2 focus:ring-ring"
          >
            本文へスキップ
          </a>
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
