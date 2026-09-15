import { SidebarNav } from "@/components/layout/sidebar-nav"
import { curriculum } from "@/content/curriculum"

// 教材ページ共通のレイアウト。ページ間を移動してもサイドバーは再レンダリングされない。
export default function LearnLayout({ children }: LayoutProps<"/learn">) {
  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-1">
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r px-3 py-6 lg:block">
        <SidebarNav chapters={curriculum} />
      </aside>
      <main id="main-content" className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  )
}
