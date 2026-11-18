import "server-only"

import { randomUUID } from "node:crypto"

import { Redis } from "@upstash/redis"

export interface QuotaEntry {
  key: string
  limit: number
}

export type QuotaResult =
  | { allowed: true }
  /** index は、上限に達した entries の位置 */
  | { allowed: false; index: number }

export interface CachedAnswer {
  answer: string
  references: { slug: string; title: string; href: string }[]
}

/**
 * 利用制限とキャッシュの保存先。
 * どのメソッドも、保存先が使えないときは例外を投げる（呼び出し側で AI を止める）。
 */
export interface AiStore {
  /**
   * すべての entries が上限未満なら、すべてを 1 ずつ増やして許可する。
   * どれかが上限に達していれば、何も増やさずに断る。確認と増加は 1 回の操作で行う。
   */
  consumeQuota(
    entries: QuotaEntry[],
    expireAtSeconds: number,
  ): Promise<QuotaResult>
  getCachedAnswer(key: string): Promise<CachedAnswer | null>
  setCachedAnswer(
    key: string,
    value: CachedAnswer,
    ttlSeconds: number,
  ): Promise<void>
  acquireGenerationLock(key: string, ttlSeconds: number): Promise<string | null>
  releaseGenerationLock(key: string, token: string): Promise<void>
}

/** キャッシュとして読んだ値の形を確かめる（壊れた値は使わない） */
export function parseCachedAnswer(raw: unknown): CachedAnswer | null {
  if (typeof raw !== "string") return null
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof value !== "object" || value === null) return null
  const { answer, references } = value as Record<string, unknown>
  if (typeof answer !== "string" || !Array.isArray(references)) return null
  const valid = references.every(
    (reference) =>
      typeof reference === "object" &&
      reference !== null &&
      typeof reference.slug === "string" &&
      typeof reference.title === "string" &&
      typeof reference.href === "string",
  )
  return valid ? { answer, references } : null
}

/**
 * 上限の確認と増加を 1 回の操作で行う Lua スクリプト。
 * Redis は Lua スクリプトを、ほかのコマンドに割り込まれずに実行する。
 * 有効期限は固定の時刻（EXPIREAT）で付け、呼ぶたびに延びないようにする。
 * KEYS: 数えるキー / ARGV[1]: 有効期限（UNIX 秒）/ ARGV[2..]: 各キーの上限
 */
export const CONSUME_QUOTA_SCRIPT = `
for i = 1, #KEYS do
  local current = tonumber(redis.call('GET', KEYS[i]) or '0')
  if current >= tonumber(ARGV[i + 1]) then
    return {0, i}
  end
end
for i = 1, #KEYS do
  redis.call('INCR', KEYS[i])
  redis.call('EXPIREAT', KEYS[i], ARGV[1])
end
return {1, 0}
`

export const RELEASE_GENERATION_LOCK_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`

/** Lua スクリプトの戻り値を確かめる。想定外の形なら例外にする（許可しない） */
export function parseQuotaResult(
  raw: unknown,
  entryCount: number,
): QuotaResult {
  if (
    Array.isArray(raw) &&
    raw.length === 2 &&
    raw.every((value) => typeof value === "number")
  ) {
    const [allowed, index] = raw as [number, number]
    if (allowed === 1 && index === 0) return { allowed: true }
    if (allowed === 0 && index >= 1 && index <= entryCount) {
      return { allowed: false, index: index - 1 }
    }
  }
  throw new Error("利用制限の結果を読み取れませんでした")
}

/** @upstash/redis のうち、このモジュールが使う部分 */
export interface RedisLike {
  eval(script: string, keys: string[], args: unknown[]): Promise<unknown>
  get(key: string): Promise<unknown>
  set(
    key: string,
    value: string,
    options: { ex: number } & ({ nx?: never } | { nx: true }),
  ): Promise<unknown>
}

/** 保存先へのリクエストを待つ最大の時間（ミリ秒） */
const REDIS_TIMEOUT_MS = 3000

export function createUpstashClient(url: string, token: string): RedisLike {
  return new Redis({
    url,
    token,
    // 再試行すると、数え直しで二重に増えることがあるため行わない
    retry: false,
    // 値は文字列のまま受け取り、形はこちらで確かめる
    automaticDeserialization: false,
    signal: () => AbortSignal.timeout(REDIS_TIMEOUT_MS),
  })
}

export function createRedisStore(client: RedisLike): AiStore {
  return {
    async consumeQuota(entries, expireAtSeconds) {
      const raw = await client.eval(
        CONSUME_QUOTA_SCRIPT,
        entries.map((entry) => entry.key),
        [expireAtSeconds, ...entries.map((entry) => entry.limit)],
      )
      return parseQuotaResult(raw, entries.length)
    },
    async getCachedAnswer(key) {
      return parseCachedAnswer(await client.get(key))
    },
    async setCachedAnswer(key, value, ttlSeconds) {
      await client.set(key, JSON.stringify(value), { ex: ttlSeconds })
    },
    async acquireGenerationLock(key, ttlSeconds) {
      const token = randomUUID()
      const result = await client.set(`${key}:generation-lock`, token, {
        ex: ttlSeconds,
        nx: true,
      })
      if (result === "OK") return token
      if (result === null) return null
      throw new Error("生成ロックの取得結果を読み取れませんでした")
    },
    async releaseGenerationLock(key, token) {
      await client.eval(
        RELEASE_GENERATION_LOCK_SCRIPT,
        [`${key}:generation-lock`],
        [token],
      )
    },
  }
}

/**
 * 開発中だけ使う、メモリ上の保存先。
 * サーバーレスの本番ではインスタンスをまたいで共有されないため使わない（config.ts で防ぐ）。
 */
export function createMemoryStore(now: () => number = Date.now): AiStore {
  const counters = new Map<string, { count: number; expireAtMs: number }>()
  const cache = new Map<string, { value: string; expireAtMs: number }>()
  const locks = new Map<string, { token: string; expireAtMs: number }>()

  function readCounter(key: string) {
    const entry = counters.get(key)
    if (!entry || entry.expireAtMs <= now()) return 0
    return entry.count
  }

  return {
    async consumeQuota(entries, expireAtSeconds) {
      const index = entries.findIndex(
        (entry) => readCounter(entry.key) >= entry.limit,
      )
      if (index !== -1) return { allowed: false, index }
      for (const entry of entries) {
        counters.set(entry.key, {
          count: readCounter(entry.key) + 1,
          expireAtMs: expireAtSeconds * 1000,
        })
      }
      return { allowed: true }
    },
    async getCachedAnswer(key) {
      const entry = cache.get(key)
      if (!entry || entry.expireAtMs <= now()) return null
      return parseCachedAnswer(entry.value)
    },
    async setCachedAnswer(key, value, ttlSeconds) {
      cache.set(key, {
        value: JSON.stringify(value),
        expireAtMs: now() + ttlSeconds * 1000,
      })
    },
    async acquireGenerationLock(key, ttlSeconds) {
      const currentTime = now()
      const lock = locks.get(key)
      if (lock && lock.expireAtMs > currentTime) return null
      const token = randomUUID()
      locks.set(key, { token, expireAtMs: currentTime + ttlSeconds * 1000 })
      return token
    },
    async releaseGenerationLock(key, token) {
      if (locks.get(key)?.token === token) locks.delete(key)
    },
  }
}
