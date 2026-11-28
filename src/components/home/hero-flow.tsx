import { ArrowDownIcon } from "lucide-react"

import { HeroFlowPauseToggle } from "@/components/home/hero-flow-pause-toggle"
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

/**
 * トップページの簡易フロー図。強調表示は CSS アニメーションだけで描画し、
 * JavaScript は一時停止ボタン（HeroFlowPauseToggle）にだけ使う。
 * prefers-reduced-motion が有効な環境ではアニメーションしない。
 */
export function HeroFlow() {
  return (
    <figure className="group rounded-xl border bg-card p-5">
      <figcaption className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="font-mono" translate="no">
          process visualizer
        </span>
        <span>ページ表示の流れ（簡略図）</span>
      </figcaption>
      <ol className="flex flex-col">
        {nodes.map((node, index) => (
          <li key={`${node.label}-${index}`} className="flex flex-col">
            <div className="relative flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
              {/* 強調用の層。不透明度だけをアニメーションさせ、一時停止ボタンで止める。
                  ずらし時間は style で指定する（クラスで指定すると animate-flow-step の
                  animation 一括指定に上書きされ、全ノードが同時に光ってしまう） */}
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-px rounded-lg border border-flow bg-flow-muted opacity-0 group-has-[[data-paused]]:[animation-play-state:paused] motion-safe:animate-flow-step"
                style={{ animationDelay: `${index}s` }}
              />
              <div className="relative min-w-0">
                <p className="text-sm font-medium" translate="no">
                  {node.label}
                </p>
                <p className="text-xs text-muted-foreground">{node.note}</p>
              </div>
              <RuntimeBadge runtime={node.runtime} className="relative" />
            </div>
            {node.edge ? (
              <div className="flex items-center gap-2 py-1.5 pl-4 text-xs text-muted-foreground">
                <ArrowDownIcon aria-hidden className="size-3.5" />
                <span className="font-mono" translate="no">
                  {node.edge}
                </span>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex justify-end">
        <HeroFlowPauseToggle />
      </div>
    </figure>
  )
}
