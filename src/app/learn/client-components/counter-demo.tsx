"use client"

import { MinusIcon, PlusIcon, RotateCcwIcon } from "lucide-react"
import { useState } from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { Button } from "@/components/ui/button"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"
import type { FlowTrace } from "@/types/flow"

import { buildCounterTrace, type CounterAction } from "./counter-trace"

// useState と onClick を使うため、このファイルには "use client" が必要。
export function CounterDemo() {
  const [count, setCount] = useState(0)
  const [trace, setTrace] = useState<FlowTrace | null>(null)

  function handle(action: CounterAction) {
    const next =
      action === "increment"
        ? count + 1
        : action === "decrement"
          ? count - 1
          : 0

    setCount(next)
    setTrace(
      buildCounterTrace({
        id: crypto.randomUUID(),
        action,
        previous: count,
        next,
      }),
    )
  }

  return (
    <DemoLayout
      runtime="client"
      runtimeDetail="Client Component"
      demo={
        <div className="flex flex-col items-center gap-6 py-6">
          <p className="text-sm text-muted-foreground">Counter</p>
          <output
            aria-live="polite"
            aria-label="現在のカウント"
            className="font-mono text-6xl font-semibold tabular-nums"
          >
            {count}
          </output>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => handle("decrement")}>
              <MinusIcon aria-hidden />
              -1
            </Button>
            <Button onClick={() => handle("increment")}>
              <PlusIcon aria-hidden />
              +1
            </Button>
            <Button variant="ghost" onClick={() => handle("reset")}>
              <RotateCcwIcon aria-hidden />
              リセット
            </Button>
          </div>
          <p className="max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
            この数字は useState
            でブラウザのメモリに保持されています。ページを再読み込みすると 0
            に戻ります。
          </p>
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
          emptyMessage="ボタンを押すと、ブラウザ内で起きた処理がここに表示されます"
        />
      }
    />
  )
}
