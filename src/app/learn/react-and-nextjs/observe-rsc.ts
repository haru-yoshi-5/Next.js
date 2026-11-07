/**
 * router.refresh() の後に記録された「RSC Payload の取得の候補」を、Resource Timing から探す。
 *
 * Resource Timing ではリクエストヘッダー（RSC: 1）を読めないため、次の条件で絞った候補として扱う。
 * - このページと同じ origin・同じ pathname
 * - Next.js がキャッシュ対策に付ける `_rsc` 検索パラメーターがある
 * - 操作を始めた時刻より後に始まった
 * prefetch など、ほかの取得が混ざる可能性はある。
 */
export interface RscCandidate {
  /** 取得時間（responseEnd - startTime）。取れなければ null */
  fetchMs: number | null
  /** 圧縮された本文サイズ。0 は「公開されていない」ことがあるため null にする */
  encodedBytes: number | null
  /** 展開後の本文サイズ */
  decodedBytes: number | null
}

export interface RscObservation {
  /** 見つかった候補（始まった順）。router.refresh() 1回で複数になることがある */
  candidates: RscCandidate[]
  /** 候補のうち最も長い取得時間。並行して取得されるため合計はしない */
  longestMs: number | null
}

/** 応答を読み終えて記録されるまで、少し待つ */
const WAIT_MS = 1500
const POLL_MS = 100

function findCandidates(since: number) {
  return performance
    .getEntriesByType("resource")
    .filter((entry): entry is PerformanceResourceTiming => {
      if (!(entry instanceof PerformanceResourceTiming)) return false
      if (entry.startTime < since) return false
      const url = new URL(entry.name)
      return (
        url.origin === window.location.origin &&
        url.pathname === window.location.pathname &&
        url.searchParams.has("_rsc")
      )
    })
}

function toObservation(entries: PerformanceResourceTiming[]): RscObservation {
  const candidates = entries.map((entry) => ({
    fetchMs:
      entry.responseEnd > 0
        ? Math.round(entry.responseEnd - entry.startTime)
        : null,
    encodedBytes: entry.encodedBodySize > 0 ? entry.encodedBodySize : null,
    decodedBytes: entry.decodedBodySize > 0 ? entry.decodedBodySize : null,
  }))
  const times = candidates
    .map((candidate) => candidate.fetchMs)
    .filter((ms): ms is number => ms !== null)

  return {
    candidates,
    longestMs: times.length > 0 ? Math.max(...times) : null,
  }
}

/** since（performance.now() の値）より後に始まった候補を、記録されるまで待って返す */
export async function observeRscSince(since: number): Promise<RscObservation> {
  const deadline = performance.now() + WAIT_MS
  let entries = findCandidates(since)
  while (entries.length === 0 && performance.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS))
    entries = findCandidates(since)
  }
  return toObservation(entries)
}

export function formatBytes(bytes: number | null) {
  if (bytes === null) return "取得できず"
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}
