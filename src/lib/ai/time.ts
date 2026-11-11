import "server-only"

/** 日本時間は UTC+9（夏時間なし） */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/** 日本時間の日付（YYYY-MM-DD）。利用制限のキーに使う */
export function jstDateKey(now: Date) {
  return new Date(now.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10)
}

/** 次の日本時間 0 時の時刻（UNIX 秒）。jstDateKey と同じ now から計算する */
export function nextJstMidnightSeconds(now: Date) {
  const jstMs = now.getTime() + JST_OFFSET_MS
  const nextJstMidnightMs = (Math.floor(jstMs / DAY_MS) + 1) * DAY_MS
  return Math.floor((nextJstMidnightMs - JST_OFFSET_MS) / 1000)
}

/** 次の日本時間 0 時までの秒数（Retry-After に使う。最低 1 秒） */
export function secondsUntilNextJstMidnight(now: Date) {
  return Math.max(
    1,
    nextJstMidnightSeconds(now) - Math.floor(now.getTime() / 1000),
  )
}
