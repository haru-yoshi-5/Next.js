"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  formatAnswer,
  requestWhatIfCompare,
  type TutorResult,
} from "@/lib/ai/client"

export function WhatIfCompare() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TutorResult | null>(null)
  const inFlight = useRef(false)

  async function explain() {
    if (inFlight.current) return
    inFlight.current = true
    setLoading(true)
    const next = await requestWhatIfCompare()
    setResult(next)
    setLoading(false)
    inFlight.current = false
  }

  return (
    <section
      className="flex flex-col gap-3 rounded-lg border p-3"
      aria-label="比較のAI解説"
    >
      <p className="text-sm">
        直列と並列の違いを、今回の数値を送らず一般論として解説します。
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        送信するのは教材IDと解説の種類だけです。固定の比較条件が Google の
        Gemini API
        で処理され、製品改善に使われ、人が読むことがあります。18歳以上の方が日本国内から利用できます。利用制限のため24時間有効な匿名
        Cookie と IP アドレスのハッシュを使います。
      </p>
      <Button
        type="button"
        variant="outline"
        className="self-start"
        disabled={loading}
        onClick={() => void explain()}
      >
        {loading ? "解説を作成中…" : "この比較をAIで解説"}
      </Button>
      <div aria-live="polite" aria-busy={loading}>
        {result?.status === "ok" ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">AIによる一般論</h3>
            <p className="text-sm whitespace-pre-wrap">
              {formatAnswer(result.answer)}
            </p>
            <p className="text-xs text-muted-foreground">
              {result.notice}
              {result.cached ? "（以前の回答）" : ""}
            </p>
          </div>
        ) : result?.status === "error" ? (
          <p role="alert" className="text-sm text-destructive">
            {result.message}
          </p>
        ) : null}
      </div>
    </section>
  )
}
