import { describeAuth } from "@/lib/auth-demo/describe"
import type { FlowNodeId, FlowStep, FlowTrace } from "@/types/flow"

import type { ReportAccess } from "./report"

/** サーバーの中で readSalesReport() を呼ぶ入口 */
export type ServerEntry = "server-component" | "server-action"

const PERMISSION_LABEL = "売上レポートを見る"

const ENTRY: Record<
  ServerEntry,
  {
    title: string
    /** ブラウザ側で、リクエストを送り結果を受け取るノード */
    caller: FlowNodeId
    request: string
    requestDetail: string
    invoke: string
    respond: Record<ReportAccess["status"], string>
    respondDetail: string
  }
> = {
  "server-component": {
    title: "Server Component での確認",
    caller: "browser",
    request: "ページの描画を要求",
    requestDetail:
      "ページを開いたとき（GET）と、ユーザーを切り替えた Server Action の応答（POST）の両方で描画される",
    invoke: "ReportDemo を描画",
    respond: {
      ok: "レポートを描画して返す",
      unauthenticated: "代わりに「ログインが必要」と描画して返す",
      forbidden: "代わりに「権限がない」と描画して返す",
      unconfigured: "代わりの案内を描画して返す",
    },
    respondDetail:
      "拒否した場合、売上の数字は描画結果（HTML / RSC Payload）に含まれない。サーバー処理の合計時間",
  },
  "server-action": {
    title: "Server Action での確認",
    caller: "client-component",
    request: "Server Action を呼ぶ（POST）",
    requestDetail: "セッションの cookie は、ブラウザが自動で付ける",
    invoke: "readReport() を実行",
    respond: {
      ok: "レポートを戻り値で返す",
      unauthenticated: "拒否（未ログイン）を戻り値で返す",
      forbidden: "拒否（権限がない）を戻り値で返す",
      unconfigured: "エラーを戻り値で返す",
    },
    respondDetail: "サーバー処理の合計時間",
  },
}

interface ServerEntryTraceInput {
  id: string
  entry: ServerEntry
  access: ReportAccess
  /** readSalesReport() の呼び出しから戻るまでの時間（サーバーで計測） */
  totalMs: number
}

/** Server Component / Server Action の中での確認を、Process Visualizer 用のデータにする */
export function buildServerEntryTrace({
  id,
  entry,
  access,
  totalMs,
}: ServerEntryTraceInput): FlowTrace {
  const config = ENTRY[entry]
  const node: FlowNodeId = entry
  const isAuthenticated = access.auth.status === "authenticated"

  const steps: FlowStep[] = [
    {
      id: "request",
      from: config.caller,
      to: "next-server",
      label: config.request,
      // ユーザーを切り替えた直後の描画では、cookie は変更後の内容になるため、
      // 「送られたか」は表示しない。cookie の有無は認証のステップで、確認した結果として表示する
      detail: config.requestDetail,
    },
    { id: "invoke", from: "next-server", to: node, label: config.invoke },
    {
      id: "authenticate",
      from: node,
      to: node,
      label: "認証: readSalesReport() がセッションを検証",
      detail: describeAuth(access.auth),
      durationMs: access.authMs,
      status: isAuthenticated ? undefined : "error",
    },
  ]

  if (access.auth.status === "authenticated") {
    steps.push({
      id: "authorize",
      from: node,
      to: node,
      label: `認可: 「${PERMISSION_LABEL}」の権限があるか`,
      detail: `${access.auth.viewer.roleLabel} → ${access.status === "forbidden" ? "許可されていない" : "許可されている"}`,
      status: access.status === "forbidden" ? "error" : undefined,
    })
  }

  if (access.status === "ok") {
    steps.push({
      id: "data",
      from: node,
      to: "data-source",
      label: "確認を通ったので、売上を読み取る",
      durationMs: access.dataMs,
    })
  }

  steps.push({
    id: "respond",
    from: node,
    to: config.caller,
    label: config.respond[access.status],
    detail: config.respondDetail,
    durationMs: totalMs,
    status: access.status === "ok" ? "success" : "error",
  })

  return {
    id,
    title: config.title,
    source: "measured",
    // 最後のステップが合計時間なので、途中の時間と足し合わせない
    hideTotal: true,
    steps,
  }
}
