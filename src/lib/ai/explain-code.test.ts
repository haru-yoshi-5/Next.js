import { describe, expect, it, vi } from "vitest"

import { getCodeMap, readMappedCode } from "@/lib/learning/code-map"

import { type ExplainDeps, handleExplain } from "./explain"
import type { AnswerGenerator } from "./gemini"
import { createMemoryStore } from "./store"

const payload = {
  lessonId: "server-actions",
  mode: "code_explain",
  selectedComponentId: "submit-button",
}

function setup() {
  const generate = vi
    .fn<AnswerGenerator["generate"]>()
    .mockResolvedValue({ ok: true, text: "公開コードについての解説です。" })
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

describe("コードの解説", () => {
  it("登録済みの公開断片と教材情報だけを送り、同じ断片の解説を再利用する", async () => {
    const { generate, send } = setup()
    const entry = getCodeMap(payload.lessonId).find(
      ({ id }) => id === payload.selectedComponentId,
    )!
    const { code, start, end } = await readMappedCode(entry)
    const response = await send()
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ status: "ok", cached: false })
    expect(generate).toHaveBeenCalledOnce()
    expect(JSON.parse(generate.mock.calls[0][0].prompt)).toEqual({
      lessonContext: expect.stringContaining("Server Actions"),
      selectedElement: entry.label,
      component: entry.component,
      path: entry.path,
      firstLine: start + 1,
      lastLine: end + 1,
      code,
    })
    expect(code).toContain("async function saveNameWithTiming")
    expect(code).not.toContain("export function NameForm")
    expect(await (await send()).json()).toMatchObject({ cached: true })
    expect(generate).toHaveBeenCalledOnce()

    for (const selectedComponentId of ["guestbook-list", "save-result"]) {
      const response = await send({ ...payload, selectedComponentId })
      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({ cached: false })
    }
    expect(generate).toHaveBeenCalledTimes(3)
  })

  it.each([
    { selectedComponentId: "unknown" },
    { selectedComponentId: "__proto__" },
    { lessonId: "client-components" },
    { code: "任意のコード" },
    { path: ".env.local", firstLine: 1 },
    { trace: { value: "入力した名前" } },
  ])("未登録の対象や任意のデータを拒否する (%j)", async (forged) => {
    const { generate, send } = setup()
    expect((await send({ ...payload, ...forged })).status).toBe(400)
    expect(generate).not.toHaveBeenCalled()
  })
})
