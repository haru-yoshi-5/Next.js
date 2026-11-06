import { type NextRequest, NextResponse } from "next/server"

import {
  isAuthDemoConfigured,
  SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/auth-demo/session"

import { loginHref, PROTECTED_PAGES } from "./return-to"

export const PROXIED_PATH = PROTECTED_PAGES.proxied

/**
 * 保護されたページ教材の Proxy。/learn/protected-pages/proxied へのリクエストだけで動く（src/proxy.ts から呼ぶ）。
 *
 * ページを描画する前に、cookie の署名と期限だけを確かめる「楽観的な確認」。
 * 通らなければ、描画せずに 307 でログインページへリダイレクトする。
 * Proxy はリンクの prefetch でも動くため、ユーザーの存在確認やデータの読み取りなど重い処理はしない。
 * ここを通っても、ページの中でもう一度 readMemberArea() が確かめる。
 */
export async function guardProxiedPage(
  request: NextRequest,
): Promise<NextResponse> {
  // 秘密鍵がなければ振り分けず、ページに未設定の案内を表示させる
  if (!isAuthDemoConfigured()) return NextResponse.next()

  // Proxy では、リクエストに付いてきた cookie を request.cookies から読む
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = token ? await verifySessionToken(token) : null
  if (session?.status === "valid") return NextResponse.next()

  return NextResponse.redirect(new URL(loginHref(PROXIED_PATH), request.url))
}
