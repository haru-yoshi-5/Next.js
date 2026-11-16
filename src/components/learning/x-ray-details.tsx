"use client"

import { CodeBlock } from "@/components/learning/code-block"
import { Button } from "@/components/ui/button"
import { flowNodes } from "@/components/visualizer/flow-nodes"
import { formatAnswer, type TutorResult } from "@/lib/ai/client"
import type { HighlightedSource, ResolvedRuntime } from "@/lib/source-code"
import type { FlowNodeId } from "@/types/flow"

export interface XRayEntry {
  id: string
  label: string
  component: string
  nodes: FlowNodeId[]
  source: HighlightedSource
  runtime: ResolvedRuntime
  firstLine: number
}

export function XRayDetails({
  entry,
  isAiAvailable,
  isLoading,
  result,
  onExplain,
}: {
  entry: XRayEntry
  isAiAvailable: boolean
  isLoading: boolean
  result: TutorResult | null
  onExplain: () => void
}) {
  return (
    <div className="mt-3 flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        関連ノード {entry.nodes.map((id) => flowNodes[id].label).join("、")}
      </p>
      <CodeBlock
        source={entry.source}
        runtime={entry.runtime}
        role={entry.runtime.runtime === "client" ? "Client" : "Server"}
        description={entry.component}
        firstLine={entry.firstLine}
      />
      <Button
        type="button"
        variant="outline"
        className="self-start"
        disabled={isLoading || !isAiAvailable}
        onClick={onExplain}
      >
        この実装を AI で解説
      </Button>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {isAiAvailable
          ? "押すと、このコード断片と公開教材の内容を Gemini に送ります。送信内容は Google の製品改善に使われることがあります。AI 解説は日本国内の 18 歳以上が対象です。利用回数を制限するため、24 時間有効な匿名 Cookie と、IP アドレスのハッシュを使います。"
          : "AI 解説は現在使えません。コードは上に表示しています。"}
      </p>
      <div aria-live="polite" aria-busy={isLoading} className="text-sm">
        {isLoading && <p>解説を作成しています…</p>}
        {result?.status === "error" && (
          <p className="text-destructive">{result.message}</p>
        )}
        {result?.status === "ok" && (
          <>
            <p className="whitespace-pre-wrap">{formatAnswer(result.answer)}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {result.notice}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
