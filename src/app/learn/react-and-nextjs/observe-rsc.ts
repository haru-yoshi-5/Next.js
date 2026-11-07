/**
 * router.refresh() の間に記録された「RSC Payload の取得の候補」を、Resource Timing で集める。
 *
 * Resource Timing ではリクエストヘッダー（RSC: 1）を読めないため、次の条件で絞った候補として扱う。
 * - このページと同じ origin・同じ pathname
 * - Next.js がキャッシュ対策に付ける `_rsc` 検索パラメーターがある
 * - 観測を始めた時刻より後に始まった
 * prefetch など、ほかの取得が混ざる可能性はある。
 *
 * performance.getEntriesByType() の保存済み一覧は上限に達すると新しい記録が残らないため、
 * 操作の直前に PerformanceObserver を登録し、その操作の間に記録されたものだけを集める。
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
  /** このブラウザで観測できたか（PerformanceObserver が使えないと false） */
  observed: boolean
  /** 観測期間内に記録された候補（始まった順）。router.refresh() 1回で複数になることがある */
  candidates: RscCandidate[]
  /** 候補のうち最も長い取得時間。並行して取得されるため合計はしない */
  longestMs: number | null
}

export interface RscObserver {
  /** 観測期間を締め切り、集めた候補を返す。何度呼んでも同じ結果を返す */
  stop: () => Promise<RscObservation>
  /** 結果を待たずに観測をやめる。アンマウント時に使う。stop() の結果は返らなくなる */
  dispose: () => void
}

/** 画面への反映が終わってから、同時に始まった取得が記録されるまで待つ時間 */
const SETTLE_MS = 800

function isCandidate(
  entry: PerformanceEntry,
  since: number,
): entry is PerformanceResourceTiming {
  if (!(entry instanceof PerformanceResourceTiming)) return false
  if (entry.startTime < since) return false
  const url = new URL(entry.name)
  return (
    url.origin === window.location.origin &&
    url.pathname === window.location.pathname &&
    url.searchParams.has("_rsc")
  )
}

function toCandidate(entry: PerformanceResourceTiming): RscCandidate {
  return {
    fetchMs:
      entry.responseEnd > 0
        ? Math.round(entry.responseEnd - entry.startTime)
        : null,
    encodedBytes: entry.encodedBodySize > 0 ? entry.encodedBodySize : null,
    decodedBytes: entry.decodedBodySize > 0 ? entry.decodedBodySize : null,
  }
}

function toObservation(
  observed: boolean,
  entries: PerformanceResourceTiming[],
): RscObservation {
  const candidates = [...entries]
    .sort((a, b) => a.startTime - b.startTime)
    .map(toCandidate)
  const times = candidates
    .map((candidate) => candidate.fetchMs)
    .filter((ms): ms is number => ms !== null)

  return {
    observed,
    candidates,
    longestMs: times.length > 0 ? Math.max(...times) : null,
  }
}

function canObserveResources() {
  return (
    typeof PerformanceObserver !== "undefined" &&
    PerformanceObserver.supportedEntryTypes.includes("resource")
  )
}

/** 操作の直前に呼ぶ。stop() で締め切るまでに記録された候補を集める */
export function startRscObserver(): RscObserver {
  const since = performance.now()

  if (!canObserveResources()) {
    const result = Promise.resolve(toObservation(false, []))
    return { stop: () => result, dispose: () => {} }
  }

  const entries: PerformanceResourceTiming[] = []
  const collect = (list: PerformanceEntry[]) => {
    for (const entry of list) {
      if (isCandidate(entry, since)) entries.push(entry)
    }
  }
  const observer = new PerformanceObserver((list) => collect(list.getEntries()))
  observer.observe({ type: "resource" })

  let result: Promise<RscObservation> | null = null
  let settleTimer: ReturnType<typeof setTimeout> | undefined
  return {
    stop: () => {
      result ??= new Promise((resolve) => {
        settleTimer = setTimeout(() => {
          collect(observer.takeRecords())
          observer.disconnect()
          resolve(toObservation(true, entries))
        }, SETTLE_MS)
      })
      return result
    },
    dispose: () => {
      clearTimeout(settleTimer)
      observer.disconnect()
      entries.length = 0
    },
  }
}

export function formatBytes(bytes: number | null) {
  if (bytes === null) return "取得できず"
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}
