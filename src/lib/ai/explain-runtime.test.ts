import { describe, expect, it, vi } from "vitest"

import { buildActionTrace } from "@/app/learn/server-actions/action-trace"
import { summarizeTrace, type TraceSummary } from "@/lib/tracing/adapter"

import type { AiConfig } from "./config"
import { type ExplainDeps, handleExplain } from "./explain"
import type { AnswerGenerator } from "./gemini"
import { createSession, SESSION_COOKIE_NAME } from "./identity"
import { createMemoryStore } from "./store"
import { issueTraceToken } from "./trace-token"

const config: AiConfig = {
  apiKey: "secret-api-key-value",
  model: "test-model",
  dailyCap: 20,
  perSourceDailyCap: 3,
  hashSecret: "h".repeat(32),
  redis: null,
}

const NOW = new Date("2026-11-14T03:00:00Z")

const ANSWER = `【観測されたこと】
サーバーで saveName が実行され、データ更新に 251 ms かかりました。
【教材上の説明】
updateTag によって一覧のキャッシュが期限切れになります。
【観測できないこと】
Next.js 内部での再描画の時間は記録されていません。`

const summary = summarizeTrace(
  "server-actions",
  buildActionTrace({
    requestId: "0b6f3a52-6a8e-4c1e-9d7a-2f4b8c9e1a30",
    totalMs: 263,
    outcome: { type: "saved", name: "入力した名前", writeMs: 251 },
  }),
)

function setup(overrides: Partial<AiConfig> = {}) {
  const generate = vi
    .fn<AnswerGenerator["generate"]>()
    .mockResolvedValue({ ok: true, text: ANSWER })
  // 期限切れを確かめるため、時刻を進められるようにする
  let current = NOW
  const store = createMemoryStore(() => current.getTime())
  const deps: ExplainDeps = {
    config: { status: "ready", config: { ...config, ...overrides } },
    isProduction: false,
    getStore: () => store,
    getGenerator: () => ({ generate }),
    now: () => current,
    log: vi.fn(),
  }
  const advance = (ms: number) => {
    current = new Date(current.getTime() + ms)
  }
  return { deps, generate, advance }
}

async function prepare() {
  const session = createSession(config.hashSecret)
  const token = await issueTraceToken({
    secret: config.hashSecret,
    sessionId: session.id,
    summary,
    now: NOW,
  })
  return {
    cookie: `${SESSION_COOKIE_NAME}=${session.cookieValue}`,
    token,
    sessionId: session.id,
  }
}

async function call(
  deps: ExplainDeps,
  body: Record<string, unknown>,
  cookie?: string,
) {
  const response = await handleExplain(
    new Request("http://localhost/api/ai/explain", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      body: JSON.stringify(body),
    }),
    deps,
  )
  return { response, body: await response.json() }
}

function runtimeBody(token: string, trace: TraceSummary = summary) {
  return {
    lessonId: "server-actions",
    mode: "runtime_explain",
    trace,
    traceToken: token,
    browserReport: { roundTripMs: 412 },
  }
}

describe("handleExplain: runtime_explain", () => {
  it("検証済みの記録だけを送り、回答を 3 つの見出しに分けて返す", async () => {
    const { deps, generate } = setup()
    const { cookie, token } = await prepare()
    const { response, body } = await call(deps, runtimeBody(token), cookie)

    expect(response.status).toBe(200)
    expect(body.sections).toEqual({
      observed:
        "サーバーで saveName が実行され、データ更新に 251 ms かかりました。",
      lessonExplanation:
        "updateTag によって一覧のキャッシュが期限切れになります。",
      unobservable: "Next.js 内部での再描画の時間は記録されていません。",
    })
    expect(generate).toHaveBeenCalledTimes(1)

    const { prompt, systemInstruction } = generate.mock.calls[0][0]
    expect(systemInstruction).toContain("【観測されたこと】")
    expect(prompt).toContain("1. [概念] client-component → next-server")
    expect(prompt).toContain("2. [観測] next-server → server-action")
    expect(prompt).toContain("所要時間 251 ms")
    expect(prompt).toContain("412 ms（ブラウザで計測した申告）")
    // 入力した値や、トークンは送らない
    expect(prompt).not.toContain("入力した名前")
    expect(prompt).not.toContain(token)
  })

  it("同じ実行への 2 回目は、キャッシュから返して Gemini を呼ばない", async () => {
    const { deps, generate } = setup()
    const { cookie, token } = await prepare()
    await call(deps, runtimeBody(token), cookie)
    const { body } = await call(deps, runtimeBody(token), cookie)
    expect(body.cached).toBe(true)
    expect(body.sections).not.toBeNull()
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it("匿名 Cookie がなければ 400 で、Cookie を新しく発行しない", async () => {
    const { deps, generate } = setup()
    const { token } = await prepare()
    const { response, body } = await call(deps, runtimeBody(token))
    expect(response.status).toBe(400)
    expect(body.code).toBe("invalid_trace")
    expect(body.message).toContain("ページを読み込み直して")
    expect(response.headers.get("Set-Cookie")).toBeNull()
    expect(generate).not.toHaveBeenCalled()
  })

  it("改ざんされた traceId を拒否し、利用枠も消費しない", async () => {
    const { deps, generate } = setup()
    const { cookie, token } = await prepare()
    const tampered = {
      ...summary,
      traceId: "99999999-6a8e-4c1e-9d7a-2f4b8c9e1a30",
    }
    for (let i = 0; i < 5; i++) {
      const { response, body } = await call(
        deps,
        runtimeBody(token, tampered),
        cookie,
      )
      expect(response.status).toBe(400)
      expect(body.code).toBe("invalid_trace")
    }
    expect(generate).not.toHaveBeenCalled()

    // 拒否が続いても、正しい記録はそのまま使える（枠を消費していない）
    const { response } = await call(deps, runtimeBody(token), cookie)
    expect(response.status).toBe(200)
  })

  it("別の利用者（別の匿名 Cookie）からは、同じトークンを使えない", async () => {
    const { deps, generate } = setup()
    const { token } = await prepare()
    const other = createSession(config.hashSecret)
    const { response } = await call(
      deps,
      runtimeBody(token),
      `${SESSION_COOKIE_NAME}=${other.cookieValue}`,
    )
    expect(response.status).toBe(400)
    expect(generate).not.toHaveBeenCalled()
  })

  it("記録やトークンの形式が不正なら invalid_trace を返し、利用枠も消費しない", async () => {
    const { deps, generate } = setup()
    const { cookie, token } = await prepare()
    const invalidBodies = [
      runtimeBody(token, { ...summary, steps: [] }),
      runtimeBody("x"),
    ]
    for (let i = 0; i < 5; i++) {
      for (const invalid of invalidBodies) {
        const { response, body } = await call(deps, invalid, cookie)
        expect(response.status).toBe(400)
        expect(body.code).toBe("invalid_trace")
      }
    }
    expect(generate).not.toHaveBeenCalled()

    const { response } = await call(deps, runtimeBody(token), cookie)
    expect(response.status).toBe(200)
  })

  it("期限切れのトークンは、回答がキャッシュに残っていても拒否する", async () => {
    const { deps, generate, advance } = setup()
    const { cookie, token } = await prepare()
    const first = await call(deps, runtimeBody(token), cookie)
    expect(first.response.status).toBe(200)

    // 有効期限（10 分）を過ぎる
    advance(11 * 60 * 1000)
    const { response, body } = await call(deps, runtimeBody(token), cookie)
    expect(response.status).toBe(400)
    expect(body.code).toBe("invalid_trace")
    expect(body.cached).toBeUndefined()
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it("キャッシュは、利用者・実行記録・ブラウザの申告値ごとに分ける", async () => {
    // テストではすべて同じ IP アドレスから送るため、送信元ごとの上限を上げておく
    const { deps, generate } = setup({ perSourceDailyCap: 10 })
    const a = await prepare()
    const first = await call(deps, runtimeBody(a.token), a.cookie)
    expect(first.response.status).toBe(200)
    expect(generate).toHaveBeenCalledTimes(1)

    // 別の利用者が同じ内容の記録を送っても、他人の回答は返さない
    const b = await prepare()
    const other = await call(deps, runtimeBody(b.token), b.cookie)
    expect(other.response.status).toBe(200)
    expect(other.body.cached).toBe(false)
    expect(generate).toHaveBeenCalledTimes(2)

    // 同じ利用者でも、別の実行の記録なら別のキャッシュ
    const otherSummary = summarizeTrace(
      "server-actions",
      buildActionTrace({
        requestId: "1c7e4b63-7b9f-4d2f-8e8b-3a5c9d0f2b41",
        totalMs: 120,
        outcome: { type: "saved", name: "別の名前", writeMs: 110 },
      }),
    )
    const otherToken = await issueTraceToken({
      secret: config.hashSecret,
      sessionId: a.sessionId,
      summary: otherSummary,
      now: NOW,
    })
    const otherRun = await call(
      deps,
      runtimeBody(otherToken, otherSummary),
      a.cookie,
    )
    expect(otherRun.response.status).toBe(200)
    expect(otherRun.body.cached).toBe(false)
    expect(generate).toHaveBeenCalledTimes(3)

    // 同じ記録でも、ブラウザの申告値が違えば別のキャッシュ
    const changedReport = await call(
      deps,
      { ...runtimeBody(a.token), browserReport: { roundTripMs: 999 } },
      a.cookie,
    )
    expect(changedReport.response.status).toBe(200)
    expect(changedReport.body.cached).toBe(false)
    expect(generate).toHaveBeenCalledTimes(4)

    // 最初と同じ内容なら、キャッシュから返す
    const same = await call(deps, runtimeBody(a.token), a.cookie)
    expect(same.body.cached).toBe(true)
    expect(generate).toHaveBeenCalledTimes(4)
  })

  it("対応していない教材では 400", async () => {
    const { deps } = setup()
    const { cookie, token } = await prepare()
    const { response } = await call(
      deps,
      { ...runtimeBody(token), lessonId: "server-components" },
      cookie,
    )
    expect(response.status).toBe(400)
  })

  it("見出しで分けられない回答は、sections を null にしてそのまま返す", async () => {
    const { deps, generate } = setup()
    generate.mockResolvedValueOnce({ ok: true, text: "見出しのない回答です。" })
    const { cookie, token } = await prepare()
    const { body } = await call(deps, runtimeBody(token), cookie)
    expect(body.status).toBe("ok")
    expect(body.sections).toBeNull()
    expect(body.answer).toBe("見出しのない回答です。")
  })
})
