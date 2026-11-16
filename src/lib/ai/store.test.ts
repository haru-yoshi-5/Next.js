import { describe, expect, it, vi } from "vitest"

import {
  CONSUME_QUOTA_SCRIPT,
  createMemoryStore,
  createRedisStore,
  parseCachedAnswer,
  parseQuotaResult,
  RELEASE_GENERATION_LOCK_SCRIPT,
  type RedisLike,
} from "./store"

const entries = [
  { key: "global", limit: 2 },
  { key: "ip", limit: 1 },
]

describe("メモリの保存先（開発用）", () => {
  it("すべてが上限未満なら増やして許可し、どれかが上限なら何も増やさずに断る", async () => {
    const store = createMemoryStore(() => 0)
    const expireAt = 3600

    expect(await store.consumeQuota(entries, expireAt)).toEqual({
      allowed: true,
    })
    // ip が上限（1）に達したため断る。global は増えない
    expect(await store.consumeQuota(entries, expireAt)).toEqual({
      allowed: false,
      index: 1,
    })
    // ip を含まなければ、global はまだ 1 回だけ使える
    expect(await store.consumeQuota([entries[0]], expireAt)).toEqual({
      allowed: true,
    })
    expect(await store.consumeQuota([entries[0]], expireAt)).toEqual({
      allowed: false,
      index: 0,
    })
  })

  it("有効期限を過ぎた数は 0 に戻る", async () => {
    let now = 0
    const store = createMemoryStore(() => now)
    await store.consumeQuota([entries[1]], 10)
    expect(await store.consumeQuota([entries[1]], 10)).toMatchObject({
      allowed: false,
    })
    now = 10_000
    expect(await store.consumeQuota([entries[1]], 20)).toEqual({
      allowed: true,
    })
  })

  it("キャッシュは保存期間を過ぎると消える", async () => {
    let now = 0
    const store = createMemoryStore(() => now)
    const value = { answer: "回答", references: [] }
    await store.setCachedAnswer("k", value, 60)
    expect(await store.getCachedAnswer("k")).toEqual(value)
    now = 61_000
    expect(await store.getCachedAnswer("k")).toBeNull()
  })

  it("期限切れ後に取得したロックは、新しい所有者だけが解放できる", async () => {
    let now = 0
    const store = createMemoryStore(() => now)
    const first = await store.acquireGenerationLock("k", 10)
    expect(first).toBeTypeOf("string")
    expect(await store.acquireGenerationLock("k", 10)).toBeNull()

    now = 10_000
    const second = await store.acquireGenerationLock("k", 10)
    expect(second).toBeTypeOf("string")
    expect(second).not.toBe(first)
    await store.releaseGenerationLock("k", first!)
    expect(await store.acquireGenerationLock("k", 10)).toBeNull()

    await store.releaseGenerationLock("k", second!)
    expect(await store.acquireGenerationLock("k", 10)).toBeTypeOf("string")
  })
})

describe("Redis の保存先", () => {
  function fakeClient(evalResult: unknown): RedisLike {
    return {
      eval: vi.fn().mockResolvedValue(evalResult),
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue("OK"),
    }
  }

  it("Lua スクリプトに、キー・固定の有効期限・各キーの上限を渡す", async () => {
    const client = fakeClient([1, 0])
    const store = createRedisStore(client)
    expect(await store.consumeQuota(entries, 1_800_000_000)).toEqual({
      allowed: true,
    })
    expect(client.eval).toHaveBeenCalledWith(
      CONSUME_QUOTA_SCRIPT,
      ["global", "ip"],
      [1_800_000_000, 2, 1],
    )
  })

  it("Lua スクリプトは確認と増加を 1 回で行い、期限は EXPIREAT で固定する", () => {
    expect(CONSUME_QUOTA_SCRIPT).toContain("INCR")
    expect(CONSUME_QUOTA_SCRIPT).toContain("EXPIREAT")
    expect(CONSUME_QUOTA_SCRIPT).not.toMatch(/\bEXPIRE\b/)
  })

  it("断られたときは、上限に達したキーの位置を返す", async () => {
    const store = createRedisStore(fakeClient([0, 2]))
    expect(await store.consumeQuota(entries, 1)).toEqual({
      allowed: false,
      index: 1,
    })
  })

  it("保存先のエラーは、そのまま例外にする（呼び出し側で止める）", async () => {
    const client = fakeClient(null)
    client.eval = vi.fn().mockRejectedValue(new Error("network"))
    await expect(
      createRedisStore(client).consumeQuota(entries, 1),
    ).rejects.toThrow()
  })

  it("期限と NX を指定して取得し、解放は所有トークンの照合と削除を同じ操作で行う", async () => {
    const client = fakeClient(1)
    vi.mocked(client.set)
      .mockResolvedValueOnce("OK")
      .mockResolvedValueOnce(null)
    const store = createRedisStore(client)

    const token = await store.acquireGenerationLock("k", 40)
    expect(token).toBeTypeOf("string")
    expect(client.set).toHaveBeenCalledWith("k:generation-lock", token, {
      ex: 40,
      nx: true,
    })
    expect(await store.acquireGenerationLock("k", 40)).toBeNull()

    await store.releaseGenerationLock("k", token!)
    expect(client.eval).toHaveBeenCalledWith(
      RELEASE_GENERATION_LOCK_SCRIPT,
      ["k:generation-lock"],
      [token],
    )
    expect(RELEASE_GENERATION_LOCK_SCRIPT).toMatch(
      /if redis\.call\('GET', KEYS\[1\]\) == ARGV\[1\] then\s+return redis\.call\('DEL', KEYS\[1\]\)/,
    )
  })

  it.each([null, "OK", [1], [1, 1], [0, 0], [0, 3], ["1", "0"]])(
    "想定外の戻り値 %j は許可しない（例外にする）",
    (raw) => {
      expect(() => parseQuotaResult(raw, 2)).toThrow()
    },
  )

  it("キャッシュは文字列で保存し、読むときに形を確かめる", async () => {
    const client = fakeClient([1, 0])
    const store = createRedisStore(client)
    const value = { answer: "回答", references: [] }
    await store.setCachedAnswer("k", value, 60)
    expect(client.set).toHaveBeenCalledWith("k", JSON.stringify(value), {
      ex: 60,
    })

    expect(parseCachedAnswer(JSON.stringify(value))).toEqual(value)
    expect(parseCachedAnswer("壊れた値")).toBeNull()
    expect(parseCachedAnswer(JSON.stringify({ answer: 1 }))).toBeNull()
    expect(parseCachedAnswer({ answer: "a", references: [] })).toBeNull()
  })
})
