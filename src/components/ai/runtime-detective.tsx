"use client"

import { InfoIcon, LoaderIcon, SearchCodeIcon } from "lucide-react"
import { useId, useRef, useState } from "react"

import { AiErrorNotice } from "@/components/ai/ai-error-notice"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  formatAnswer,
  requestRuntimeExplanation,
  type TutorResult,
} from "@/lib/ai/client"
import type {
  BrowserReport,
  RuntimeExplainTicket,
  TraceStepSummary,
} from "@/lib/tracing/adapter"
import { cn } from "@/lib/utils"

interface RuntimeDetectiveProps {
  lessonId: string
  /** Server Action が返した、署名付きの要約 */
  ticket: RuntimeExplainTicket
  /** ブラウザで計測した、送信から応答を受け取るまでの時間（申告） */
  browserRoundTripMs?: number
}

type DetectiveState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: TutorResult }

const SECTION_TITLES = [
  ["observed", "観測されたこと"],
  ["lessonExplanation", "教材上の説明"],
  ["unobservable", "観測できないこと"],
] as const

const durationFormatter = new Intl.NumberFormat("ja-JP", {
  maximumFractionDigits: 1,
})

/**
 * 1 回分のデモの実行記録を、AI に解説してもらう（AI Runtime Detective）。
 * API を呼ぶのは「この実行を AI で解説」を押したときだけ。デモを操作しただけでは呼ばない。
 * 実行が変わったら作り直す（親で key に traceId を渡す）ため、前の実行の回答は残らない。
 */
export function RuntimeDetective({
  lessonId,
  ticket,
  browserRoundTripMs,
}: RuntimeDetectiveProps) {
  const [state, setState] = useState<DetectiveState>({ status: "idle" })
  /** 連続クリックによる重複送信を防ぐ（state の更新を待たずに判定する） */
  const inFlight = useRef(false)
  const titleId = useId()

  const browserReport: BrowserReport | null =
    browserRoundTripMs === undefined
      ? null
      : { roundTripMs: Math.round(browserRoundTripMs) }
  const isLoading = state.status === "loading"

  async function explain() {
    if (inFlight.current) return
    inFlight.current = true
    setState({ status: "loading" })
    const result = await requestRuntimeExplanation({
      lessonId,
      ticket,
      browserReport,
    })
    inFlight.current = false
    setState({ status: "done", result })
  }

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-lg border px-4 py-3"
    >
      <div className="flex flex-col gap-1">
        <h3 id={titleId} className="text-sm font-medium">
          この実行を AI で解説（AI Runtime Detective）
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          いまの実行の記録をもとに、何が起きたかを AI が解説します。押すまで、AI
          には何も送りません。
        </p>
      </div>

      <details className="group rounded-md border bg-muted/30 text-xs">
        <summary className="cursor-pointer rounded-md px-3 py-2 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">
          AI に送る内容（{ticket.summary.steps.length} ステップ）
        </summary>
        <div className="flex flex-col gap-2 border-t px-3 py-2">
          <ol aria-label="AI に送るステップ" className="flex flex-col gap-1.5">
            {ticket.summary.steps.map((step) => (
              <TraceStepItem key={step.id} step={step} />
            ))}
          </ol>
          {browserReport ? (
            <p className="flex flex-wrap items-center gap-1.5 border-t pt-2">
              <EvidenceBadge kind="reported" />
              送信から応答を受け取るまで{" "}
              {durationFormatter.format(browserReport.roundTripMs)} ms
            </p>
          ) : null}
          <ul className="flex list-disc flex-col gap-0.5 pl-4 text-muted-foreground">
            <li>実測: サーバーのコードで記録し、サーバーが署名した値です。</li>
            <li>
              概念: 教材の説明のためのステップで、この実行では観測していません。
            </li>
            <li>
              申告:
              ブラウザで計測した値です。書き換えられるため、参考値として扱います。
            </li>
          </ul>
        </div>
      </details>

      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={isLoading}
        onClick={() => void explain()}
        className="self-start"
      >
        {isLoading ? (
          <LoaderIcon aria-hidden className="motion-safe:animate-spin" />
        ) : (
          <SearchCodeIcon aria-hidden />
        )}
        {isLoading ? "解説を作成中…" : "この実行を AI で解説"}
      </Button>

      <div aria-live="polite" aria-busy={isLoading}>
        <DetectiveResult state={state} onRetry={() => void explain()} />
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        送るのは、上の記録（ステップ・区分・計測した時間）と、その署名だけです。入力した名前は送りません。記録は
        Google の Gemini API で処理され、無料枠のため Google
        の製品改善に使われることがあります。記録をこの利用者のものとして確かめるため、匿名の
        Cookie（24 時間有効）を使います。
      </p>
    </section>
  )
}

function TraceStepItem({ step }: { step: TraceStepSummary }) {
  return (
    <li className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      <span className="font-mono text-muted-foreground tabular-nums">
        {step.order + 1}.
      </span>
      <EvidenceBadge kind={step.evidence} />
      <span className={cn(step.status === "error" && "text-destructive")}>
        {step.label}
        {step.status === "error" ? "（エラー）" : null}
      </span>
      {step.durationMs !== null ? (
        <span className="font-mono text-muted-foreground tabular-nums">
          {durationFormatter.format(step.durationMs)} ms
        </span>
      ) : null}
    </li>
  )
}

const EVIDENCE_LABELS = {
  observed: { text: "実測", className: "bg-server-muted text-server" },
  conceptual: {
    text: "概念",
    className: "border-border text-muted-foreground",
  },
  reported: { text: "申告", className: "bg-client-muted text-client" },
} as const

function EvidenceBadge({ kind }: { kind: keyof typeof EVIDENCE_LABELS }) {
  const { text, className } = EVIDENCE_LABELS[kind]
  return (
    <Badge variant="outline" className={cn("h-4 px-1.5", className)}>
      {text}
    </Badge>
  )
}

function DetectiveResult({
  state,
  onRetry,
}: {
  state: DetectiveState
  onRetry: () => void
}) {
  if (state.status === "idle") return null

  if (state.status === "loading") {
    return (
      <p className="flex items-center gap-2 rounded-lg border px-4 py-4 text-sm text-muted-foreground">
        <LoaderIcon
          aria-hidden
          className="size-4 shrink-0 motion-safe:animate-spin"
        />
        解説を作成しています。30 秒ほどかかることがあります。
      </p>
    )
  }

  const { result } = state

  if (result.status === "error") {
    return (
      <AiErrorNotice
        message={result.message}
        onRetry={result.retryable ? onRetry : undefined}
      />
    )
  }

  const { sections } = result

  return (
    <div className="flex flex-col gap-3 rounded-lg border px-4 py-3">
      {sections ? (
        SECTION_TITLES.map(([key, title]) => (
          <div key={key} className="flex flex-col gap-1">
            <h4 className="text-sm font-medium">{title}</h4>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {formatAnswer(sections[key])}
            </p>
          </div>
        ))
      ) : (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {formatAnswer(result.answer)}
        </p>
      )}
      <p className="flex gap-1.5 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
        <InfoIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        <span>
          {result.notice}
          {result.cached
            ? "（この実行への、以前の回答を表示しています）"
            : null}
        </span>
      </p>
    </div>
  )
}
