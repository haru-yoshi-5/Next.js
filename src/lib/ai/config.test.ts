import { describe, expect, it } from "vitest"

import { readAiConfig } from "./config"

const base = {
  NEXTSCOPE_AI_ENABLED: "true",
  GEMINI_API_KEY: "test-key",
  GEMINI_MODEL: "test-model",
  NEXTSCOPE_AI_HASH_SECRET: "x".repeat(32),
}

describe("readAiConfig", () => {
  it("機能フラグが true でなければ disabled", () => {
    expect(
      readAiConfig({ ...base, NEXTSCOPE_AI_ENABLED: "false" }, false),
    ).toEqual({
      status: "disabled",
    })
    expect(readAiConfig({}, false)).toEqual({ status: "disabled" })
  })

  it("開発中は、保存先がなくても ready になり、既定の上限を使う", () => {
    const result = readAiConfig(base, false)
    expect(result).toMatchObject({
      status: "ready",
      config: { dailyCap: 20, perSourceDailyCap: 3, redis: null },
    })
  })

  it("本番では、保存先がなければ unconfigured", () => {
    const result = readAiConfig(base, true)
    expect(result.status).toBe("unconfigured")
  })

  it("本番で保存先があれば ready", () => {
    const result = readAiConfig(
      {
        ...base,
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "token",
      },
      true,
    )
    expect(result.status).toBe("ready")
  })

  it("キー・モデル・秘密の値が欠けていれば unconfigured（問題には名前だけを入れる）", () => {
    const result = readAiConfig(
      { NEXTSCOPE_AI_ENABLED: "true", NEXTSCOPE_AI_HASH_SECRET: "short" },
      false,
    )
    expect(result).toEqual({
      status: "unconfigured",
      problems: ["GEMINI_API_KEY", "GEMINI_MODEL", "NEXTSCOPE_AI_HASH_SECRET"],
    })
  })

  it("上限の値が正の整数でなければ unconfigured", () => {
    for (const value of ["0", "-1", "abc", "1.5"]) {
      const result = readAiConfig(
        { ...base, NEXTSCOPE_AI_DAILY_REQUEST_CAP: value },
        false,
      )
      expect(result.status).toBe("unconfigured")
    }
  })

  it("API キーの値を problems に含めない", () => {
    const result = readAiConfig({ ...base, GEMINI_MODEL: "" }, false)
    expect(JSON.stringify(result)).not.toContain("test-key")
  })
})
