import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { buildActionTrace } from "@/app/learn/server-actions/action-trace"

import { createSession, SESSION_COOKIE_NAME } from "./identity"
import { issueRuntimeExplainTicket } from "./runtime-ticket"
import { verifyTraceToken } from "./trace-token"

const SECRET = "t".repeat(32)

/** next/headers の cookies() の代わり。読み書きした内容を確かめる */
const cookieJar = new Map<string, string>()
const setCookie = vi.fn<
  (name: string, value: string, options?: unknown) => void
>((name, value) => {
  cookieJar.set(name, value)
})

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined,
    set: setCookie,
  }),
}))

/** 署名の失敗を再現するため、issueTraceToken だけを差し替えられるようにする */
const issueFailure = { enabled: false }
vi.mock("./trace-token", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./trace-token")>()
  return {
    ...actual,
    issueTraceToken: async (
      input: Parameters<typeof actual.issueTraceToken>[0],
    ) => {
      if (issueFailure.enabled) throw new Error("署名に失敗")
      return actual.issueTraceToken(input)
    },
  }
})

const trace = buildActionTrace({
  requestId: "0b6f3a52-6a8e-4c1e-9d7a-2f4b8c9e1a30",
  totalMs: 120,
  outcome: { type: "saved", name: "テスト", writeMs: 100 },
})

beforeEach(() => {
  vi.stubEnv("NEXTSCOPE_AI_ENABLED", "true")
  vi.stubEnv("GEMINI_API_KEY", "test-key")
  vi.stubEnv("GEMINI_MODEL", "test-model")
  vi.stubEnv("NEXTSCOPE_AI_HASH_SECRET", SECRET)
  vi.stubEnv("NODE_ENV", "test")
})

afterEach(() => {
  vi.unstubAllEnvs()
  cookieJar.clear()
  setCookie.mockClear()
  issueFailure.enabled = false
  vi.restoreAllMocks()
})

/** 発行されたトークンが、どのセッションに結び付いているかを確かめる */
async function isBoundTo(
  ticket: Awaited<ReturnType<typeof issueRuntimeExplainTicket>>,
  sessionId: string,
) {
  if (!ticket) return false
  const result = await verifyTraceToken({
    secret: SECRET,
    sessionId,
    summary: ticket.summary,
    now: new Date(),
    token: ticket.token,
    lessonId: "server-actions",
  })
  return result.ok
}

describe("issueRuntimeExplainTicket", () => {
  it("匿名 Cookie がなければ、HttpOnly の Cookie を発行し、そのセッションに結び付ける", async () => {
    const ticket = await issueRuntimeExplainTicket("server-actions", trace)

    expect(ticket).not.toBeNull()
    expect(setCookie).toHaveBeenCalledTimes(1)
    const [name, value, options] = setCookie.mock.calls[0]
    expect(name).toBe(SESSION_COOKIE_NAME)
    expect(options).toMatchObject({
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    })
    const sessionId = value.slice(0, value.lastIndexOf("."))
    expect(await isBoundTo(ticket, sessionId)).toBe(true)
  })

  it("正しい匿名 Cookie があれば、発行し直さずに使い回す", async () => {
    const session = createSession(SECRET)
    cookieJar.set(SESSION_COOKIE_NAME, session.cookieValue)

    const ticket = await issueRuntimeExplainTicket("server-actions", trace)

    expect(setCookie).not.toHaveBeenCalled()
    expect(await isBoundTo(ticket, session.id)).toBe(true)
  })

  it("署名が正しくない Cookie は信頼せず、新しい Cookie を発行する", async () => {
    const forged = "11111111-2222-4333-8444-555555555555.forged"
    cookieJar.set(SESSION_COOKIE_NAME, forged)

    const ticket = await issueRuntimeExplainTicket("server-actions", trace)

    expect(setCookie).toHaveBeenCalledTimes(1)
    expect(
      await isBoundTo(ticket, "11111111-2222-4333-8444-555555555555"),
    ).toBe(false)
  })

  it("AI 機能が無効・対応していない教材では、Cookie を発行せずに null を返す", async () => {
    expect(
      await issueRuntimeExplainTicket("server-components", trace),
    ).toBeNull()

    vi.stubEnv("NEXTSCOPE_AI_ENABLED", "false")
    expect(await issueRuntimeExplainTicket("server-actions", trace)).toBeNull()
    expect(setCookie).not.toHaveBeenCalled()
  })

  it("署名に失敗しても例外を投げず、null を返す（デモの結果はそのまま返せる）", async () => {
    issueFailure.enabled = true
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(
      issueRuntimeExplainTicket("server-actions", trace),
    ).resolves.toBeNull()
    expect(consoleError).toHaveBeenCalled()
  })
})
