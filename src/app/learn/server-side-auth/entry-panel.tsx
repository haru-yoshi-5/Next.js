"use client"

import {
  BanIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  LoaderIcon,
  TriangleAlertIcon,
  UserRoundIcon,
} from "lucide-react"
import { type ReactNode, useActionState, useState } from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { Button } from "@/components/ui/button"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"
import { RuntimeBadge } from "@/components/visualizer/runtime-badge"
import { cn } from "@/lib/utils"
import type { FlowTrace } from "@/types/flow"

import {
  initialReadReportState,
  initialSwitchUserState,
  type ReadReportState,
} from "./action-state"
import { readReport, switchUser } from "./actions"
import { callRoute, type RouteCall, type RouteKind } from "./call-route"
import { ReportTable } from "./report-table"
import { buildRouteTrace, pendingRouteTrace } from "./route-trace"

/** 3つの入口と、比較のための確認を忘れた Route Handler */
type EntryId = "server-component" | "server-action" | RouteKind

/** 結果の種類。色だけに頼らず、アイコンと文字でも表す */
export type Outcome = "ok" | "denied" | "leaked" | "error"

export interface LoginOption {
  /** 空文字はログアウト */
  id: string
  label: string
  note: string
}

interface EntryPanelProps {
  /** サーバーが確認したユーザー */
  viewer: { label: string; note: string; userId: string | null }
  loginOptions: LoginOption[]
  /** Server Component がサーバーで描画した結果 */
  serverResult: ReactNode
  serverOutcome: { outcome: Outcome; label: string }
  serverTrace: FlowTrace
}

type RouteState =
  | { status: "done"; call: RouteCall; trace: FlowTrace }
  | { status: "error"; message: string }

const NODES = [
  "browser",
  "client-component",
  "next-server",
  "server-component",
  "server-action",
  "route-handler",
  "data-source",
] as const

const SA_PENDING_TRACE: FlowTrace = {
  id: "server-action-pending",
  title: "Server Action での確認",
  source: "measured",
  live: true,
  waitingMessage: "サーバーからの応答を待っています…",
  steps: [
    {
      id: "request",
      from: "client-component",
      to: "next-server",
      label: "Server Action を呼ぶ（POST）",
      detail: "サーバーからの応答を待っています",
    },
  ],
}

function readReportOutcome(state: ReadReportState) {
  if (state.status === "ok") {
    return { outcome: "ok", label: "レポートを受け取った" } as const
  }
  return { outcome: "denied", label: "拒否された（戻り値）" } as const
}

function routeOutcome(call: RouteCall) {
  const status = `${call.status} ${call.statusText}`
  // 認証（401）・認可（403）による拒否と、処理の障害（500 / 503 など）は分けて表示する
  if (call.status === 401 || call.status === 403) {
    return { outcome: "denied", label: `拒否された（${status}）` } as const
  }
  if (call.status !== 200) {
    return { outcome: "error", label: `処理エラー（${status}）` } as const
  }
  if (call.kind === "unguarded") {
    return { outcome: "leaked", label: "確認なしで返された（200 OK）" } as const
  }
  return { outcome: "ok", label: "レポートを受け取った（200 OK）" } as const
}

// ボタンの操作と、表示する処理の切り替えを扱うため Client Component。
// 認証と認可の判定は、どの入口でもサーバーの readSalesReport() が行う。
export function EntryPanel({
  viewer,
  loginOptions,
  serverResult,
  serverOutcome,
  serverTrace,
}: EntryPanelProps) {
  const [switchState, switchAction, isSwitching] = useActionState(
    switchUser,
    initialSwitchUserState,
  )
  const [readState, readAction, isReading] = useActionState(
    readReport,
    initialReadReportState,
  )
  const [routes, setRoutes] = useState<Partial<Record<RouteKind, RouteState>>>(
    {},
  )
  const [pendingRoute, setPendingRoute] = useState<{
    kind: RouteKind
    id: string
  } | null>(null)
  const [selected, setSelected] = useState<EntryId>("server-component")

  const isBusy = isSwitching || isReading || pendingRoute !== null

  async function runRoute(kind: RouteKind) {
    const id = crypto.randomUUID()
    setSelected(kind)
    setPendingRoute({ kind, id })
    try {
      const call = await callRoute(kind)
      setRoutes((current) => ({
        ...current,
        [kind]: { status: "done", call, trace: buildRouteTrace(id, call) },
      }))
    } catch {
      setRoutes((current) => ({
        ...current,
        [kind]: {
          status: "error",
          message:
            "リクエストを送れませんでした。通信状態を確かめて、もう一度お試しください。",
        },
      }))
    } finally {
      setPendingRoute(null)
    }
  }

  const routeTrace = (kind: RouteKind) => {
    if (pendingRoute?.kind === kind) {
      return pendingRouteTrace(pendingRoute.id, kind)
    }
    const state = routes[kind]
    return state?.status === "done" ? state.trace : null
  }

  const traces: Record<EntryId, FlowTrace | null> = {
    "server-component": serverTrace,
    "server-action": isReading ? SA_PENDING_TRACE : readState.trace,
    guarded: routeTrace("guarded"),
    unguarded: routeTrace("unguarded"),
  }

  const viewButton = (entry: EntryId) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-pressed={selected === entry}
      disabled={!traces[entry]}
      onClick={() => setSelected(entry)}
      className="aria-pressed:bg-muted aria-pressed:text-foreground"
    >
      {selected === entry ? "処理の流れを表示中" : "処理の流れを見る"}
    </Button>
  )

  return (
    <DemoLayout
      runtime="client"
      runtimeDetail="ユーザーの切り替えと、入口を呼ぶボタン"
      demo={
        <div className="flex flex-col gap-5">
          <section
            aria-labelledby="server-side-auth-viewer"
            className="flex flex-col gap-3 rounded-lg border px-3 py-3"
          >
            <div className="flex flex-col gap-1">
              <h4
                id="server-side-auth-viewer"
                className="text-xs font-medium text-muted-foreground"
              >
                サーバーが確認したユーザー
              </h4>
              <p className="flex items-center gap-2 text-sm font-medium">
                <UserRoundIcon
                  aria-hidden
                  className={cn(
                    "size-4 shrink-0",
                    viewer.userId ? "text-server" : "text-muted-foreground",
                  )}
                />
                {viewer.label}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {viewer.note}
              </p>
            </div>
            <ul
              aria-label="ユーザーを切り替える（本人確認を省略したデモのログイン）"
              className="grid gap-2 sm:grid-cols-3"
            >
              {loginOptions.map((option) => {
                const isCurrent = option.id === (viewer.userId ?? "")
                return (
                  <li key={option.id || "anonymous"}>
                    <form
                      action={switchAction}
                      className="flex h-full"
                      onSubmit={() => setSelected("server-component")}
                    >
                      <input type="hidden" name="userId" value={option.id} />
                      <Button
                        type="submit"
                        variant="outline"
                        disabled={isBusy || isCurrent}
                        aria-pressed={isCurrent}
                        className="h-auto w-full flex-col items-start gap-0.5 py-2 text-left whitespace-normal aria-pressed:border-server/50 aria-pressed:bg-server-muted"
                      >
                        <span>{option.label}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {isCurrent ? "現在のユーザー" : option.note}
                        </span>
                      </Button>
                    </form>
                  </li>
                )
              })}
            </ul>
            {isSwitching ? (
              <p
                role="status"
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <LoaderIcon
                  aria-hidden
                  className="size-3.5 motion-safe:animate-spin"
                />
                切り替えて、ページを描画し直しています…
              </p>
            ) : switchState.status === "error" ? (
              <p
                role="alert"
                className="flex items-start gap-1.5 text-xs text-destructive"
              >
                <CircleAlertIcon
                  aria-hidden
                  className="mt-0.5 size-3.5 shrink-0"
                />
                {switchState.message}
              </p>
            ) : null}
          </section>

          <ol className="flex flex-col gap-3">
            <EntryCard
              number="1"
              title="Server Component"
              how="拒否したら、代わりの表示を描画する"
              runtimeDetail="ページの描画"
              footer={viewButton("server-component")}
            >
              <OutcomeLabel {...serverOutcome} />
              <p className="text-xs text-muted-foreground">
                ページを描画したときに、サーバーで確認した結果です。ユーザーを切り替えると描画し直されます。
              </p>
              <div className="rounded-md border px-3 py-2">{serverResult}</div>
            </EntryCard>

            <EntryCard
              number="2"
              title="Server Action"
              how="拒否したら、レポートを含めない戻り値を返す"
              runtimeDetail="ボタンから呼ぶ関数"
              footer={
                <>
                  <form action={readAction}>
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => setSelected("server-action")}
                    >
                      Server Action で読む
                    </Button>
                  </form>
                  {viewButton("server-action")}
                </>
              }
            >
              {isReading ? (
                <PendingNote />
              ) : readState.status === "idle" ? (
                <IdleNote />
              ) : readState.status === "failed" ? (
                <ErrorNote message={readState.message} />
              ) : (
                <>
                  <OutcomeLabel {...readReportOutcome(readState)} />
                  <p className="text-xs text-muted-foreground">
                    {readState.message}
                  </p>
                  {readState.report ? (
                    <div className="rounded-md border px-3 py-2">
                      <ReportTable report={readState.report} />
                    </div>
                  ) : null}
                </>
              )}
            </EntryCard>

            <RouteEntryCard
              number="3"
              kind="guarded"
              title="Route Handler"
              how="拒否したら、401 / 403 のステータスを返す"
              state={routes.guarded}
              isPending={pendingRoute?.kind === "guarded"}
              disabled={isBusy}
              onRun={() => runRoute("guarded")}
              viewButton={viewButton("guarded")}
            />

            <RouteEntryCard
              number="比較"
              kind="unguarded"
              title="確認を忘れた Route Handler"
              how="確認をしないため、誰にでもデータを返してしまう"
              caution
              state={routes.unguarded}
              isPending={pendingRoute?.kind === "unguarded"}
              disabled={isBusy}
              onRun={() => runRoute("unguarded")}
              viewButton={viewButton("unguarded")}
            />
          </ol>
        </div>
      }
      visualizer={
        <ProcessVisualizer
          nodes={[...NODES]}
          trace={traces[selected]}
          emptyMessage="入口のボタンを押すと、その入口での認証と認可の処理がここに表示されます"
        />
      }
    />
  )
}

function EntryCard({
  number,
  title,
  how,
  runtimeDetail,
  caution,
  footer,
  children,
}: {
  number: string
  title: string
  how: string
  runtimeDetail: string
  caution?: boolean
  footer: ReactNode
  children: ReactNode
}) {
  return (
    <li
      className={cn(
        "flex min-w-0 flex-col gap-2.5 rounded-lg border px-3 py-3",
        caution && "border-dashed border-destructive/40",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-sm font-medium">
          <span
            className={cn(
              "rounded border px-1.5 font-mono text-[0.7rem] text-muted-foreground",
              caution && "border-destructive/40 text-destructive",
            )}
          >
            {number}
          </span>
          {title}
        </h4>
        <RuntimeBadge runtime="server" detail={runtimeDetail} />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{how}</p>
      <div className="flex flex-col gap-2">{children}</div>
      <div className="flex flex-wrap items-center gap-2 border-t pt-2.5">
        {footer}
      </div>
    </li>
  )
}

function RouteEntryCard({
  number,
  kind,
  title,
  how,
  caution,
  state,
  isPending,
  disabled,
  onRun,
  viewButton,
}: {
  number: string
  kind: RouteKind
  title: string
  how: string
  caution?: boolean
  state: RouteState | undefined
  isPending: boolean
  disabled: boolean
  onRun: () => void
  viewButton: ReactNode
}) {
  return (
    <EntryCard
      number={number}
      title={title}
      how={how}
      runtimeDetail={kind === "guarded" ? "api/report" : "api/unguarded"}
      caution={caution}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={onRun}
          >
            GET で呼ぶ
          </Button>
          {viewButton}
        </>
      }
    >
      {isPending ? (
        <PendingNote />
      ) : !state ? (
        <IdleNote />
      ) : state.status === "error" ? (
        <ErrorNote message={state.message} />
      ) : (
        <>
          <OutcomeLabel {...routeOutcome(state.call)} />
          <pre
            tabIndex={0}
            aria-label={`${title} のレスポンスの本文`}
            className="max-h-48 overflow-auto rounded-md border px-3 py-2 font-mono text-xs leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <code>{state.call.body}</code>
          </pre>
        </>
      )}
    </EntryCard>
  )
}

const OUTCOME_STYLE = {
  ok: { Icon: CircleCheckIcon, className: "text-server" },
  denied: { Icon: BanIcon, className: "text-muted-foreground" },
  leaked: { Icon: TriangleAlertIcon, className: "text-destructive" },
  error: { Icon: CircleAlertIcon, className: "text-destructive" },
} as const satisfies Record<Outcome, unknown>

function OutcomeLabel({ outcome, label }: { outcome: Outcome; label: string }) {
  const { Icon, className } = OUTCOME_STYLE[outcome]
  return (
    <p
      className={cn("flex items-center gap-1.5 text-sm font-medium", className)}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      {label}
    </p>
  )
}

function PendingNote() {
  return (
    <p
      role="status"
      className="flex items-center gap-1.5 text-sm text-muted-foreground"
    >
      <LoaderIcon aria-hidden className="size-4 motion-safe:animate-spin" />
      サーバーで確認しています…
    </p>
  )
}

function IdleNote() {
  return (
    <p className="text-sm text-muted-foreground">
      まだ呼んでいません。下のボタンで呼び出します。
    </p>
  )
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-1.5 text-sm text-destructive"
    >
      <CircleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  )
}
