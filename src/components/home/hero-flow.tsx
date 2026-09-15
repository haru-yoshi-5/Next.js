import { ArrowDownIcon } from "lucide-react"

import { RuntimeBadge } from "@/components/visualizer/runtime-badge"
import type { Runtime } from "@/types/lesson"

interface HeroFlowNode {
  label: string
  runtime: Runtime
  note: string
  /** 次のノードへ向かう矢印のラベル */
  edge?: string
}

const nodes: HeroFlowNode[] = [
  {
    label: "Browser",
    runtime: "client",
    note: "ページをリクエスト",
    edge: "HTTP Request",
  },
  {
    label: "Next.js Server",
    runtime: "server",
    note: "ルートに対応する page.tsx を特定",
    edge: "render",
  },
  {
    label: "Server Component",
    runtime: "server",
    note: "データを取得して UI を生成",
    edge: "HTML + RSC Payload",
  },
  { label: "Browser", runtime: "client", note: "受け取った結果を表示" },
]

const delays = [
  "[animation-delay:0s]",
  "[animation-delay:1s]",
  "[animation-delay:2s]",
  "[animation-delay:3s]",
]

/**
 * トップページの簡易フロー図。JavaScript を使わず CSS アニメーションだけで描画する。
 * prefers-reduced-motion が有効な環境ではアニメーションしない。
 */
export function HeroFlow() {
  return (
    <figure className="rounded-xl border bg-card p-5">
      <figcaption className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono">process visualizer</span>
        <span>ページ表示の流れ（簡略図）</span>
      </figcaption>
      <ol className="flex flex-col">
        {nodes.map((node, index) => (
          <li key={`${node.label}-${index}`} className="flex flex-col">
            <div
              className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 motion-safe:animate-flow-step ${delays[index]}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{node.label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {node.note}
                </p>
              </div>
              <RuntimeBadge runtime={node.runtime} />
            </div>
            {node.edge ? (
              <div className="flex items-center gap-2 py-1.5 pl-4 text-xs text-muted-foreground">
                <ArrowDownIcon aria-hidden className="size-3.5" />
                <span className="font-mono">{node.edge}</span>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </figure>
  )
}
