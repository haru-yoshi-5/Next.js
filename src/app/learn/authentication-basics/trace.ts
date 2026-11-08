import type { AuthState } from "@/lib/auth-demo/dal"
import { describeAuth } from "@/lib/auth-demo/describe"
import type { FlowStep, FlowTrace } from "@/types/flow"

import type { DemoIntent, DemoOutcome } from "./action-state"

const CALL_LABEL: Record<DemoIntent, string> = {
  login: "ログインの処理を実行",
  logout: "ログアウトの処理を実行",
  tamper: "中身を書き換えたセッションを作る",
  expire: "期限切れのセッションを作る",
  "view-profile": "プロフィールを読む処理を実行",
  publish: "お知らせを公開する処理を実行",
}

const COOKIE_LABEL: Record<"login" | "logout" | "tamper" | "expire", string> = {
  login: "Set-Cookie: 署名したセッションを保存",
  logout: "Set-Cookie: セッションの cookie を削除",
  tamper: "Set-Cookie: 中身を書き換えたセッションを保存",
  expire: "Set-Cookie: 期限切れのセッションを保存",
}

interface AuthDemoTraceInput {
  requestId: string
  intent: DemoIntent | null
  /** リクエストにセッションの cookie が含まれていたか */
  hadCookie: boolean
  outcome: DemoOutcome
  /** Server Action の開始から return までの時間（サーバーで計測） */
  totalMs: number
  /** 認証（セッションの検証）の結果と所要時間。認証を行った操作だけ */
  authentication?: { auth: AuthState; durationMs: number }
  /** 認可の結果。認可を行った操作だけ */
  authorization?: { permissionLabel: string; roleLabel: string }
  /** 失敗の理由など */
  detail?: string
}

/** Server Action の実行結果を Process Visualizer 用のデータにする（サーバーで実行） */
export function buildAuthDemoTrace({
  requestId,
  intent,
  hadCookie,
  outcome,
  totalMs,
  authentication,
  authorization,
  detail,
}: AuthDemoTraceInput): FlowTrace {
  const isError = outcome !== "success"
  const steps: FlowStep[] = [
    {
      id: "submit",
      from: "client-component",
      to: "next-server",
      label: "Server Action を呼ぶ（POST）",
      detail: hadCookie
        ? "セッションの cookie も一緒に送られる"
        : "セッションの cookie は送られない",
    },
    {
      id: "invoke",
      from: "next-server",
      to: "server-action",
      label: intent ? CALL_LABEL[intent] : "runAuthDemo(prevState, formData)",
    },
  ]

  if (outcome === "unconfigured" || outcome === "invalid") {
    steps.push({
      id: "check",
      from: "server-action",
      to: "server-action",
      label:
        outcome === "unconfigured"
          ? "AUTH_DEMO_SECRET が設定されていない"
          : "入力の検証: NG",
      detail,
      status: "error",
    })
  }

  if (authentication) {
    steps.push({
      id: "authenticate",
      from: "server-action",
      to: "server-action",
      label: "認証: cookie のセッションを検証",
      detail: describeAuth(authentication.auth),
      durationMs: authentication.durationMs,
      status:
        authentication.auth.status === "authenticated" ? undefined : "error",
    })
  }

  if (authorization) {
    steps.push({
      id: "authorize",
      from: "server-action",
      to: "server-action",
      label: `認可: 「${authorization.permissionLabel}」の権限があるか`,
      detail: `${authorization.roleLabel} → ${outcome === "forbidden" ? "許可されていない" : "許可されている"}`,
      status: outcome === "forbidden" ? "error" : undefined,
    })
  }

  const changesCookie =
    intent === "login" ||
    intent === "logout" ||
    intent === "tamper" ||
    intent === "expire"
  if (changesCookie && outcome === "success") {
    steps.push(
      {
        id: "cookie",
        from: "server-action",
        to: "browser",
        label: COOKIE_LABEL[intent],
        detail: "HttpOnly のため、ブラウザの JavaScript からは読めない",
      },
      {
        id: "rerender",
        from: "next-server",
        to: "server-component",
        label: "（仕様）ページを描画し直し、cookie を検証し直す",
        // この記録は Server Action が値を返す前に作るため、後に続く描画は計測していない
        detail:
          "Next.js の仕様に基づく説明で、計測はしていない。cookie を変更した Server Action は、更新後の画面を同じ応答で返す",
      },
    )
  }

  steps.push({
    id: "respond",
    from: "server-action",
    to: "client-component",
    label:
      outcome === "unauthenticated"
        ? "未ログインとして拒否する"
        : outcome === "forbidden"
          ? "権限がないため拒否する"
          : isError
            ? "エラーを返す"
            : "結果を返す",
    detail: "サーバー処理の合計時間",
    durationMs: totalMs,
    status: isError ? "error" : "success",
  })

  return {
    id: requestId,
    title: "Server Action での認証と認可",
    source: "measured",
    // 最後のステップが合計時間なので、検証の時間と足し合わせない
    hideTotal: true,
    steps,
  }
}
