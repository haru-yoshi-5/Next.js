import "server-only"

import { errors, jwtVerify, SignJWT } from "jose"
import { cookies } from "next/headers"

/**
 * 認証デモのセッション。ユーザー ID と有効期限を、署名付きの JWT にして cookie に保存する。
 *
 * - 署名（HS256）は改ざんを見つけるためのもので、暗号化ではない。中身は誰でも読めるため、
 *   ユーザー ID と期限以外は入れない。
 * - データベースを使わないため、発行したトークンを途中で無効にできない。
 *   ログアウトで cookie を消しても、コピーされたトークンは期限まで有効になる。
 */

export const SESSION_COOKIE = "nextscope-auth-demo"
/** 教材のページにだけ送られるようにする（強いセキュリティ境界ではない） */
const COOKIE_PATH = "/learn"
export const SESSION_TTL_SECONDS = 15 * 60

const ALGORITHM = "HS256"
const ISSUER = "nextscope-auth-demo"
const MIN_SECRET_LENGTH = 32
/** これより長い cookie は検証せずに不正として扱う */
const MAX_TOKEN_LENGTH = 2048

/**
 * 署名用の秘密鍵。サーバーの環境変数からだけ読み、ブラウザへは送らない。
 * 未設定・短すぎる場合は null を返し、デモだけを無効にする（ほかの教材には影響させない）。
 */
function getSecretKey(): Uint8Array | null {
  const secret = process.env.AUTH_DEMO_SECRET
  if (!secret || secret.length < MIN_SECRET_LENGTH) return null
  return new TextEncoder().encode(secret)
}

export function isAuthDemoConfigured(): boolean {
  return getSecretKey() !== null
}

/** セッションの検証結果 */
export type SessionCheck =
  | { status: "unconfigured" }
  | { status: "missing" }
  /** 署名が一致しない、または形式が正しくない */
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "valid"; userId: string; expiresAt: number }

interface SignOptions {
  /** 発行時刻（UNIX 秒） */
  issuedAt: number
  /** 有効期限（UNIX 秒） */
  expiresAt: number
}

/** ユーザー ID と期限に署名したトークンを作る。秘密鍵がなければ null */
export async function signSessionToken(
  userId: string,
  { issuedAt, expiresAt }: SignOptions,
): Promise<string | null> {
  const key = getSecretKey()
  if (!key) return null
  return new SignJWT()
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .sign(key)
}

/** トークンの署名・発行者・期限を確かめる */
export async function verifySessionToken(token: string): Promise<SessionCheck> {
  const key = getSecretKey()
  if (!key) return { status: "unconfigured" }
  if (token.length > MAX_TOKEN_LENGTH) return { status: "invalid" }

  try {
    const { payload } = await jwtVerify(token, key, {
      // 受け付けるアルゴリズムを固定し、ヘッダーの alg を書き換える攻撃を防ぐ
      algorithms: [ALGORITHM],
      issuer: ISSUER,
      requiredClaims: ["sub", "exp"],
    })
    if (typeof payload.sub !== "string" || typeof payload.exp !== "number") {
      return { status: "invalid" }
    }
    return { status: "valid", userId: payload.sub, expiresAt: payload.exp }
  } catch (error) {
    if (error instanceof errors.JWTExpired) return { status: "expired" }
    if (error instanceof errors.JOSEError) return { status: "invalid" }
    throw error
  }
}

/** リクエストの cookie からセッションを読み、検証する */
export async function readSession(): Promise<SessionCheck> {
  if (!isAuthDemoConfigured()) return { status: "unconfigured" }
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return { status: "missing" }
  return verifySessionToken(token)
}

/** cookie にトークンを保存する。Server Action・Route Handler の中でだけ呼べる */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    // ブラウザの JavaScript から読めないようにする
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    // 署名の中の期限と合わせる
    maxAge: SESSION_TTL_SECONDS,
  })
}

/** 新しいセッションを発行して cookie に保存する。秘密鍵がなければ false */
export async function createSession(userId: string): Promise<boolean> {
  const issuedAt = Math.floor(Date.now() / 1000)
  const token = await signSessionToken(userId, {
    issuedAt,
    expiresAt: issuedAt + SESSION_TTL_SECONDS,
  })
  if (!token) return false
  await setSessionCookie(token)
  return true
}

/** cookie を消す。保存したときと同じ path を指定する */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete({ name: SESSION_COOKIE, path: COOKIE_PATH })
}
