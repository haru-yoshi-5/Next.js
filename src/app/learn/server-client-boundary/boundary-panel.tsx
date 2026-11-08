"use client"

import {
  ChevronDownIcon,
  CircleAlertIcon,
  LoaderIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { type ReactNode, useState, useTransition } from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { Button } from "@/components/ui/button"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"
import type { FlowTrace } from "@/types/flow"

import {
  type BoundaryInspection,
  CLIENT_CODE_MARKER,
  inspectBoundary,
} from "./inspect-boundary"
import {
  boundaryModel,
  buildClientUpdateTrace,
  buildInspectionTrace,
  buildRefreshTrace,
} from "./trace"

interface BoundaryPanelProps {
  renderId: string
  publicToken: string
  createdAt: Date
  tags: Set<string>
  scores: Map<string, number>
  /** サーバーで描画済みの出力。このファイルは Server Component を import していない */
  children: ReactNode
}

/** 再リクエストの結果。応答を受け取るまで afterId は null */
interface RefreshRun {
  id: string
  beforeId: string
  afterId: string | null
  count: number
}

type InspectionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; id: string; result: BoundaryInspection }

/** ブラウザが実際に受け取った値の型を返す */
function receivedType(value: unknown) {
  return Object.prototype.toString.call(value).slice(8, -1)
}

// state とクリックを扱うため Client Component。
// サーバーからは props と children の出力だけを受け取り、サーバーのコードは import しない。
export function BoundaryPanel({
  renderId,
  publicToken,
  createdAt,
  tags,
  scores,
  children,
}: BoundaryPanelProps) {
  const router = useRouter()
  const [isRefreshing, startTransition] = useTransition()
  const [count, setCount] = useState(0)
  const [isOpen, setIsOpen] = useState(true)
  const [clientTrace, setClientTrace] = useState<FlowTrace | null>(null)
  const [refreshRun, setRefreshRun] = useState<RefreshRun | null>(null)
  const [inspection, setInspection] = useState<InspectionState>({
    status: "idle",
  })

  // 応答を受け取った時点の値で結果を固定する
  if (refreshRun?.afterId === null && !isRefreshing) {
    setRefreshRun({ ...refreshRun, afterId: renderId })
  }

  const propRows = [
    { name: "publicToken", sent: "string", value: publicToken },
    { name: "createdAt", sent: "Date", value: createdAt },
    { name: "tags", sent: "Set", value: tags },
    { name: "scores", sent: "Map", value: scores },
  ]

  function showClientUpdate(label: string, detail: string) {
    setRefreshRun(null)
    setClientTrace(
      buildClientUpdateTrace({
        id: crypto.randomUUID(),
        label,
        detail,
        renderId,
      }),
    )
  }

  function increment() {
    const next = count + 1
    setCount(next)
    showClientUpdate(`setCount(${next})`, `state: ${count} → ${next}`)
  }

  function toggle() {
    setIsOpen(!isOpen)
    showClientUpdate(
      `setIsOpen(${!isOpen})`,
      "受け取り済みの children を表示 / 非表示にする",
    )
  }

  function refresh() {
    setClientTrace(null)
    setInspection({ status: "idle" })
    setRefreshRun({
      id: crypto.randomUUID(),
      beforeId: renderId,
      afterId: null,
      count,
    })
    startTransition(() => router.refresh())
  }

  async function inspect() {
    setClientTrace(null)
    setRefreshRun(null)
    setInspection({ status: "loading" })
    try {
      const result = await inspectBoundary()
      setInspection({ status: "done", id: crypto.randomUUID(), result })
    } catch (error) {
      console.error("[inspectBoundary] 検査に失敗しました", error)
      setInspection({ status: "error" })
    }
  }

  let trace = boundaryModel
  if (clientTrace) {
    trace = clientTrace
  } else if (refreshRun?.afterId) {
    trace = buildRefreshTrace({ ...refreshRun, afterId: refreshRun.afterId })
  } else if (inspection.status === "done") {
    trace = buildInspectionTrace(inspection.id, inspection.result)
  }

  const isInspecting = inspection.status === "loading"
  const isBusy = isRefreshing || isInspecting

  return (
    <DemoLayout
      runtime="client"
      runtimeDetail="外枠と操作"
      demo={
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-3 rounded-lg border p-3">
            <h3 className="text-sm font-medium">Client Component</h3>
            <div className="flex flex-wrap items-center gap-2">
              <output
                aria-live="polite"
                aria-label="現在のカウント"
                className="min-w-8 font-mono text-2xl font-semibold tabular-nums"
              >
                {count}
              </output>
              <Button variant="outline" size="sm" onClick={increment}>
                <PlusIcon aria-hidden />1
              </Button>
              <Button
                variant="outline"
                size="sm"
                aria-expanded={isOpen}
                onClick={toggle}
              >
                <ChevronDownIcon
                  aria-hidden
                  className={isOpen ? "rotate-180" : undefined}
                />
                {isOpen ? "children を隠す" : "children を表示"}
              </Button>
            </div>
            {isOpen ? children : null}
            <p className="font-mono text-xs break-all text-muted-foreground">
              Client の目印: {CLIENT_CODE_MARKER}
            </p>
          </section>

          <Button
            variant="secondary"
            disabled={isBusy}
            onClick={refresh}
            className="self-start"
          >
            {isRefreshing ? (
              <LoaderIcon aria-hidden className="motion-safe:animate-spin" />
            ) : (
              <RefreshCwIcon aria-hidden />
            )}
            サーバーを再実行
          </Button>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">props で受け取った値の型</h3>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th scope="col" className="px-3 py-2 font-medium">
                      props
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      サーバーで渡した型
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      ブラウザの型
                    </th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {propRows.map((row) => (
                    <tr key={row.name} className="border-b last:border-b-0">
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2">{row.sent}</td>
                      <td className="px-3 py-2">{receivedType(row.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="flex flex-col gap-3 border-t pt-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium">境界を越えた内容を検査</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                このページの応答と、読み込んだ JavaScript
                ファイルを取得し直して検索します。
              </p>
            </div>
            <Button
              variant="outline"
              disabled={isBusy}
              onClick={inspect}
              className="self-start"
            >
              {isInspecting ? (
                <LoaderIcon aria-hidden className="motion-safe:animate-spin" />
              ) : (
                <SearchIcon aria-hidden />
              )}
              検査する
            </Button>
            <InspectionResult inspection={inspection} />
          </section>
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
          emptyMessage="操作すると、処理がここに表示されます"
        />
      }
    />
  )
}

function InspectionResult({ inspection }: { inspection: InspectionState }) {
  if (inspection.status === "error") {
    return (
      <p
        role="alert"
        className="flex items-center gap-1.5 text-sm text-destructive"
      >
        <CircleAlertIcon aria-hidden className="size-4" />
        検査に失敗しました。時間をおいて再度お試しください。
      </p>
    )
  }

  if (inspection.status !== "done") {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {inspection.status === "loading"
          ? "検索しています…"
          : "まだ検査していません。"}
      </p>
    )
  }

  const { result } = inspection
  const rows = [
    { label: "応答: props で渡した値", count: result.publicTokenCount },
    { label: "応答: 渡していない内部メモ", count: result.secretTokenCount },
    { label: "JavaScript: Client の目印", count: result.clientMarkerCount },
    { label: "JavaScript: Server の目印", count: result.serverMarkerCount },
  ]

  return (
    <dl role="status" className="flex flex-col gap-1.5 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="font-mono tabular-nums">{row.count}件</dd>
        </div>
      ))}
    </dl>
  )
}
