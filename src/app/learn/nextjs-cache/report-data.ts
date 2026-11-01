import "server-only"

import { cacheLife } from "next/cache"

import { measure } from "@/lib/measure"

export interface CacheReport {
  /** 関数本体が実行されるたびに変わる ID */
  id: string
  /** 関数本体が実行された時刻（エポックミリ秒） */
  generatedAt: number
}

export interface ReportRead {
  report: CacheReport
  durationMs: number
  /** 受け取った結果が、読み取りを始める前に生成されていたか */
  generatedBeforeRead: boolean
}

/** データベースや外部 API の代わりとなる、時間のかかる処理 */
async function buildReport(): Promise<CacheReport> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return { id: crypto.randomUUID().slice(0, 8), generatedAt: Date.now() }
}

/** キャッシュなし: 呼ばれるたびに本体が実行される */
export async function getFreshReport() {
  return buildReport()
}

/**
 * キャッシュあり: 結果をサーバーインスタンスの外に保存し、全員で共有する。
 * Vercel では通常の "use cache" が実行時にほぼ再利用されなかったため（教材本文を参照）、
 * "use cache: remote" を使っている。
 */
export async function getCachedReport() {
  "use cache: remote"
  cacheLife({ stale: 30, revalidate: 60, expire: 120 })

  return buildReport()
}

/**
 * レポートを読み取り、結果が読み取り開始より前に生成されていたかを判定する。
 * 速さは判定に使わない。裏側の再生成が同時に動いている場合もあるので、
 * 分かるのは「受け取った結果がいつ作られたか」までで、本体の実行の有無は断定しない。
 */
export async function readReport(
  read: () => Promise<CacheReport>,
): Promise<ReportRead> {
  const startedAt = Date.now()
  const { result: report, durationMs } = await measure(read)
  return {
    report,
    durationMs,
    generatedBeforeRead: report.generatedAt < startedAt,
  }
}
