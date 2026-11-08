"use server"

import { cookies } from "next/headers"

import { BASE_PATH, OUTAGE_COOKIE, OUTAGE_MS } from "./demo-config"

/**
 * 一時的な障害を起こす Server Action。
 * 障害の終了時刻を cookie に保存する。Server Action で cookie を変更すると、
 * Next.js が現在のページを描画し直すため、page がすぐにエラーになる。
 */
export async function startOutage(): Promise<{ until: number }> {
  const until = Date.now() + OUTAGE_MS
  const cookieStore = await cookies()
  cookieStore.set(OUTAGE_COOKIE, String(until), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: BASE_PATH,
    // 障害が終わった後は不要なので、短い期限で自動的に消す
    maxAge: 60,
  })
  return { until }
}
