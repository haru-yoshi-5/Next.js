import { afterEach, describe, expect, it, vi } from "vitest"

import { POST } from "./route"

afterEach(() => {
  vi.unstubAllEnvs()
})

function request() {
  return new Request("http://localhost/api/ai/explain", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      lessonId: "server-components",
      mode: "context_tutor",
      question: "質問",
    }),
  })
}

describe("POST /api/ai/explain（配線）", () => {
  it("AI 機能が無効なら 503 を返す", async () => {
    vi.stubEnv("NEXTSCOPE_AI_ENABLED", "false")
    const response = await POST(request())
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ code: "disabled" })
  })

  it("有効でもキーなどが未設定なら 503 を返す（教材ページには影響しない）", async () => {
    vi.stubEnv("NEXTSCOPE_AI_ENABLED", "true")
    vi.stubEnv("GEMINI_API_KEY", "")
    vi.stubEnv("GEMINI_MODEL", "")
    const response = await POST(request())
    expect(response.status).toBe(503)
  })

  it("本番で保存先がなければ 503 を返す", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("NEXTSCOPE_AI_ENABLED", "true")
    vi.stubEnv("GEMINI_API_KEY", "key")
    vi.stubEnv("GEMINI_MODEL", "model")
    vi.stubEnv("NEXTSCOPE_AI_HASH_SECRET", "x".repeat(32))
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "")
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "")
    const response = await POST(request())
    expect(response.status).toBe(503)
  })
})
