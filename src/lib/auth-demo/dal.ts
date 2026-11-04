import "server-only"

import { cache } from "react"

import { readSession } from "./session"
import { type DemoRole, findDemoUser, ROLE_LABEL } from "./users"

/** 画面に渡してよい、最小限のユーザー情報（DTO） */
export interface ViewerDTO {
  id: string
  name: string
  role: DemoRole
  roleLabel: string
}

/** 未ログインになった理由 */
export type AnonymousReason =
  | "missing"
  | "invalid"
  | "expired"
  /** 署名は正しいが、そのユーザーが存在しない */
  | "unknown-user"

/** 認証の結果 */
export type AuthState =
  | { status: "unconfigured" }
  | { status: "anonymous"; reason: AnonymousReason }
  | {
      status: "authenticated"
      viewer: ViewerDTO
      /** 確認した時点での、期限までの残り秒数 */
      expiresInSeconds: number
    }

/**
 * 認証: リクエストの cookie から「誰か」を確かめる。
 * 認証・認可の確認はすべてこの関数を通し、ページ・Server Action・Route Handler のそれぞれで呼ぶ。
 * React の cache により、1回の描画の中では何度呼んでも検証は1回だけになる。
 */
export const getAuthState = cache(async (): Promise<AuthState> => {
  const session = await readSession()
  if (session.status === "unconfigured") return { status: "unconfigured" }
  if (session.status !== "valid") {
    return { status: "anonymous", reason: session.status }
  }

  const user = findDemoUser(session.userId)
  if (!user) return { status: "anonymous", reason: "unknown-user" }

  return {
    status: "authenticated",
    viewer: {
      id: user.id,
      name: user.name,
      role: user.role,
      roleLabel: ROLE_LABEL[user.role],
    },
    expiresInSeconds: Math.max(
      0,
      session.expiresAt - Math.floor(Date.now() / 1000),
    ),
  }
})
