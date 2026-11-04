"use client"

import { CircleAlertIcon, LoaderIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"
import { RuntimeBadge } from "@/components/visualizer/runtime-badge"
import { cn } from "@/lib/utils"
import type { FlowTrace } from "@/types/flow"

import {
  BASE_PATH,
  type DemoPage,
  demoPages,
  type WaitingUi,
} from "./demo-pages"
import {
  buildNavigationTrace,
  loadingModel,
  type NavigationMeasurement,
} from "./trace"

/** 表に残す計測の回数 */
const MAX_RUNS = 6
/** これを過ぎても内容が表示されなければ、計測を失敗として扱う（ms） */
const MEASURE_TIMEOUT_MS = 10_000

const WAITING_LABEL: Record<WaitingUi, string> = {
  loading: "loading.tsx",
  suspense: "見出し + fallback",
  none: "なし（前の画面のまま）",
}

// 待ちの表示と、page の内容を見つけるための目印
const FALLBACK_SELECTOR =
  "[data-nsc-loading-fallback], [data-nsc-suspense-fallback]"
const contentSelector = (page: DemoPage) =>
  `[data-nsc-demo-content="${page.key}"]`

interface PendingNavigation {
  page: DemoPage
  startedAt: number
  waitingMs: number | null
}

interface NavigationRun extends NavigationMeasurement {
  number: number
}

type MeasureStatus = "idle" | "navigating" | "error"

/**
 * このタブの中で遷移するクリックかどうか。
 * 修飾キー付き（新しいタブで開くなど）や左ボタン以外のクリックでは、このタブは遷移しない。
 */
function isSameTabClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  )
}

const formatMs = (ms: number | null) =>
  ms === null ? "—" : `${Math.round(ms).toLocaleString("ja-JP")} ms`

// layout.tsx から描画される Client Component。
// クリックした時刻と、枠の中（children）の表示が変わった時刻をブラウザで記録する。
export function LoadingDemoPanel({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const frameRef = useRef<HTMLDivElement>(null)
  const pendingRef = useRef<PendingNavigation | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [status, setStatus] = useState<MeasureStatus>("idle")
  const [runs, setRuns] = useState<NavigationRun[]>([])
  const [trace, setTrace] = useState<FlowTrace>(loadingModel)

  // 枠の中の DOM の変化を監視し、待ちの表示と内容が現れた時間を記録する
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const observer = new MutationObserver(() => {
      const pending = pendingRef.current
      if (!pending) return

      const elapsedMs = performance.now() - pending.startedAt
      if (
        pending.waitingMs === null &&
        frame.querySelector(FALLBACK_SELECTOR)
      ) {
        pending.waitingMs = elapsedMs
      }
      if (!frame.querySelector(contentSelector(pending.page))) return

      const measurement: NavigationMeasurement = {
        page: pending.page,
        waitingMs: pending.waitingMs,
        contentMs: elapsedMs,
      }
      pendingRef.current = null
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setRuns((current) => {
        const number = (current.at(-1)?.number ?? 0) + 1
        return [...current, { ...measurement, number }].slice(-MAX_RUNS)
      })
      setTrace(buildNavigationTrace(crypto.randomUUID(), measurement))
      setStatus("idle")
    })
    observer.observe(frame, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // ブラウザの戻る / 進むで移動したら、計測中の遷移は中断されたものとして取り消す
  useEffect(() => {
    function handlePopState() {
      pendingRef.current = null
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setStatus("idle")
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  /** 計測中の遷移と、前回の計測エラーの表示を取り消す */
  function cancelMeasure() {
    pendingRef.current = null
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setStatus("idle")
  }

  /** clickedAt はクリックイベントの timeStamp（performance.now() と同じ基準の時刻） */
  function startMeasure(page: DemoPage, clickedAt: number) {
    if (page.href === pathname) return
    pendingRef.current = {
      page,
      startedAt: clickedAt,
      waitingMs: null,
    }
    setStatus("navigating")
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      if (pendingRef.current?.page !== page) return
      pendingRef.current = null
      setStatus("error")
    }, MEASURE_TIMEOUT_MS)
  }

  return (
    <DemoLayout
      runtime="client"
      runtimeDetail="layout.tsx 内のパネル"
      demo={
        <div className="flex flex-col gap-4">
          <div className="flex min-w-0 items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 font-mono text-xs">
            <span className="shrink-0 text-muted-foreground">URL</span>
            <span className="truncate">{pathname}</span>
          </div>

          <nav aria-label="デモ用ページ" className="flex flex-col gap-2">
            <ul className="grid gap-2 sm:grid-cols-3">
              {demoPages.map((page) => {
                const isActive = pathname === page.href
                return (
                  <li key={page.key} className="flex">
                    <Link
                      href={page.href}
                      scroll={false}
                      onClick={(event) => {
                        if (isSameTabClick(event)) {
                          startMeasure(page, event.timeStamp)
                        }
                      }}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex w-full flex-col gap-0.5 rounded-lg border px-3 py-2 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        isActive
                          ? "border-flow bg-flow-muted"
                          : "hover:bg-muted",
                      )}
                    >
                      <span className="text-sm font-medium">{page.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {page.description}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
            <Link
              href={BASE_PATH}
              scroll={false}
              onClick={(event) => {
                if (isSameTabClick(event)) cancelMeasure()
              }}
              aria-current={pathname === BASE_PATH ? "page" : undefined}
              className="self-start text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              デモの入口に戻る
            </Link>
          </nav>

          <div
            ref={frameRef}
            className="rounded-lg border border-dashed border-server/40 p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[0.7rem] text-muted-foreground">
                {"{children}"}
              </p>
              <RuntimeBadge runtime="server" detail="page / loading" />
            </div>
            {children}
          </div>

          <div className="flex flex-col gap-2">
            <MeasureStatusMessage status={status} runs={runs} />
            {runs.length > 0 ? <RunsTable runs={runs} /> : null}
          </div>
        </div>
      }
      visualizer={
        <ProcessVisualizer
          nodes={["browser", "next-server", "server-component"]}
          trace={trace}
          emptyMessage="リンクを押すと、遷移で起きる処理がここに表示されます"
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
  runs: NavigationRun[]
}) {
  if (status === "error") {
    return (
      <p
        role="alert"
        className="flex items-center gap-1.5 text-sm text-destructive"
      >
        <CircleAlertIcon aria-hidden className="size-4 shrink-0" />
        遷移を計測できませんでした。入口に戻ってから、もう一度お試しください。
      </p>
    )
  }

  return (
    <p
      role="status"
      className="flex items-center gap-1.5 text-sm text-muted-foreground"
    >
      {status === "navigating" ? (
        <>
          <LoaderIcon aria-hidden className="size-4 motion-safe:animate-spin" />
          遷移しています…
        </>
      ) : runs.length === 0 ? (
        "まだ遷移していません。3つのリンクを順に押して、待っている間の表示を比べましょう。"
      ) : (
        "同じページへもう一度遷移するときは、先に別のページか入口へ移動してください。"
      )}
    </p>
  )
}

function RunsTable({ runs }: { runs: NavigationRun[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <caption className="sr-only">遷移の計測結果</caption>
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b">
            <th scope="col" className="px-3 py-2 font-medium">
              回
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              遷移先
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              待ちの表示
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              待ちの表示まで
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              内容の表示まで
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {runs.map((run) => (
            <tr key={run.number} className="border-b last:border-b-0">
              <th scope="row" className="px-3 py-2 font-mono font-normal">
                {run.number}
              </th>
              <td className="px-3 py-2">{run.page.label}</td>
              <td className="px-3 py-2">
                {run.waitingMs === null
                  ? WAITING_LABEL.none
                  : WAITING_LABEL[run.page.waitingUi]}
              </td>
              <td className="px-3 py-2 font-mono">{formatMs(run.waitingMs)}</td>
              <td className="px-3 py-2 font-mono">{formatMs(run.contentMs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
