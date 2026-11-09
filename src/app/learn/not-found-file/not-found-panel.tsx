"use client"

import { CircleAlertIcon, ExternalLinkIcon, LoaderIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { Button } from "@/components/ui/button"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"
import type { FlowTrace } from "@/types/flow"

import { BASE_PATH, type ProxyDecision } from "./demo-data"
import {
  isTimeoutError,
  measureNotFound,
  type NotFoundMeasurement,
} from "./measure-not-found"
import { buildNotFoundTrace, notFoundModel } from "./trace"

/** 表に残す計測の回数 */
const MAX_RUNS = 6

interface DemoCase {
  /** BASE_PATH からの相対パス */
  path: string
  label: string
  note: string
}

const CASES: DemoCase[] = [
  {
    path: "items/1",
    label: "存在する商品",
    note: "page.tsx がそのまま表示される",
  },
  {
    path: "items/999",
    label: "存在しない商品",
    note: "同じフォルダに not-found.tsx がある",
  },
  {
    path: "orders/999",
    label: "存在しない注文",
    note: "同じフォルダに not-found.tsx がない",
  },
  {
    path: "checked/1",
    label: "proxy を通す（存在する）",
    note: "proxy.ts が先に商品を確かめる",
  },
  {
    path: "checked/999",
    label: "proxy を通す（存在しない）",
    note: "proxy.ts が先に商品を確かめる",
  },
  {
    path: "no-such-page",
    label: "一致しない URL",
    note: "どのルートにも一致しない",
  },
]

const PROXY_LABEL: Record<ProxyDecision, string> = {
  found: "存在する → items/[id] へ",
  missing: "存在しない → 一致しない URL へ",
}

interface NotFoundRun extends NotFoundMeasurement {
  number: number
}

type MeasureStatus = "idle" | "loading" | "error" | "timeout"

const formatMs = (ms: number) => `${Math.round(ms).toLocaleString("ja-JP")} ms`

// クリックと計測の状態を扱うため Client Component。
// デモのページと not-found.tsx は、同じフォルダの items/・orders/ などがサーバーで描画する。
export function NotFoundPanel() {
  const [status, setStatus] = useState<MeasureStatus>("idle")
  const [runs, setRuns] = useState<NotFoundRun[]>([])
  const [trace, setTrace] = useState<FlowTrace>(notFoundModel)
  // 進行中の計測。画面を離れたときに、取得・iframe での確認を止めるために持つ
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => controllerRef.current?.abort()
  }, [])

  async function measure(demoCase: DemoCase) {
    const controller = new AbortController()
    controllerRef.current = controller
    setStatus("loading")
    try {
      const measurement = await measureNotFound(
        `${BASE_PATH}/${demoCase.path}`,
        controller.signal,
      )
      setRuns((current) => {
        const number = (current.at(-1)?.number ?? 0) + 1
        return [...current, { ...measurement, number }].slice(-MAX_RUNS)
      })
      setTrace(buildNotFoundTrace(crypto.randomUUID(), measurement))
      setStatus("idle")
    } catch (error) {
      // 画面を離れて中止した場合は、表示を更新しない
      if (controller.signal.aborted) return
      if (isTimeoutError(error)) {
        setStatus("timeout")
        return
      }
      console.error("[not-found-file] ページの取得に失敗しました", error)
      setStatus("error")
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }

  const isLoading = status === "loading"
  const latest = runs.at(-1)

  return (
    <DemoLayout
      runtime="client"
      runtimeDetail="ページを取得して調べる UI"
      demo={
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">URL を選んで取得</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {CASES.map((demoCase) => (
                <li key={demoCase.path} className="flex">
                  <Button
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => void measure(demoCase)}
                    className="h-auto w-full flex-col items-start gap-0.5 py-2 text-left whitespace-normal"
                  >
                    <span>{demoCase.label}</span>
                    <span className="font-mono text-xs font-normal break-all">
                      {demoCase.path}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {demoCase.note}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
            <p className="text-xs leading-relaxed text-muted-foreground">
              取得した応答からステータスと noindex
              を調べ、さらに見えないフレームでページを開いて、実際に表示されたファイルを確かめます。
            </p>
          </section>

          <div className="flex flex-col gap-3 border-t pt-4">
            <MeasureStatusMessage status={status} hasRuns={runs.length > 0} />
            {latest ? <LatestResult run={latest} /> : null}
            {runs.length > 0 ? <RunsTable runs={runs} /> : null}
          </div>
        </div>
      }
      visualizer={
        <ProcessVisualizer
          nodes={["browser", "next-server", "server-component"]}
          trace={trace}
          emptyMessage="URL を取得すると、処理がここに表示されます"
        />
      }
    />
  )
}

function MeasureStatusMessage({
  status,
  hasRuns,
}: {
  status: MeasureStatus
  hasRuns: boolean
}) {
  if (status === "error" || status === "timeout") {
    return (
      <p
        role="alert"
        className="flex items-center gap-1.5 text-sm text-destructive"
      >
        <CircleAlertIcon aria-hidden className="size-4 shrink-0" />
        {status === "timeout"
          ? "10秒待っても応答が届かなかったため、取得を止めました。もう一度お試しください。"
          : "ページを取得できませんでした。通信状況を確認して、もう一度お試しください。"}
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
          ページを取得して、表示されたファイルを調べています…
        </>
      ) : hasRuns ? (
        "最後に取得した結果"
      ) : (
        "まだ取得していません。上の URL を順に取得して、表示されるファイルとステータスを比べましょう。"
      )}
    </p>
  )
}

function LatestResult({ run }: { run: NotFoundRun }) {
  return (
    <section className="flex flex-col gap-2 rounded-lg border px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-mono text-sm break-all">
          {run.status} ·{" "}
          {run.renderedFile ?? "表示されたファイルを確かめられませんでした"}
        </h3>
        {/* next/link で開くと、一致しない URL では教材ページごと app/not-found.tsx に置き換わるため a を使う */}
        <a
          href={run.path}
          className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ExternalLinkIcon aria-hidden className="size-3.5" />
          このページを開く
        </a>
      </div>
      <dl className="grid gap-1 font-mono text-xs">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">URL</dt>
          <dd className="break-all">{run.path}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">noindex</dt>
          <dd>{run.noindex ? "あり" : "なし"}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">proxy.ts</dt>
          <dd>{run.proxy ? PROXY_LABEL[run.proxy] : "通らない"}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">応答の受信</dt>
          <dd>{formatMs(run.totalMs)}</dd>
        </div>
      </dl>
    </section>
  )
}

function RunsTable({ runs }: { runs: NotFoundRun[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <caption className="sr-only">ページの取得結果</caption>
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b">
            <th scope="col" className="px-3 py-2 font-medium">
              回
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              URL
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              ステータス
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              noindex
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              表示されたファイル
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {runs.map((run) => (
            <tr key={run.number} className="border-b last:border-b-0">
              <th scope="row" className="px-3 py-2 font-mono font-normal">
                {run.number}
              </th>
              <td className="px-3 py-2 font-mono">
                {run.path.slice(BASE_PATH.length + 1)}
              </td>
              <td className="px-3 py-2 font-mono">{run.status}</td>
              <td className="px-3 py-2">{run.noindex ? "あり" : "なし"}</td>
              <td className="px-3 py-2 font-mono">{run.renderedFile ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
