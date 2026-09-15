import type { ReactNode } from "react"

import { RuntimeBadge } from "@/components/visualizer/runtime-badge"
import type { Runtime } from "@/types/lesson"

interface DemoLayoutProps {
  /** デモ本体の実行環境 */
  runtime: Runtime
  /** "Server Component" などの補足 */
  runtimeDetail: string
  demo: ReactNode
  visualizer: ReactNode
}

/**
 * Live Demo（左）と Process Visualizer（右）を並べるレイアウト。
 * フックを持たないため、各教材の Client Component からそのまま利用できる。
 */
export function DemoLayout({
  runtime,
  runtimeDetail,
  demo,
  visualizer,
}: DemoLayoutProps) {
  return (
    <div className="grid items-start gap-4 xl:grid-cols-2">
      <div className="flex min-w-0 flex-col rounded-xl border">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <p className="font-mono text-[0.7rem] tracking-wider text-muted-foreground">
            LIVE DEMO
          </p>
          <RuntimeBadge runtime={runtime} detail={runtimeDetail} />
        </div>
        <div className="p-5">{demo}</div>
      </div>
      {visualizer}
    </div>
  )
}
