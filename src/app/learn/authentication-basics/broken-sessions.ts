import "server-only"

import { base64url } from "jose"

import { SESSION_TTL_SECONDS, signSessionToken } from "@/lib/auth-demo/session"
import { listDemoUsers } from "@/lib/auth-demo/users"

/**
 * 「サーバーはセッションを検証する」ことを確かめるための、壊れたセッションを作る。
 * 実際のアプリにはこのような処理は置かない。
 */

const nowInSeconds = () => Math.floor(Date.now() / 1000)

function findIdByRole(role: "member" | "admin"): string {
  const user = listDemoUsers().find((candidate) => candidate.role === role)
  if (!user) throw new Error(`デモユーザーが見つかりません: ${role}`)
  return user.id
}

/**
 * 一般ユーザーのセッションを正しく発行し、中身のユーザー ID だけを管理者に書き換える。
 * 署名は書き換える前の中身に対するものなので、検証すると一致しない。
 */
export async function createTamperedToken(): Promise<string | null> {
  const issuedAt = nowInSeconds()
  const token = await signSessionToken(findIdByRole("member"), {
    issuedAt,
    expiresAt: issuedAt + SESSION_TTL_SECONDS,
  })
  if (!token) return null

  // JWT は「ヘッダー.中身.署名」を base64url でつないだもので、中身は誰でも読み書きできる
  const [header, payload, signature] = token.split(".")
  const claims: Record<string, unknown> = JSON.parse(
    new TextDecoder().decode(base64url.decode(payload)),
  )
  claims.sub = findIdByRole("admin")
  return `${header}.${base64url.encode(JSON.stringify(claims))}.${signature}`
}

/** 署名は正しいが、期限が1分前に切れているセッションを作る */
export async function createExpiredToken(): Promise<string | null> {
  const expiresAt = nowInSeconds() - 60
  return signSessionToken(findIdByRole("member"), {
    issuedAt: expiresAt - SESSION_TTL_SECONDS,
    expiresAt,
  })
}
