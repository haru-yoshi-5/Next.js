"use client"

import {
  CircleAlertIcon,
  FileIcon,
  FolderIcon,
  LoaderIcon,
  RotateCcwIcon,
  SearchIcon,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { Button } from "@/components/ui/button"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"

import {
  formatKilobytes,
  inspectPage,
  type PageInspection,
} from "./inspect-page"
import type { RouteFolder } from "./route-files"
import { buildInspectionTrace, pageModel } from "./trace"

interface AnatomyPanelProps {
  /** サーバーが src/app を探した結果 */
  routeFolders: RouteFolder[]
}

type InspectionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; id: string; result: PageInspection }

// ボタンの操作と結果の state を扱うため Client Component。
// ファイルの一覧はサーバーから props で受け取るだけで、node:fs は import しない。
export function AnatomyPanel({ routeFolders }: AnatomyPanelProps) {
  const pathname = usePathname()
  const [inspection, setInspection] = useState<InspectionState>({
    status: "idle",
  })

  const routeFileCount = routeFolders.reduce(
    (sum, folder) => sum + folder.files.length,
    0,
  )

  async function inspect() {
    setInspection({ status: "loading" })
    try {
      const result = await inspectPage()
      setInspection({ status: "done", id: crypto.randomUUID(), result })
    } catch (error) {
      console.error("[inspectPage] ページの調査に失敗しました", error)
      setInspection({ status: "error" })
    }
  }

  const trace =
    inspection.status === "done"
      ? buildInspectionTrace(inspection.id, inspection.result, routeFileCount)
      : pageModel
  const isInspecting = inspection.status === "loading"

  return (
    <DemoLayout
      runtime="client"
      runtimeDetail="調査と表示"
      demo={
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-medium">
                ① この URL を作っているファイル
              </h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                URL{" "}
                <code className="font-mono break-all text-foreground">
                  {pathname}
                </code>{" "}
                の区切りごとに、対応するフォルダをサーバーが探した結果です（上が外側）。
              </p>
            </div>
            <ol className="flex flex-col gap-2">
              {routeFolders.map((folder) => (
                <li
                  key={folder.folder}
                  className="flex flex-col gap-1.5 rounded-lg border px-3 py-2"
                >
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">
                      {folder.urlPath}
                    </span>
                    <span aria-hidden className="text-muted-foreground">
                      →
                    </span>
                    <span className="flex min-w-0 items-center gap-1 font-mono break-all">
                      <FolderIcon
                        aria-hidden
                        className="size-3.5 shrink-0 text-muted-foreground"
                      />
                      {folder.folder}
                    </span>
                  </p>
                  {folder.files.length > 0 ? (
                    <ul
                      aria-label={`${folder.folder} で使われるファイル`}
                      className="flex flex-wrap gap-1.5"
                    >
                      {folder.files.map((file) => (
                        <li
                          key={file}
                          className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs"
                        >
                          <FileIcon aria-hidden className="size-3" />
                          {file}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      特別なファイルはありません（フォルダが URL
                      の区切りになるだけ）
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>

          <section className="flex flex-col gap-3 border-t pt-4">
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-medium">②〜④ このページの応答</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                このページの HTML と、HTML が読み込む JavaScript
                を取得し直して数えます。
              </p>
            </div>
            <Button
              variant="outline"
              disabled={isInspecting}
              onClick={inspect}
              className="self-start"
            >
              {isInspecting ? (
                <LoaderIcon aria-hidden className="motion-safe:animate-spin" />
              ) : (
                <SearchIcon aria-hidden />
              )}
              このページを調べる
            </Button>
            <InspectionResult inspection={inspection} onRetry={inspect} />
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
          emptyMessage="「このページを調べる」を押すと、実測した値で再生されます"
        />
      }
    />
  )
}

function InspectionResult({
  inspection,
  onRetry,
}: {
  inspection: InspectionState
  onRetry: () => void
}) {
  if (inspection.status === "error") {
    return (
      <div role="alert" className="flex flex-col items-start gap-2">
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <CircleAlertIcon aria-hidden className="size-4 shrink-0" />
          ページを取得できませんでした。通信状態を確認して、もう一度お試しください。
        </p>
        <Button variant="ghost" size="sm" onClick={onRetry}>
          <RotateCcwIcon aria-hidden />
          もう一度調べる
        </Button>
      </div>
    )
  }

  if (inspection.status !== "done") {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {inspection.status === "loading"
          ? "このページの HTML と JavaScript を取得しています…"
          : "まだ調べていません。"}
      </p>
    )
  }

  const { result } = inspection
  const groups = [
    {
      title: "② サーバーでのレンダリング",
      rows: [
        { label: "HTML の大きさ", value: formatKilobytes(result.htmlBytes) },
        { label: "HTML の中の見出し", value: result.heading ?? "見つからない" },
        {
          label: "JavaScript 実行前の本文",
          value: `${result.articleTextLength.toLocaleString()} 文字`,
        },
      ],
    },
    {
      title: "③ サーバーとブラウザの橋渡し",
      rows: [
        {
          label: "RSC Payload の script",
          value: `${result.rscChunkCount} 個`,
        },
        {
          label: "RSC Payload の合計",
          value: formatKilobytes(result.rscBytes),
        },
      ],
    },
    {
      title: "④ バンドルと分割",
      rows: [
        {
          label: "読み込む JavaScript",
          value: `${result.scriptCount} ファイル`,
        },
        {
          label: "JavaScript の合計（展開後）",
          value: formatKilobytes(result.scriptBytes),
        },
      ],
    },
  ]

  return (
    <div role="status" className="flex flex-col gap-3">
      {groups.map((group) => (
        <section key={group.title} className="flex flex-col gap-1.5">
          <h5 className="text-xs font-medium text-muted-foreground">
            {group.title}
          </h5>
          <dl className="flex flex-col gap-1 text-sm">
            {group.rows.map((row) => (
              <div
                key={row.label}
                className="flex flex-wrap justify-between gap-x-3"
              >
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="font-mono break-all tabular-nums">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <p className="text-xs leading-relaxed text-muted-foreground">
        開発サーバー（pnpm dev）では、デバッグ用のコードが入るため本番より
        JavaScript が大きくなります。
      </p>
    </div>
  )
}
