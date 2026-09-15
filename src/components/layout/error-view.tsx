"use client"

import { RotateCcwIcon, TriangleAlertIcon } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

import { Button, buttonVariants } from "@/components/ui/button"

interface ErrorViewProps {
  error: Error & { digest?: string }
  retry: () => void
}

/** error.tsx から使う共通のエラー表示（Error Boundary は Client Component である必要がある） */
export function ErrorView({ error, retry }: ErrorViewProps) {
  useEffect(() => {
    // 本番では message は伏せられるため、サーバーログと照合できる digest を残す
    console.error(
      "[NextScope] 描画中にエラーが発生しました",
      error.digest ?? error,
    )
  }, [error])

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-20"
    >
      <TriangleAlertIcon aria-hidden className="size-6 text-destructive" />
      <h1 className="text-2xl font-semibold tracking-tight">
        ページを表示できませんでした
      </h1>
      <p className="leading-relaxed text-muted-foreground">
        一時的な問題の可能性があります。もう一度読み込むか、時間をおいて再度お試しください。
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-muted-foreground">
          エラーID: {error.digest}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => retry()}>
          <RotateCcwIcon aria-hidden />
          もう一度読み込む
        </Button>
        <Link href="/learn" className={buttonVariants({ variant: "outline" })}>
          教材一覧へ
        </Link>
      </div>
    </div>
  )
}
