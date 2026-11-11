import "server-only"

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"

export const SESSION_COOKIE_NAME = "nextscope_ai_session"
/** 匿名 Cookie の有効期間（秒）。保存するのはランダムな ID と署名だけ */
const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60

function hmac(secret: string, value: string) {
  return createHmac("sha256", secret).update(value).digest("base64url")
}

/**
 * 送信元の IP アドレスを読む。
 * 本番では Vercel が設定するヘッダーだけを使う（x-real-ip、なければ x-forwarded-for の先頭）。
 * 読めないときは "unknown" とし、読めない送信元どうしで上限を共有する。
 * 開発中は "local" に固定する。
 */
export function readClientIp(headers: Headers, isProduction: boolean) {
  if (!isProduction) return "local"
  const realIp = headers.get("x-real-ip")?.trim()
  if (realIp) return realIp
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return forwarded || "unknown"
}

/**
 * 利用制限のキーに使うハッシュ。IP アドレスや ID は、そのままの形では保存しない。
 * 日付を混ぜて、日ごとに別の値になるようにする。
 */
export function hashIdentifier(
  secret: string,
  dateKey: string,
  kind: "ip" | "session",
  value: string,
) {
  return hmac(secret, `${kind}:${dateKey}:${value}`)
}

/** 新しい匿名セッション ID と、Cookie に入れる値（ID.署名） */
export function createSession(secret: string) {
  const id = randomUUID()
  return { id, cookieValue: `${id}.${hmac(secret, `session:${id}`)}` }
}

/** Cookie の値の署名を確かめ、正しければセッション ID を返す */
export function verifySessionCookie(
  secret: string,
  cookieValue: string | undefined,
) {
  if (!cookieValue) return null
  const separator = cookieValue.lastIndexOf(".")
  if (separator <= 0) return null

  const id = cookieValue.slice(0, separator)
  const signature = Buffer.from(cookieValue.slice(separator + 1))
  const expected = Buffer.from(hmac(secret, `session:${id}`))
  if (signature.length !== expected.length) return null
  return timingSafeEqual(signature, expected) ? id : null
}

/** 匿名 Cookie を設定する Set-Cookie ヘッダーの値 */
export function buildSessionSetCookie(
  cookieValue: string,
  isProduction: boolean,
) {
  return [
    `${SESSION_COOKIE_NAME}=${cookieValue}`,
    "Path=/api/ai",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    "HttpOnly",
    "SameSite=Lax",
    ...(isProduction ? ["Secure"] : []),
  ].join("; ")
}

/** Cookie ヘッダーから匿名 Cookie の値を読む */
export function readSessionCookie(headers: Headers) {
  const cookieHeader = headers.get("cookie")
  if (!cookieHeader) return undefined
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=")
    if (name === SESSION_COOKIE_NAME) return rest.join("=")
  }
  return undefined
}
