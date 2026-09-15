import { Suspense } from "react"

import { SidebarLinks } from "@/components/layout/sidebar-links"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { curriculum } from "@/content/curriculum"

// 教材ページ共通のレイアウト。ページ間を移動してもサイドバーは再レンダリングされない。
export default function LearnLayout({ children }: LayoutProps<"/learn">) {
  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-1">
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r px-3 py-6 lg:block">
        {/*
          SidebarNav は usePathname() を使う。/learn/app-router/[slug] のように
          URL がビルド時に確定しないルートでは、アクティブ表示なしの一覧を先に表示する。
        */}
        <Suspense
          fallback={<SidebarLinks chapters={curriculum} pathname={null} />}
        >
          <SidebarNav chapters={curriculum} />
        </Suspense>
      </aside>
      <main id="main-content" className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  )
}
