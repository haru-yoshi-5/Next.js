"use client"

import {
  CircleAlertIcon,
  LoaderIcon,
  RotateCcwIcon,
  ScanSearchIcon,
} from "lucide-react"
import { type ReactNode, useState } from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"

import {
  type CheckStatus,
  type ExpectedValues,
  type FontCheck,
  inspectSite,
  type MetadataCheck,
  type RouteCheck,
  type SiteInspection,
} from "./inspect-site"
import { buildInspectionTrace, initialModel } from "./trace"

type InspectState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; id: string; result: SiteInspection }

// ボタンの操作と、ブラウザに届いたものを調べるため Client Component
export function WhyPanel({ expected }: { expected: ExpectedValues }) {
  const [inspect, setInspect] = useState<InspectState>({ status: "idle" })

  async function runInspection() {
    setInspect({ status: "loading" })
    try {
      const result = await inspectSite(expected)
      setInspect({ status: "done", id: crypto.randomUUID(), result })
    } catch {
      setInspect({ status: "error" })
    }
  }

  const isLoading = inspect.status === "loading"
  const trace =
    inspect.status === "done"
      ? buildInspectionTrace(inspect.id, inspect.result)
      : initialModel

  return (
    <DemoLayout
      runtime="client"
      runtimeDetail="調べるボタンと結果の表示"
      demo={
        <div className="flex flex-col gap-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            このページに届いたフォント・
            <code className="font-mono">{"<head>"}</code> のメタデータと、
            <code className="font-mono">/sitemap.xml</code>・
            <code className="font-mono">/robots.txt</code>{" "}
            の中身を調べます。どれも、Next.js の決まった API
            やファイルの置き場所から出力されたものです。
          </p>

          <Button
            disabled={isLoading}
            onClick={runInspection}
            className="self-start"
          >
            {isLoading ? (
              <LoaderIcon aria-hidden className="motion-safe:animate-spin" />
            ) : (
              <ScanSearchIcon aria-hidden />
            )}
            このページを調べる
          </Button>

          <InspectResult inspect={inspect} onRetry={runInspection} />
        </div>
      }
      visualizer={
        <ProcessVisualizer
          nodes={[
            "browser",
            "next-server",
            "server-component",
            "route-handler",
          ]}
          trace={trace}
          emptyMessage="「このページを調べる」を押すと、確認できた跡で再生されます"
        />
      }
    />
  )
}

function InspectResult({
  inspect,
  onRetry,
}: {
  inspect: InspectState
  onRetry: () => void
}) {
  if (inspect.status === "error") {
    return (
      <div role="alert" className="flex flex-col items-start gap-2">
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <CircleAlertIcon aria-hidden className="size-4 shrink-0" />
          調べている途中で問題が起きました。もう一度試してください。
        </p>
        <Button variant="ghost" size="sm" onClick={onRetry}>
          <RotateCcwIcon aria-hidden />
          もう一度調べる
        </Button>
      </div>
    )
  }

  if (inspect.status !== "done") {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {inspect.status === "loading"
          ? "フォントの読み込みを待ってから、このページを調べています…"
          : "ボタンを押すと、フォント・メタデータ・sitemap・robots の跡を調べます。"}
      </p>
    )
  }

  const { fonts, metadata, sitemap, robots } = inspect.result
  const okCount = [
    fonts.status,
    metadata.status,
    sitemap.status,
    robots.status,
  ].filter((status) => status === "ok").length

  return (
    <div role="status" className="flex flex-col gap-4">
      <p className="text-sm">
        4 項目のうち {okCount} 項目で、跡を確認できました。
      </p>
      <FontResult fonts={fonts} />
      <MetadataResult metadata={metadata} />
      <RoutesResult sitemap={sitemap} robots={robots} />
    </div>
  )
}

const statusLabels: Record<CheckStatus, string> = {
  ok: "確認できた",
  mismatch: "期待と違った",
  unobserved: "観測できなかった",
}

function StatusBadge({ status }: { status: CheckStatus }) {
  return (
    <Badge
      variant={
        status === "ok"
          ? "secondary"
          : status === "mismatch"
            ? "destructive"
            : "outline"
      }
    >
      {statusLabels[status]}
    </Badge>
  )
}

function ResultSection({
  title,
  status,
  source,
  children,
}: {
  title: string
  status: CheckStatus
  /** この跡を出力したファイル */
  source: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-2 border-t pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <StatusBadge status={status} />
      </div>
      {children}
      <p className="text-xs text-muted-foreground">
        出力しているファイル:{" "}
        <code className="font-mono break-all">{source}</code>
      </p>
    </section>
  )
}

function ResultRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-xs break-all">{value}</dd>
    </div>
  )
}

function FontResult({ fonts }: { fonts: FontCheck }) {
  return (
    <ResultSection
      title="① フォント（next/font）"
      status={fonts.status}
      source="src/app/layout.tsx"
    >
      {fonts.status === "unobserved" ? (
        <p className="text-sm text-muted-foreground">
          フォントファイルの取得記録が見つからなかったため、配信元を判断できませんでした。
        </p>
      ) : (
        <dl className="flex flex-col gap-1.5">
          <ResultRow
            label="同じ origin から届いたフォントファイル"
            value={`${fonts.sameOriginCount} / ${fonts.files.length} 件`}
          />
          <ResultRow
            label="Google Fonts への取得"
            value={`${fonts.googleRequestCount} 件`}
          />
          <ResultRow
            label="読み込み済みのフォント（代替フォントを除く）"
            value={
              fonts.loadedFamilies.length > 0
                ? fonts.loadedFamilies.join("、")
                : "なし"
            }
          />
        </dl>
      )}
      {fonts.files.length > 0 && (
        // 日本語フォントは文字の範囲ごとにファイルが分かれるため、件数が多くなる
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">
            観測できたフォントファイル（{fonts.files.length} 件）
          </summary>
          <ul className="mt-1.5 flex flex-col gap-0.5 font-mono break-all">
            {fonts.files.map((file) => (
              <li key={file.url}>{file.url}</li>
            ))}
          </ul>
        </details>
      )}
    </ResultSection>
  )
}

function MetadataResult({ metadata }: { metadata: MetadataCheck }) {
  return (
    <ResultSection
      title="② メタデータ（metadata）"
      status={metadata.status}
      source="src/lib/lesson-metadata.ts"
    >
      <dl className="flex flex-col gap-1.5">
        {metadata.fields.map((field) => (
          <ResultRow
            key={field.label}
            label={field.label}
            value={
              field.actual === field.expected ? (
                field.actual
              ) : (
                <>
                  {field.actual ?? "なし"}
                  <span className="block text-destructive">
                    期待した値: {field.expected}
                  </span>
                </>
              )
            }
          />
        ))}
      </dl>
      {metadata.originDiffers && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          canonical と og:url は、設定した公開 URL（
          <code className="font-mono">NEXT_PUBLIC_SITE_URL</code>
          ）を使うため、今開いている URL とは origin が違います。
        </p>
      )}
    </ResultSection>
  )
}

function RouteRows({ check }: { check: RouteCheck }) {
  return (
    <dl className="flex flex-col gap-1.5">
      <ResultRow
        label={`${check.path} の応答`}
        value={
          check.httpStatus === null
            ? "取得できず"
            : `${check.httpStatus} / ${check.contentType ?? "種類不明"}${
                check.fetchMs === null ? "" : ` / ${check.fetchMs} ms`
              }`
        }
      />
      <ResultRow label="中身" value={check.finding} />
    </dl>
  )
}

function RoutesResult({
  sitemap,
  robots,
}: {
  sitemap: RouteCheck
  robots: RouteCheck
}) {
  return (
    <>
      <ResultSection
        title="③ sitemap（sitemap.ts）"
        status={sitemap.status}
        source="src/app/sitemap.ts"
      >
        <RouteRows check={sitemap} />
      </ResultSection>
      <ResultSection
        title="④ robots（robots.ts）"
        status={robots.status}
        source="src/app/robots.ts"
      >
        <RouteRows check={robots} />
      </ResultSection>
    </>
  )
}
