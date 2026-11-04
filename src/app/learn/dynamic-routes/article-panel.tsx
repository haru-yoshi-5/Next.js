"use client"

import { CircleAlertIcon, ExternalLinkIcon, LoaderIcon } from "lucide-react"
import Link from "next/link"
import { type FormEvent, useState } from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { Button } from "@/components/ui/button"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"
import type { FlowTrace } from "@/types/flow"

import { ARTICLE_COUNT } from "./articles"
import {
  type ArticleMeasurement,
  type Delivery,
  measureArticle,
} from "./measure-article"
import { articleModel, buildArticleTrace } from "./trace"

/** 表に残す計測の回数 */
const MAX_RUNS = 6
/** 任意の値の最大文字数。URL が長くなりすぎないようにする */
const VALUE_MAX_LENGTH = 20

const PRESETS = [
  { value: "1", label: "事前生成する値" },
  { value: "42", label: "事前生成しない有効な値" },
  { value: "999", label: "存在しない値" },
]

const DELIVERY_LABEL: Record<Delivery, string> = {
  complete: "完成した HTML",
  "shell-then-article": "App Shell → 記事",
  "shell-then-not-found": "App Shell → not-found",
  unknown: "判定できず",
}

interface ArticleRun extends ArticleMeasurement {
  number: number
}

type MeasureStatus = "idle" | "loading" | "error"

const formatMs = (ms: number | null) =>
  ms === null ? "—" : `${Math.round(ms).toLocaleString("ja-JP")} ms`

// 入力・クリック・計測の状態を扱うため Client Component。
// 記事ページそのものは articles/[id]/page.tsx がサーバーで描画する。
export function ArticlePanel() {
  const [status, setStatus] = useState<MeasureStatus>("idle")
  const [runs, setRuns] = useState<ArticleRun[]>([])
  const [trace, setTrace] = useState<FlowTrace>(articleModel)
  const [text, setText] = useState("")
  const [inputError, setInputError] = useState<string | null>(null)

  async function measure(value: string) {
    setStatus("loading")
    try {
      const measurement = await measureArticle(value)
      setRuns((current) => {
        const number = (current.at(-1)?.number ?? 0) + 1
        return [...current, { ...measurement, number }].slice(-MAX_RUNS)
      })
      setTrace(buildArticleTrace(crypto.randomUUID(), measurement))
      setStatus("idle")
    } catch (error) {
      console.error("[dynamic-routes] 記事ページの取得に失敗しました", error)
      setStatus("error")
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = text.trim()
    if (value.length === 0) {
      setInputError("値を入力してください。")
      return
    }
    // 「.」「..」は URL の中で「今の階層」「1つ上の階層」として扱われ、記事ページを指さない
    if (value === "." || value === "..") {
      setInputError(
        "「.」と「..」は URL の階層を表す記号として扱われ、記事ページを指さないため使えません。",
      )
      return
    }
    setInputError(null)
    void measure(value)
  }

  const isLoading = status === "loading"
  const latest = runs.at(-1)

  return (
    <DemoLayout
      runtime="client"
      runtimeDetail="ページを取得して計測する UI"
      demo={
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-2">
            <h4 className="text-sm font-medium">値を選んで記事ページを取得</h4>
            <ul className="grid gap-2 sm:grid-cols-3">
              {PRESETS.map((preset) => (
                <li key={preset.value} className="flex">
                  <Button
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => void measure(preset.value)}
                    className="h-auto w-full flex-col items-start gap-0.5 py-2 text-left whitespace-normal"
                  >
                    <span className="font-mono">articles/{preset.value}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {preset.label}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-2 border-t pt-4"
          >
            <label htmlFor="article-value" className="text-sm font-medium">
              任意の値で試す
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="article-value"
                value={text}
                onChange={(event) => {
                  setText(event.target.value)
                  // 空欄のエラーは、値が入力された時点で解除する
                  if (event.target.value.trim().length > 0) setInputError(null)
                }}
                maxLength={VALUE_MAX_LENGTH}
                autoComplete="off"
                aria-invalid={inputError ? true : undefined}
                aria-describedby={
                  inputError
                    ? "article-value-hint article-value-error"
                    : "article-value-hint"
                }
                className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-3 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive"
              />
              <Button type="submit" variant="outline" disabled={isLoading}>
                取得する
              </Button>
            </div>
            {inputError ? (
              <p id="article-value-error" className="text-xs text-destructive">
                {inputError}
              </p>
            ) : null}
            <p
              id="article-value-hint"
              className="text-xs leading-relaxed text-muted-foreground"
            >
              1〜{ARTICLE_COUNT}{" "}
              の整数は有効な番号、それ以外は存在しない値です。値が有効かどうかは
              page.tsx がサーバーで確かめます。
            </p>
          </form>

          <div className="flex flex-col gap-3 border-t pt-4">
            <MeasureStatusMessage status={status} runs={runs} />
            {latest ? <LatestResult run={latest} /> : null}
            {runs.length > 0 ? <RunsTable runs={runs} /> : null}
          </div>
        </div>
      }
      visualizer={
        <ProcessVisualizer
          nodes={["browser", "next-server", "server-component"]}
          trace={trace}
          emptyMessage="記事ページを取得すると、処理がここに表示されます"
        />
      }
    />
  )
}

function MeasureStatusMessage({
  status,
  runs,
}: {
  status: MeasureStatus
  runs: ArticleRun[]
}) {
  if (status === "error") {
    return (
      <p
        role="alert"
        className="flex items-center gap-1.5 text-sm text-destructive"
      >
        <CircleAlertIcon aria-hidden className="size-4 shrink-0" />
        記事ページを取得できませんでした。通信状況を確認して、もう一度お試しください。
      </p>
    )
  }

  return (
    <p
      role="status"
      className="flex items-center gap-1.5 text-sm text-muted-foreground"
    >
      {status === "loading" ? (
        <>
          <LoaderIcon aria-hidden className="size-4 motion-safe:animate-spin" />
          記事ページを取得しています…
        </>
      ) : runs.length === 0 ? (
        "まだ取得していません。3つの値を順に取得して、届き方を比べましょう。"
      ) : (
        "最後に取得した結果"
      )}
    </p>
  )
}

function LatestResult({ run }: { run: ArticleRun }) {
  return (
    <section className="flex flex-col gap-2 rounded-lg border px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h5 className="font-mono text-sm break-all">
          {run.status} · {DELIVERY_LABEL[run.delivery]}
        </h5>
        <Link
          href={run.path}
          className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ExternalLinkIcon aria-hidden className="size-3.5" />
          このページを開く
        </Link>
      </div>
      <dl className="grid gap-1 font-mono text-xs">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">URL</dt>
          <dd className="break-all">{run.path}</dd>
        </div>
        {run.headers.map((header) => (
          <div key={header.name} className="flex flex-wrap gap-x-2">
            <dt className="text-muted-foreground">{header.name}</dt>
            <dd className="break-all">{header.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function RunsTable({ runs }: { runs: ArticleRun[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <caption className="sr-only">記事ページの取得結果</caption>
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b">
            <th scope="col" className="px-3 py-2 font-medium">
              回
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              値
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              ステータス
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              届き方
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              最初のデータ
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              記事 / not-found
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {runs.map((run) => (
            <tr key={run.number} className="border-b last:border-b-0">
              <th scope="row" className="px-3 py-2 font-mono font-normal">
                {run.number}
              </th>
              <td className="max-w-32 truncate px-3 py-2 font-mono">
                {run.value}
              </td>
              <td className="px-3 py-2 font-mono">{run.status}</td>
              <td className="px-3 py-2">{DELIVERY_LABEL[run.delivery]}</td>
              <td className="px-3 py-2 font-mono">
                {formatMs(run.firstChunkMs)}
              </td>
              <td className="px-3 py-2 font-mono">
                {formatMs(run.resultAtMs)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
