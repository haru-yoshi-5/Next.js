import { ScanSearchIcon } from "lucide-react"
import Link from "next/link"

import { MobileNav } from "@/components/layout/mobile-nav"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { curriculum } from "@/content/curriculum"
import { siteConfig } from "@/lib/site"

// ヘッダー自体は Server Component。
// インタラクションが必要な MobileNav / ThemeToggle だけが Client Component になる。
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-2 px-4 lg:px-6">
        <MobileNav chapters={curriculum} />
        <Link
          href="/"
          translate="no"
          className="flex items-center gap-2 rounded-md font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ScanSearchIcon aria-hidden className="size-5" />
          {siteConfig.name}
        </Link>
        <nav
          aria-label="メイン"
          className="ml-4 hidden items-center gap-1 sm:flex"
        >
          <Link
            href="/learn"
            className="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            教材一覧
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
