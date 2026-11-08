"use client"

import {
  CircleAlertIcon,
  CircleCheckIcon,
  CircleSlashIcon,
  LoaderIcon,
  ShieldAlertIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment, type ReactNode, useState } from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { Button } from "@/components/ui/button"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"
import { cn } from "@/lib/utils"
import type { FlowTrace } from "@/types/flow"

import { type ProbeResult, probeProtectedPage } from "./probe"
import { buildProbeTrace, PAGE_LABEL } from "./probe-trace"
import {
  BASE_PATH,
  LOGIN_PATH,
  PROTECTED_PAGES,
  type ProtectedPageKey,
} from "./return-to"

const NAV_LINKS = [
  { href: BASE_PATH, label: "デモの入口" },
  { href: PROTECTED_PAGES.members, label: PAGE_LABEL.members },
  { href: PROTECTED_PAGES.proxied, label: PAGE_LABEL.proxied },
] as const

const PROBE_PAGES: ProtectedPageKey[] = ["members", "proxied"]

type ProbeState =
  | { status: "idle" }
  | { status: "pending"; page: ProtectedPageKey }
  | { status: "done"; result: ProbeResult }
  | { status: "error"; page: ProtectedPageKey }

// layout.tsx から描画される Client Component。判定はせず、移動と取得の結果を表示する。
// children は枠の中に表示するページ（入口・ログイン・会員ページ）で、サーバーで描画される。
export function GuardDemoPanel({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [probe, setProbe] = useState<ProbeState>({ status: "idle" })
  const [trace, setTrace] = useState<FlowTrace | null>(null)

  async function runProbe(page: ProtectedPageKey) {
    setProbe({ status: "pending", page })
    try {
      const result = await probeProtectedPage(page)
      setProbe({ status: "done", result })
      setTrace(buildProbeTrace(crypto.randomUUID(), result))
    } catch {
      setProbe({ status: "error", page })
    }
  }

  return (
    <DemoLayout
      runtime="client"
      runtimeDetail="ページの移動と、URL を直接取得するボタン"
      demo={
        <div className="flex flex-col gap-5">
          <section
            aria-labelledby="protected-pages-navigate"
            className="flex flex-col gap-3"
          >
            <h4
              id="protected-pages-navigate"
              className="text-xs font-medium text-muted-foreground"
            >
              枠の中で移動する（Link による画面の移動）
            </h4>
            <nav aria-label="デモのページ">
              <ul className="flex flex-wrap gap-2">
                {NAV_LINKS.map((link) => {
                  const isCurrent = pathname === link.href
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={isCurrent ? "page" : undefined}
                        className={cn(
                          "inline-flex rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-muted",
                          isCurrent && "border-server/50 bg-server-muted",
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
            <div className="rounded-lg border border-dashed p-4">
              {/*
                Cache Components では、移動する前のページが <Activity> で隠れたまま残る。
                未ログインで会員ページへ移動すると、その中に「ログインページへリダイレクトした」状態も残り、
                ログイン後に戻ってきたときに、もう一度ログインページへ送られてしまう。
                ページが変わるたびに枠の中を作り直し、前のページの状態を残さない。
              */}
              <Fragment key={pathname}>{children}</Fragment>
            </div>
            {pathname === LOGIN_PATH ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                会員ページから送られてきた場合、ブラウザの URL に ?next=
                が付いています。
              </p>
            ) : null}
          </section>

          <section
            aria-labelledby="protected-pages-probe"
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1">
              <h4
                id="protected-pages-probe"
                className="text-xs font-medium text-muted-foreground"
              >
                URL を直接開いたときの応答を調べる
              </h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                新しいタブで URL を開いたときと同じ GET
                を送り、リダイレクトの仕方と、守る内容が HTML
                に入っているかを確かめます。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PROBE_PAGES.map((page) => (
                <Button
                  key={page}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={probe.status === "pending"}
                  onClick={() => runProbe(page)}
                >
                  {PAGE_LABEL[page]}を取得
                </Button>
              ))}
            </div>
            <ProbeView probe={probe} />
          </section>
        </div>
      }
      visualizer={
        <ProcessVisualizer
          nodes={[
            "browser",
            "next-server",
            "proxy",
            "server-component",
            "data-source",
          ]}
          trace={trace}
          emptyMessage="「〜を取得」を押すと、リクエストがどこで止まったかがここに表示されます"
        />
      }
    />
  )
}

function ProbeView({ probe }: { probe: ProbeState }) {
  if (probe.status === "idle") {
    return (
      <p className="text-xs text-muted-foreground">
        まだ取得していません。上のボタンで取得します。
      </p>
    )
  }
  if (probe.status === "pending") {
    return (
      <p
        role="status"
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <LoaderIcon aria-hidden className="size-3.5 motion-safe:animate-spin" />
        {PAGE_LABEL[probe.page]}を取得しています…
      </p>
    )
  }
  if (probe.status === "error") {
    return (
      <p
        role="alert"
        className="flex items-start gap-1.5 text-xs text-destructive"
      >
        <CircleAlertIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        リクエストを送れませんでした。通信状態を確かめて、もう一度お試しください。
      </p>
    )
  }

  const { result } = probe
  const { outcome } = result
  const rows: { label: string; value: string }[] = []
  let summary: { icon: ReactNode; text: string }

  switch (outcome.kind) {
    case "http-error":
      summary = {
        icon: (
          <CircleAlertIcon aria-hidden className="size-4 text-destructive" />
        ),
        text: "サーバーがエラーを返した（守られているかは判定できない）",
      }
      rows.push(
        { label: "ステータス", value: String(outcome.status) },
        {
          label: "守る内容",
          value: "エラー応答のため調べていない",
        },
      )
      break
    case "unconfigured":
      summary = {
        icon: (
          <CircleSlashIcon
            aria-hidden
            className="size-4 text-muted-foreground"
          />
        ),
        text: "秘密鍵が未設定のため、ログインの確認が動いていない",
      }
      rows.push(
        { label: "ステータス", value: String(outcome.status) },
        ...(result.page === "proxied"
          ? [{ label: "Proxy", value: "cookie を確かめずにページへ渡した" }]
          : []),
        { label: "守る内容", value: "HTML に入っていない（未設定の案内のみ）" },
      )
      break
    case "proxy-redirect":
      summary = {
        icon: <ShieldAlertIcon aria-hidden className="size-4 text-client" />,
        text: "Proxy が描画の前にリダイレクトした（3xx）",
      }
      rows.push(
        { label: "ステータス", value: "3xx（ブラウザの仕様で数字は読めない）" },
        { label: "ページの描画", value: "行われていない" },
      )
      break
    case "page-redirect":
      summary = {
        icon: <ShieldAlertIcon aria-hidden className="size-4 text-client" />,
        text: "ページの中の redirect() で、ログインページへ移動させた",
      }
      rows.push(
        {
          label: "ステータス",
          value: `${outcome.status}（送り始めた後なので変えられない）`,
        },
        { label: "移動の伝え方", value: "HTML の meta タグ（refresh）" },
        {
          label: "移動先",
          value: outcome.location ?? "（読み取れませんでした）",
        },
        {
          label: "守る内容",
          value: outcome.leaked ? "HTML に入っていた" : "HTML に入っていない",
        },
      )
      break
    case "content":
      summary = {
        icon: <CircleCheckIcon aria-hidden className="size-4 text-server" />,
        text: "確認を通り、会員向けのお知らせが届いた",
      }
      rows.push({ label: "ステータス", value: String(outcome.status) })
      break
    case "neither":
      summary = {
        icon: (
          <CircleSlashIcon
            aria-hidden
            className="size-4 text-muted-foreground"
          />
        ),
        text: "守る内容もリダイレクトもなかった（想定していない応答）",
      }
      rows.push({ label: "ステータス", value: String(outcome.status) })
      break
  }
  rows.push({
    label: "往復",
    value: `${Math.round(result.roundTripMs).toLocaleString("ja-JP")} ms（ブラウザで計測）`,
  })

  return (
    <div className="flex flex-col gap-2 rounded-md border px-3 py-2">
      <p className="text-xs text-muted-foreground">{PAGE_LABEL[result.page]}</p>
      <p className="flex items-center gap-2 text-sm font-medium">
        {summary.icon}
        {summary.text}
      </p>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="break-all">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
