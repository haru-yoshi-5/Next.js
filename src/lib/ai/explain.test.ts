import { ApiError } from "@google/genai"
import { describe, expect, it, vi } from "vitest"

import type { AiConfig, AiConfigResult } from "./config"
import { buildCacheKey, type ExplainDeps, handleExplain } from "./explain"
import { classifyGeminiError, type AnswerGenerator } from "./gemini"
import { type AiStore, createMemoryStore } from "./store"

const config: AiConfig = {
  apiKey: "secret-api-key-value",
  model: "test-model",
  dailyCap: 20,
  perSourceDailyCap: 3,
  hashSecret: "h".repeat(32),
  redis: null,
}

const NOW = new Date("2026-11-11T03:00:00Z")

function makeRequest(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost/api/ai/explain", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

const validBody = {
  lessonId: "server-components",
  mode: "context_tutor",
  question: "ここでなぜサーバー処理を使うのですか？",
}

function setup(overrides: Partial<ExplainDeps> & { store?: AiStore } = {}) {
  const generate = vi.fn<AnswerGenerator["generate"]>().mockResolvedValue({
    ok: true,
    text: "サーバーでデータを取得すると、ブラウザに送る JavaScript を減らせます。",
  })
  const store = overrides.store ?? createMemoryStore(() => NOW.getTime())
  const log = vi.fn()
  const deps: ExplainDeps = {
    config: { status: "ready", config },
    isProduction: false,
    getStore: () => store,
    getGenerator: () => ({ generate }),
    now: () => NOW,
    log,
    ...overrides,
  }
  return { deps, generate, store, log }
}

async function call(deps: ExplainDeps, request = makeRequest(validBody)) {
  const response = await handleExplain(request, deps)
  return { response, body: await response.json() }
}

describe("handleExplain: 成功", () => {
  it("回答・サーバーで決めた参照先・注意書きを返し、Gemini を 1 回だけ呼ぶ", async () => {
    const { deps, generate } = setup()
    const { response, body } = await call(deps)

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    expect(body).toMatchObject({ status: "ok", cached: false })
    expect(body.answer).toContain("サーバー")
    expect(body.notice).toContain("AI が生成した解説")
    expect(body.references[0]).toEqual({
      slug: "server-components",
      title: "Server Components",
      href: "/learn/server-components",
    })
    expect(generate).toHaveBeenCalledTimes(1)

    // システム指示と、区切られた教材の内容・質問を渡す
    const input = generate.mock.calls[0][0]
    expect(input.systemInstruction).toContain("NextScope")
    expect(input.prompt).toContain("<lesson_context>")
    expect(input.prompt).toContain(validBody.question)
  })

  it("匿名 Cookie がなければ、HttpOnly の Cookie を発行する", async () => {
    const { deps } = setup()
    const { response } = await call(deps)
    expect(response.headers.get("Set-Cookie")).toMatch(
      /^nextscope_ai_sid=.+HttpOnly/,
    )
  })

  it("同じ教材・同じ質問はキャッシュから返し、Gemini を呼ばない", async () => {
    const { deps, generate } = setup()
    await call(deps)
    const second = await call(
      deps,
      makeRequest({ ...validBody, question: `  ${validBody.question}  ` }),
    )
    expect(second.body).toMatchObject({ status: "ok", cached: true })
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it("同じ質問を生成中の要求は、利用枠と Gemini を消費せずに 409 を返す", async () => {
    const { deps, generate, store } = setup()
    const consumeQuota = vi.spyOn(store, "consumeQuota")
    const started = Promise.withResolvers<void>()
    const answer = Promise.withResolvers<Awaited<ReturnType<typeof generate>>>()
    generate.mockImplementationOnce(() => {
      started.resolve()
      return answer.promise
    })

    const first = call(deps)
    await started.promise
    const duplicate = await call(deps)
    answer.resolve({ ok: true, text: "回答" })

    expect(duplicate.response.status).toBe(409)
    expect(duplicate.body.code).toBe("generation_in_progress")
    expect((await first).response.status).toBe(200)
    expect((await call(deps)).body.cached).toBe(true)
    expect(consumeQuota).toHaveBeenCalledTimes(1)
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it("ロック取得後にキャッシュが見つかれば、利用枠を消費せずに返す", async () => {
    const { deps, generate, store } = setup()
    const consumeQuota = vi.spyOn(store, "consumeQuota")
    const releaseLock = vi.spyOn(store, "releaseGenerationLock")
    vi.spyOn(store, "getCachedAnswer")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ answer: "先に保存された回答", references: [] })

    const { response, body } = await call(deps)
    expect(response.status).toBe(200)
    expect(body).toMatchObject({ cached: true, answer: "先に保存された回答" })
    expect(consumeQuota).not.toHaveBeenCalled()
    expect(generate).not.toHaveBeenCalled()
    expect(releaseLock).toHaveBeenCalledTimes(1)
  })

  it("教材・質問・モデルが違えば、キャッシュのキーも違う", () => {
    const base = {
      model: "m",
      mode: "context_tutor",
      lessonId: "server-components",
      question: "質問",
    }
    const key = buildCacheKey(base)
    expect(buildCacheKey({ ...base, question: " 質問 " })).toBe(key)
    expect(buildCacheKey({ ...base, lessonId: "client-components" })).not.toBe(
      key,
    )
    expect(buildCacheKey({ ...base, question: "別の質問" })).not.toBe(key)
    expect(buildCacheKey({ ...base, model: "other" })).not.toBe(key)
    expect(key).not.toContain("質問")
  })

  it("大文字・小文字や空白の数が違うコードの質問は、別のキーにする", () => {
    const base = {
      model: "m",
      mode: "context_tutor",
      lessonId: "route-handlers",
      question: "export function GET() は有効ですか？",
    }
    const key = buildCacheKey(base)
    expect(
      buildCacheKey({
        ...base,
        question: "export function get() は有効ですか？",
      }),
    ).not.toBe(key)
    expect(
      buildCacheKey({
        ...base,
        question: "export  function GET() は有効ですか？",
      }),
    ).not.toBe(key)
  })

  it("API キーを応答とログに出さない", async () => {
    const { deps, log } = setup()
    const { body } = await call(deps)
    expect(JSON.stringify(body)).not.toContain(config.apiKey)
    expect(JSON.stringify(log.mock.calls)).not.toContain(config.apiKey)
    // 質問の本文もログに出さない
    expect(JSON.stringify(log.mock.calls)).not.toContain(validBody.question)
  })
})

describe("handleExplain: 使えないとき（Gemini を呼ばない）", () => {
  it.each<[string, AiConfigResult]>([
    ["無効", { status: "disabled" }],
    ["未設定", { status: "unconfigured", problems: ["GEMINI_API_KEY"] }],
  ])("%s なら 503", async (_label, aiConfig) => {
    const { deps, generate } = setup({ config: aiConfig })
    const { response, body } = await call(deps)
    expect(response.status).toBe(503)
    expect(body).toMatchObject({ status: "error", code: "disabled" })
    expect(generate).not.toHaveBeenCalled()
  })

  it.each([
    ["日本以外", { "x-vercel-ip-country": "US" }],
    ["国コードなし", {}],
    ["不正な国コード", { "x-vercel-ip-country": "jp" }],
  ])("本番で%sなら 403", async (_label, headers) => {
    const { deps, generate } = setup({ isProduction: true })
    const { response, body } = await call(deps, makeRequest(validBody, headers))
    expect(response.status).toBe(403)
    expect(body.code).toBe("region_not_supported")
    expect(generate).not.toHaveBeenCalled()
  })

  it("本番で日本からなら受け付ける", async () => {
    const { deps } = setup({ isProduction: true })
    const { response } = await call(
      deps,
      makeRequest(validBody, { "x-vercel-ip-country": "JP" }),
    )
    expect(response.status).toBe(200)
  })

  it("大きすぎる本文は 413", async () => {
    const { deps, generate } = setup()
    const { response } = await call(
      deps,
      makeRequest({ ...validBody, question: "a".repeat(5000) }),
    )
    expect(response.status).toBe(413)
    expect(generate).not.toHaveBeenCalled()
  })

  it("存在しない教材 ID は 400", async () => {
    const { deps, generate } = setup()
    const { response, body } = await call(
      deps,
      makeRequest({ ...validBody, lessonId: "no-such-lesson" }),
    )
    expect(response.status).toBe(400)
    expect(body.code).toBe("invalid_request")
    expect(generate).not.toHaveBeenCalled()
  })

  it("個人情報らしい内容を含む質問は 400 で、送信しない", async () => {
    const { deps, generate } = setup()
    const { response, body } = await call(
      deps,
      makeRequest({
        ...validBody,
        question: "私のメールは a@example.com です",
      }),
    )
    expect(response.status).toBe(400)
    expect(body.code).toBe("sensitive_content")
    expect(generate).not.toHaveBeenCalled()
  })
})

describe("handleExplain: 利用制限", () => {
  it("送信元ごとの上限に達したら 429 と Retry-After（日本時間 0 時まで）", async () => {
    const { deps, generate } = setup({
      config: { status: "ready", config: { ...config, perSourceDailyCap: 1 } },
    })
    const first = await call(deps)
    const cookie = first.response.headers.get("Set-Cookie")!.split(";")[0]

    const { response, body } = await call(
      deps,
      makeRequest({ ...validBody, question: "別の質問です" }, { cookie }),
    )
    expect(response.status).toBe(429)
    expect(body.code).toBe("rate_limited")
    // 2026-11-11T03:00Z（日本時間 12:00）から日本時間 0 時まで 12 時間
    expect(response.headers.get("Retry-After")).toBe(String(12 * 60 * 60))
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it("IP アドレスを変えても、同じ Cookie なら Cookie の上限で止まる", async () => {
    const { deps, generate } = setup({
      config: { status: "ready", config: { ...config, perSourceDailyCap: 1 } },
      isProduction: true,
    })
    const jp = { "x-vercel-ip-country": "JP" }
    const first = await call(
      deps,
      makeRequest(validBody, { ...jp, "x-real-ip": "1.1.1.1" }),
    )
    const cookie = first.response.headers.get("Set-Cookie")!.split(";")[0]
    const { response } = await call(
      deps,
      makeRequest(
        { ...validBody, question: "別の質問です" },
        { ...jp, "x-real-ip": "2.2.2.2", cookie },
      ),
    )
    expect(response.status).toBe(429)
    // 同じ Cookie を使い続けているため、新しい Cookie は発行しない
    expect(response.headers.get("Set-Cookie")).toBeNull()
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it("Cookie を作り直しても、IP アドレスの上限で止まる", async () => {
    const { deps, generate } = setup({
      config: { status: "ready", config: { ...config, perSourceDailyCap: 1 } },
    })
    await call(deps)
    // Cookie を付けずに送る（新しい Cookie が発行される）。開発中の IP は "local" で共通
    const { response } = await call(
      deps,
      makeRequest({ ...validBody, question: "別の質問です" }),
    )
    expect(response.status).toBe(429)
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it("サイト全体の上限に達したら、別の送信元でも 429", async () => {
    const { deps } = setup({
      config: { status: "ready", config: { ...config, dailyCap: 1 } },
      isProduction: true,
    })
    const jp = { "x-vercel-ip-country": "JP" }
    await call(deps, makeRequest(validBody, { ...jp, "x-real-ip": "1.1.1.1" }))
    const { response, body } = await call(
      deps,
      makeRequest(
        { ...validBody, question: "別の質問です" },
        { ...jp, "x-real-ip": "2.2.2.2" },
      ),
    )
    expect(response.status).toBe(429)
    expect(body.message).toContain("サイト全体")
  })

  it.each([
    ["キャッシュの読み込み", "getCachedAnswer"],
    ["生成ロックの取得", "acquireGenerationLock"],
    ["利用制限の確認", "consumeQuota"],
  ] as const)(
    "保存先の障害（%s）では 503 で止め、Gemini を呼ばない",
    async (_label, method) => {
      const store = createMemoryStore(() => NOW.getTime())
      store[method] = vi.fn().mockRejectedValue(new Error("down"))
      const { deps, generate } = setup({ store })
      const { response, body } = await call(deps)
      expect(response.status).toBe(503)
      expect(body.code).toBe("store_unavailable")
      expect(generate).not.toHaveBeenCalled()
    },
  )

  it("キャッシュに保存できなくても、回答は返す", async () => {
    const store = createMemoryStore(() => NOW.getTime())
    store.setCachedAnswer = vi.fn().mockRejectedValue(new Error("down"))
    const { deps } = setup({ store })
    const { response } = await call(deps)
    expect(response.status).toBe(200)
  })

  it("ロックを解放できなくても、生成した回答は返す", async () => {
    const { deps, store } = setup()
    vi.spyOn(store, "releaseGenerationLock").mockRejectedValue(
      new Error("down"),
    )
    const { response } = await call(deps)
    expect(response.status).toBe(200)
  })
})

describe("handleExplain: Gemini の失敗", () => {
  it("生成に失敗してもロックを解放し、同じ質問を再送できる", async () => {
    const { deps, generate } = setup()
    generate.mockResolvedValueOnce({ ok: false, reason: "timeout" })
    expect((await call(deps)).response.status).toBe(504)
    expect((await call(deps)).response.status).toBe(200)
    expect(generate).toHaveBeenCalledTimes(2)
  })

  it.each([
    ["timeout", 504, "timeout"],
    ["rate_limited", 429, "upstream_rate_limited"],
    ["model_unavailable", 503, "model_unavailable"],
    ["no_answer", 502, "no_answer"],
    ["upstream_error", 502, "upstream_error"],
  ] as const)(
    "%s は %i（%s）を返し、再試行しない",
    async (reason, status, code) => {
      const { deps, generate } = setup()
      generate.mockResolvedValue({ ok: false, reason })
      const { response, body } = await call(deps)
      expect(response.status).toBe(status)
      expect(body.code).toBe(code)
      expect(generate).toHaveBeenCalledTimes(1)
    },
  )

  it("Gemini の HTTP ステータスだけをログに残す", async () => {
    const { deps, generate, log } = setup()
    generate.mockResolvedValue({
      ok: false,
      reason: "model_unavailable",
      upstreamStatus: 400,
    })
    await call(deps)
    expect(log).toHaveBeenLastCalledWith(
      expect.objectContaining({
        outcome: "model_unavailable",
        upstreamStatus: 400,
      }),
    )
  })

  it("SDK のエラーを分類する", () => {
    const live = new AbortController().signal
    const aborted = AbortSignal.abort()
    const apiError = (status: number) =>
      new ApiError({ message: "error", status })

    expect(classifyGeminiError(new Error("x"), aborted)).toEqual({
      ok: false,
      reason: "timeout",
    })
    expect(classifyGeminiError(apiError(429), live)).toMatchObject({
      reason: "rate_limited",
    })
    expect(classifyGeminiError(apiError(404), live)).toMatchObject({
      reason: "model_unavailable",
    })
    // モデル名に表示名（「Gemini 2.5 Flash」）を指定すると 400 が返る
    expect(classifyGeminiError(apiError(400), live)).toEqual({
      ok: false,
      reason: "model_unavailable",
      upstreamStatus: 400,
    })
    expect(classifyGeminiError(apiError(500), live)).toEqual({
      ok: false,
      reason: "upstream_error",
      upstreamStatus: 500,
    })
    expect(classifyGeminiError(new Error("network"), live)).toMatchObject({
      reason: "upstream_error",
    })
  })
})
