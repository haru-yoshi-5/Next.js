"use server"

import { redirect } from "next/navigation"

import {
  createSession,
  deleteSession,
  isAuthDemoConfigured,
} from "@/lib/auth-demo/session"
import { findDemoUser } from "@/lib/auth-demo/users"

import type { AuthActionState } from "./action-state"
import { parseReturnTo } from "./return-to"

const MAX_USER_ID_LENGTH = 64

const UNCONFIGURED_MESSAGE =
  "認証デモの秘密鍵が設定されていないため、ログインできません。"

/**
 * Server Action: デモのユーザーでログインし、元のページへ戻る（本人確認を省略したデモのログイン）。
 *
 * 戻り先（next）はフォームの hidden の値で、ブラウザから書き換えられる。
 * ログインページで確かめた値でも信頼せず、ここで許可リストと照らし合わせ直してから redirect() に渡す。
 */
export async function loginAndReturn(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isAuthDemoConfigured()) return { error: UNCONFIGURED_MESSAGE }

  const returnTo = parseReturnTo(formData.get("next")).path

  // クライアントから届いた値は信頼せず、実在するユーザーかをサーバーで確かめる
  const rawUserId = formData.get("userId")
  const user =
    typeof rawUserId === "string" && rawUserId.length <= MAX_USER_ID_LENGTH
      ? findDemoUser(rawUserId)
      : null
  if (!user) return { error: "選んだユーザーが見つかりません。" }

  try {
    await createSession(user.id)
  } catch (error) {
    // 詳細はサーバーのログにだけ残し、ブラウザには一般的なメッセージを返す
    console.error("[protected-pages] ログインに失敗しました", error)
    return {
      error: "ログインできませんでした。時間をおいて再度お試しください。",
    }
  }

  // redirect() は例外を投げて移動させるため、try / catch の外で呼ぶ（catch で握りつぶさない）
  redirect(returnTo)
}

/**
 * Server Action: ログアウトする。cookie を変更するため、ページは同じ応答の中で描画し直される。
 */
export async function logout(): Promise<AuthActionState> {
  try {
    await deleteSession()
    return { error: null }
  } catch (error) {
    console.error("[protected-pages] ログアウトに失敗しました", error)
    return {
      error: "ログアウトできませんでした。時間をおいて再度お試しください。",
    }
  }
}
