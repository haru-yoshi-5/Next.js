import { SignJWT, UnsecuredJWT } from "jose"
import { describe, expect, it } from "vitest"

import { buildActionTrace } from "@/app/learn/server-actions/action-trace"
import { summarizeTrace, type TraceSummary } from "@/lib/tracing/adapter"

import { issueTraceToken, verifyTraceToken } from "./trace-token"

const SECRET = "s".repeat(32)
const SESSION_ID = "11111111-2222-4333-8444-555555555555"
const NOW = new Date("2026-11-14T03:00:00Z")
const later = (seconds: number) => new Date(NOW.getTime() + seconds * 1000)

const summary = summarizeTrace(
  "server-actions",
  buildActionTrace({
    requestId: "0b6f3a52-6a8e-4c1e-9d7a-2f4b8c9e1a30",
    totalMs: 263,
    outcome: { type: "saved", name: "テスト", writeMs: 251 },
  }),
)

async function issue() {
  return issueTraceToken({
    secret: SECRET,
    sessionId: SESSION_ID,
    summary,
    now: NOW,
  })
}

function verify(
  token: string,
  overrides: Partial<{
    summary: TraceSummary
    sessionId: string
    lessonId: string
    now: Date
    secret: string
  }> = {},
) {
  return verifyTraceToken({
    secret: SECRET,
    sessionId: SESSION_ID,
    summary,
    now: later(60),
    lessonId: "server-actions",
    token,
    ...overrides,
  })
}

describe("trace-token", () => {
  it("発行したトークンと、同じ要約・同じセッションなら受け付ける", async () => {
    const result = await verify(await issue())
    expect(result.ok).toBe(true)
  })

  it("改ざんされた traceId を拒否する", async () => {
    const token = await issue()
    const tampered = {
      ...summary,
      traceId: "99999999-6a8e-4c1e-9d7a-2f4b8c9e1a30",
    }
    expect(await verify(token, { summary: tampered })).toEqual({
      ok: false,
      reason: "invalid",
    })
  })

  it("要約の中身（所要時間など）を書き換えると拒否する", async () => {
    const token = await issue()
    const tampered: TraceSummary = {
      ...summary,
      steps: summary.steps.map((step) =>
        step.id === "write" ? { ...step, durationMs: 1 } : step,
      ),
    }
    expect((await verify(token, { summary: tampered })).ok).toBe(false)
  })

  it("別のセッション・別の教材・別の秘密の値では拒否する", async () => {
    const token = await issue()
    expect((await verify(token, { sessionId: "other-session" })).ok).toBe(false)
    expect((await verify(token, { lessonId: "server-components" })).ok).toBe(
      false,
    )
    expect((await verify(token, { secret: "x".repeat(32) })).ok).toBe(false)
  })

  it("10 分を過ぎたら expired として拒否する", async () => {
    const token = await issue()
    expect(await verify(token, { now: later(10 * 60 + 1) })).toEqual({
      ok: false,
      reason: "expired",
    })
  })

  it("署名のないトークン（alg: none）や、Cookie の鍵で署名したトークンを拒否する", async () => {
    const unsecured = new UnsecuredJWT({
      lid: "server-actions",
      sid: SESSION_ID,
    })
      .setJti(summary.traceId)
      .setIssuedAt(Math.floor(NOW.getTime() / 1000))
      .setExpirationTime("10m")
      .encode()
    expect((await verify(unsecured)).ok).toBe(false)

    // 秘密の値そのものを鍵にしたトークン（用途ごとに鍵を分けているため通らない）
    const wrongKey = await new SignJWT({
      lid: "server-actions",
      sid: SESSION_ID,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("nextscope")
      .setAudience("runtime_explain")
      .setJti(summary.traceId)
      .setIssuedAt(Math.floor(NOW.getTime() / 1000))
      .setExpirationTime(Math.floor(NOW.getTime() / 1000) + 600)
      .sign(new TextEncoder().encode(SECRET))
    expect((await verify(wrongKey)).ok).toBe(false)
  })
})
