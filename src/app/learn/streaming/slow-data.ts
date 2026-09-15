import "server-only"

import { cache } from "react"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * リクエストの開始時刻。React の cache() により、同じリクエスト内では
 * どのコンポーネントから呼んでも同じ値を返す（リクエストをまたいでは共有しない）。
 */
export const getRequestStart = cache(() => performance.now())

/** リクエスト開始からの経過時間（ms） */
export function elapsedSince(start: number) {
  return performance.now() - start
}

export async function getProfile() {
  await wait(1000)
  return {
    name: "Aoi Tanaka",
    role: "Frontend Engineer",
    location: "Tokyo",
  }
}

export async function getActivities() {
  await wait(2000)
  return [
    { id: "a1", text: "server-actions の教材を更新", when: "3分前" },
    { id: "a2", text: "Streaming のデモにコメント", when: "18分前" },
    { id: "a3", text: "App Router の layout を修正", when: "1時間前" },
  ]
}
