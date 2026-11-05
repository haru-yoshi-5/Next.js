"use server"

import { cookies } from "next/headers"

import { getAuthState } from "@/lib/auth-demo/dal"
import {
  createSession,
  deleteSession,
  isAuthDemoConfigured,
  SESSION_COOKIE,
  setSessionCookie,
} from "@/lib/auth-demo/session"
import { can, findDemoUser, ROLE_LABEL } from "@/lib/auth-demo/users"
import { measure } from "@/lib/measure"

import {
  type AuthDemoState,
  DEMO_INTENTS,
  type DemoIntent,
  type DemoOutcome,
} from "./action-state"
import { createExpiredToken, createTamperedToken } from "./broken-sessions"
import { buildAuthDemoTrace } from "./trace"

const MAX_USER_ID_LENGTH = 64

function parseIntent(value: FormDataEntryValue | null): DemoIntent | null {
  return DEMO_INTENTS.find((intent) => intent === value) ?? null
}

/**
 * デモのボタンから呼ばれる Server Action。
 * Server Action は公開された API と同じで、画面にボタンがなくても直接呼び出せる。
 * そのため、ボタンの表示とは関係なく、守る対象の操作（プロフィールを見る・お知らせを公開する）では、
 * 実行するたびにサーバーで認証と認可を確かめる。
 */
export async function runAuthDemo(
  _previousState: AuthDemoState,
  formData: FormData,
): Promise<AuthDemoState> {
  const startedAt = performance.now()
  const requestId = crypto.randomUUID()
  const intent = parseIntent(formData.get("intent"))
  const hadCookie = (await cookies()).has(SESSION_COOKIE)

  const finish = (
    outcome: DemoOutcome,
    message: string,
    extra: Partial<Parameters<typeof buildAuthDemoTrace>[0]> = {},
  ): AuthDemoState => ({
    status: outcome,
    message,
    trace: buildAuthDemoTrace({
      requestId,
      intent,
      hadCookie,
      outcome,
      totalMs: performance.now() - startedAt,
      ...extra,
    }),
  })

  // クライアントから届いた値は信頼せず、決まった操作だけを受け付ける
  if (!intent) {
    return finish("invalid", "不明な操作です。", {
      detail: "決められた操作以外は受け付けない",
    })
  }
  if (!isAuthDemoConfigured()) {
    return finish(
      "unconfigured",
      "認証デモの秘密鍵が設定されていないため、実行できません。",
    )
  }

  try {
    switch (intent) {
      case "login":
        return await login(formData, finish)
      case "logout":
        await deleteSession()
        return finish("success", "ログアウトしました。cookie を削除しました。")
      case "tamper": {
        const token = await createTamperedToken()
        if (!token)
          return finish("unconfigured", "秘密鍵が設定されていません。")
        await setSessionCookie(token)
        return finish(
          "success",
          "一般ユーザーのセッションの中身を、管理者の ID に書き換えて保存しました。署名は書き換える前のままです。",
        )
      }
      case "expire": {
        const token = await createExpiredToken()
        if (!token)
          return finish("unconfigured", "秘密鍵が設定されていません。")
        await setSessionCookie(token)
        return finish("success", "期限が切れたセッションを保存しました。")
      }
      case "view-profile":
        return await viewProfile(finish)
      case "publish":
        return await publishAnnouncement(finish)
    }
  } catch (error) {
    // 詳細はサーバーのログにだけ残し、ブラウザには一般的なメッセージを返す
    console.error("[runAuthDemo] 処理に失敗しました", error)
    return finish(
      "failed",
      "処理中にエラーが発生しました。時間をおいて再度お試しください。",
    )
  }
}

type Finish = (
  outcome: DemoOutcome,
  message: string,
  extra?: Partial<Parameters<typeof buildAuthDemoTrace>[0]>,
) => AuthDemoState

/**
 * 本人確認（パスワードなど）を省略したデモのログイン。
 * 選ばれたユーザー ID が実在するかだけをサーバーで確かめ、セッションを発行する。
 */
async function login(formData: FormData, finish: Finish) {
  const rawUserId = formData.get("userId")
  const userId = typeof rawUserId === "string" ? rawUserId : ""
  const user = userId.length <= MAX_USER_ID_LENGTH ? findDemoUser(userId) : null
  if (!user) {
    return finish("invalid", "選んだユーザーが見つかりません。", {
      detail: "存在しないユーザー ID",
    })
  }

  await createSession(user.id)
  return finish(
    "success",
    `${user.name}（${ROLE_LABEL[user.role]}）としてログインしました。`,
  )
}

/** 一般ユーザーにも管理者にも許可している操作 */
async function viewProfile(finish: Finish) {
  const { result: auth, durationMs } = await measure(getAuthState)
  const authentication = { auth, durationMs }
  if (auth.status !== "authenticated") {
    return finish(
      "unauthenticated",
      "ログインしていないため、プロフィールを表示できません。",
      { authentication },
    )
  }

  const { viewer } = auth
  const authorization = {
    permissionLabel: "プロフィールを見る",
    roleLabel: viewer.roleLabel,
  }
  if (!can(viewer, "view-profile")) {
    return finish("forbidden", "プロフィールを見る権限がありません。", {
      authentication,
      authorization,
    })
  }

  return finish(
    "success",
    `プロフィール: ${viewer.name}（${viewer.roleLabel}）。セッションの残りは約${Math.ceil(auth.expiresInSeconds / 60)}分です。`,
    { authentication, authorization },
  )
}

/** 管理者だけに許可する操作（認証のあとに認可を確かめる） */
async function publishAnnouncement(finish: Finish) {
  const { result: auth, durationMs } = await measure(getAuthState)
  const authentication = { auth, durationMs }
  if (auth.status !== "authenticated") {
    return finish(
      "unauthenticated",
      "ログインしていないため、お知らせを公開できません。",
      { authentication },
    )
  }

  const authorization = {
    permissionLabel: "お知らせを公開する",
    roleLabel: auth.viewer.roleLabel,
  }
  if (!can(auth.viewer, "publish-announcement")) {
    return finish(
      "forbidden",
      `${auth.viewer.name}さん（${auth.viewer.roleLabel}）には、お知らせを公開する権限がありません。`,
      { authentication, authorization },
    )
  }

  // デモのため、実際には何も保存しない
  return finish(
    "success",
    "お知らせを公開しました（デモのため、実際には保存していません）。",
    { authentication, authorization },
  )
}
