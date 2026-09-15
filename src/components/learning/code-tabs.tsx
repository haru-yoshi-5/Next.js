"use client"

import { MonitorIcon, ServerIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Runtime } from "@/types/lesson"

export interface CodeTabItem {
  value: string
  label: string
  runtime: Runtime
  /** Server Component で描画済みのコードブロック */
  content: ReactNode
}

// タブの選択状態を持つため Client Component。
// ただしハイライト処理とコードの描画はサーバーで済ませ、完成した UI を content として受け取る。
// → shiki やソースコード読み込みの JavaScript はブラウザに送られない。
export function CodeTabs({ items }: { items: CodeTabItem[] }) {
  return (
    <Tabs defaultValue={items[0]?.value}>
      <div className="overflow-x-auto pb-1">
        <TabsList variant="line" aria-label="表示するファイル">
          {items.map((item) => {
            const Icon = item.runtime === "client" ? MonitorIcon : ServerIcon
            return (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="px-3 font-mono text-xs"
              >
                <Icon
                  aria-hidden
                  className={
                    item.runtime === "client" ? "text-client" : "text-server"
                  }
                />
                {item.label}
                <span className="sr-only">
                  （{item.runtime === "client" ? "クライアント" : "サーバー"}）
                </span>
              </TabsTrigger>
            )
          })}
        </TabsList>
      </div>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value} className="mt-3">
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
