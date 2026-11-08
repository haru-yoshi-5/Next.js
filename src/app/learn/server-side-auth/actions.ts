"use server"

import {
  createSession,
  deleteSession,
  isAuthDemoConfigured,
} from "@/lib/auth-demo/session"
import { findDemoUser } from "@/lib/auth-demo/users"

import type { ReadReportState, SwitchUserState } from "./action-state"
import { readSalesReportWithTrace } from "./report"

const MAX_USER_ID_LENGTH = 64

const DENIED_MESSAGE = {
  unauthenticated: "ログインしていないため、レポートを渡しませんでした。",
  forbidden: "レポートを見る権限がないため、渡しませんでした。",
  unconfigured: "認証デモの秘密鍵が設定されていないため、確認できません。",
} as const

/**
 * Server Action: レポートを読む。
 * Server Action は公開された API と同じで、画面にボタンがなくても直接呼び出せる。
 * そのため、呼ばれるたびに readSalesReport() で認証と認可を確かめ、拒否した場合はレポートを返さない。
 * 前の state とフォームの値は使わないため、引数を受け取らない。
 */
export async function readReport(): Promise<ReadReportState> {
  try {
    const { access, trace } = await readSalesReportWithTrace("server-action")
    if (access.status !== "ok") {
      return {
        status: access.status,
        message: DENIED_MESSAGE[access.status],
        report: null,
        trace,
      }
    }
    return {
      status: "ok",
      message: "確認を通ったため、レポートを受け取りました。",
      report: access.report,
      trace,
    }
  } catch (error) {
    // 詳細はサーバーのログにだけ残し、ブラウザには一般的なメッセージを返す
    console.error("[server-side-auth] レポートの読み取りに失敗しました", error)
    return {
      status: "failed",
      message: "処理中にエラーが発生しました。時間をおいて再度お試しください。",
      report: null,
      trace: null,
    }
  }
}

/**
 * Server Action: デモのユーザーを切り替える（本人確認を省略したデモのログイン）。
 * userId が空ならログアウトする。cookie を変更するため、ページは同じ応答の中で描画し直される。
 * 成功した場合は描画し直したページが結果を表すため、メッセージは返さない。
 */
export async function switchUser(
  _previousState: SwitchUserState,
  formData: FormData,
): Promise<SwitchUserState> {
  if (!isAuthDemoConfigured()) {
    return { status: "error", message: DENIED_MESSAGE.unconfigured }
  }

  // クライアントから届いた値は信頼せず、実在するユーザーかをサーバーで確かめる
  const rawUserId = formData.get("userId")
  const userId = typeof rawUserId === "string" ? rawUserId : null

  try {
    if (userId === "") {
      await deleteSession()
      return { status: "idle", message: null }
    }

    const user =
      userId && userId.length <= MAX_USER_ID_LENGTH
        ? findDemoUser(userId)
        : null
    if (!user) {
      return { status: "error", message: "選んだユーザーが見つかりません。" }
    }

    await createSession(user.id)
    return { status: "idle", message: null }
  } catch (error) {
    console.error("[server-side-auth] ユーザーの切り替えに失敗しました", error)
    return {
      status: "error",
      message:
        "ユーザーを切り替えられませんでした。時間をおいて再度お試しください。",
    }
  }
}
