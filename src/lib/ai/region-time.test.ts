import { describe, expect, it } from "vitest"

import { isAllowedRegion } from "./region"
import {
  jstDateKey,
  nextJstMidnightSeconds,
  secondsUntilNextJstMidnight,
} from "./time"

describe("isAllowedRegion", () => {
  it("本番では JP だけを許可する", () => {
    expect(isAllowedRegion("JP", true)).toBe(true)
    expect(isAllowedRegion("US", true)).toBe(false)
    expect(isAllowedRegion("DE", true)).toBe(false)
  })

  it("本番では、判定できないときも断る", () => {
    for (const value of [null, "", "jp", " JP", "XX", "JPN"]) {
      expect(isAllowedRegion(value, true)).toBe(false)
    }
  })

  it("開発中は判定を省く", () => {
    expect(isAllowedRegion(null, false)).toBe(true)
  })
})

describe("日本時間の日付", () => {
  it("UTC 14:59 は日本時間で同じ日、15:00 は翌日", () => {
    expect(jstDateKey(new Date("2026-11-11T14:59:59Z"))).toBe("2026-11-11")
    expect(jstDateKey(new Date("2026-11-11T15:00:00Z"))).toBe("2026-11-12")
  })

  it("次の日本時間 0 時は、日付のキーと同じ時刻から計算する", () => {
    const now = new Date("2026-11-11T14:59:59Z")
    expect(nextJstMidnightSeconds(now)).toBe(
      Date.parse("2026-11-11T15:00:00Z") / 1000,
    )
    expect(secondsUntilNextJstMidnight(now)).toBe(1)
  })

  it("ちょうど 0 時のときは、翌日の 0 時を返す", () => {
    const now = new Date("2026-11-11T15:00:00Z")
    expect(nextJstMidnightSeconds(now)).toBe(
      Date.parse("2026-11-12T15:00:00Z") / 1000,
    )
  })
})
