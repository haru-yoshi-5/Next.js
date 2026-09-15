"use client"

import Link from "next/link"
import { usePathname, useSelectedLayoutSegment } from "next/navigation"
import { type ReactNode, useState } from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { RuntimeBadge } from "@/components/visualizer/runtime-badge"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"
import { cn } from "@/lib/utils"

import { demoRoutes } from "./demo-routes"
import { buildNavigationTrace, type NavigationRecord } from "./navigation-trace"

const basePath = "/learn/app-router"

const links = [
  { href: basePath, label: "入口", file: "app/learn/app-router/page.tsx" },
  ...demoRoutes.map((route) => ({
    href: `${basePath}/${route.slug}`,
    label: route.title,
    file: "app/learn/app-router/[slug]/page.tsx",
  })),
  {
    href: `${basePath}/unknown-page`,
    label: "存在しない URL",
    file: "app/learn/app-router/[slug]/not-found.tsx",
  },
]

// layout.tsx から描画される Client Component。
// layout はページ遷移で再マウントされないため、ここで持つ state（メモ・遷移回数）は保たれる。
export function RouteDemoPanel({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const segment = useSelectedLayoutSegment()
  const [memo, setMemo] = useState("")
  const [navigationCount, setNavigationCount] = useState(0)
  const [lastNavigation, setLastNavigation] = useState<NavigationRecord | null>(
    null,
  )

  function handleNavigate(href: string, file: string) {
    if (href === pathname) return
    setNavigationCount((count) => count + 1)
    setLastNavigation({
      id: crypto.randomUUID(),
      from: pathname,
      to: href,
      targetFile: file,
    })
  }

  // URL が遷移先に変わったかどうかは、レンダー中に pathname と比べて判断する
  const trace = lastNavigation
    ? buildNavigationTrace(lastNavigation, pathname === lastNavigation.to)
    : null

  return (
    <DemoLayout
      runtime="client"
      runtimeDetail="layout.tsx 内のパネル"
      demo={
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 font-mono text-xs">
            <span className="text-muted-foreground">localhost:3000</span>
            <span className="truncate">{pathname}</span>
          </div>

          <nav aria-label="デモ用ページ">
            <ul className="flex flex-wrap gap-1.5">
              {links.map((link) => {
                const isActive = pathname === link.href
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      scroll={false}
                      onClick={() => handleNavigate(link.href, link.file)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "inline-flex h-7 items-center rounded-md border px-2.5 font-mono text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "border-flow bg-flow-muted text-foreground"
                          : "hover:bg-accent",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="rounded-lg border border-dashed border-server/40 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="font-mono text-[0.7rem] text-muted-foreground">
                {"{children}"}
              </p>
              <RuntimeBadge runtime="server" detail="page / not-found" />
            </div>
            {children}
          </div>

          <div className="flex flex-col gap-2 rounded-lg border p-3">
            <label htmlFor="layout-memo" className="text-xs font-medium">
              layout 内のメモ（ページを移動しても消えません）
            </label>
            <input
              id="layout-memo"
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              placeholder="ここに入力してからリンクを押してみてください"
              className="h-8 rounded-md border bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            />
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[0.7rem]">
              <dt className="text-muted-foreground">
                useSelectedLayoutSegment()
              </dt>
              <dd>{segment === null ? "null" : `"${segment}"`}</dd>
              <dt className="text-muted-foreground">layout 内での遷移回数</dt>
              <dd>{navigationCount}</dd>
            </dl>
          </div>
        </div>
      }
      visualizer={
        <ProcessVisualizer
          nodes={[
            "browser",
            "client-component",
            "next-server",
            "server-component",
          ]}
          trace={trace}
          emptyMessage="上のリンクを押すと、ページ遷移で起きる処理がここに表示されます"
        />
      }
    />
  )
}
