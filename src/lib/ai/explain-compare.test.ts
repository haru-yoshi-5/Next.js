import { describe, expect, it, vi } from "vitest"

import { type ExplainDeps, handleExplain } from "./explain"
import type { AnswerGenerator } from "./gemini"
import { createMemoryStore } from "./store"

const payload = {
  lessonId: "data-fetching",
  mode: "what_if_compare",
}

function setup() {
  const generate = vi
    .fn<AnswerGenerator["generate"]>()
    .mockResolvedValue({ ok: true, text: "直列と並列の一般的な違いです。" })
  const store = createMemoryStore()
  const deps: ExplainDeps = {
    config: {
      status: "ready",
      config: {
        apiKey: "test-key",
        model: "test-model",
        dailyCap: 20,
        perSourceDailyCap: 3,
        hashSecret: "h".repeat(32),
        redis: null,
      },
    },
    isProduction: false,
    getStore: () => store,
    getGenerator: () => ({ generate }),
    now: () => new Date(),
    log: vi.fn(),
  }
  const send = (body: Record<string, unknown> = payload) =>
    handleExplain(
      new Request("http://localhost/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      deps,
    )
  return { generate, send }
}

describe("比較の解説", () => {
  it("固定条件だけをモデルに送り、回答を再利用する", async () => {
    const { generate, send } = setup()
    expect((await send()).status).toBe(200)
    expect(generate).toHaveBeenCalledOnce()
    const input = generate.mock.calls[0][0]
    expect(input).toEqual({
      prompt:
        "独立した2つの固定データ取得を、逐次 await と Promise.all で比較する。取得には待ち時間を模した処理を使う。",
      systemInstruction:
        "あなたはデータ取得の学習を支援します。日本語で一般論を説明してください。独立した取得では並列実行によって待ち時間が重なることと、逐次実行との違いを主題にしてください。依存関係がある場合、同時実行数の制限がある場合、Promise.all の一つが失敗した場合を条件付きで説明してください。今回の実測値、倍率、結果を推測しないでください。回答は画面にそのまま文字として表示されるため、Markdown の記号（見出しの #、強調の **、区切り線の ---、コードのバッククォート）を使わず、字下げのない短い段落で、全体で600字程度にまとめてください。",
    })
    expect((await (await send()).json()).cached).toBe(true)
    expect(generate).toHaveBeenCalledOnce()
  })
  it.each([
    { lessonId: "server-actions" },
    { measurement: 123 },
    { code: "秘密" },
    { url: "https://example.com" },
    { question: "任意" },
  ])("不正な入力を拒否する (%j)", async (forged) => {
    const { generate, send } = setup()
    expect((await send({ ...payload, ...forged })).status).toBe(400)
    expect(generate).not.toHaveBeenCalled()
  })
})
