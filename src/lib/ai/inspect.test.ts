import { describe, expect, it } from "vitest"

import { findSensitiveContent } from "./inspect"

describe("findSensitiveContent", () => {
  it.each([
    ["email", "連絡先は taro.yamada@example.com です"],
    ["phone", "電話は 090-1234-5678 です"],
    ["phone", "03 1234 5678"],
    ["phone", "+81-90-1234-5678"],
    ["phone", "+81 3 1234 5678"],
    ["phone", "090(1234)5678"],
    ["phone", "(03)1234-5678"],
    ["phone", "0120-123-456"],
    ["card-number", "4111 1111 1111 1111"],
    ["api-key", "キーは AIza" + "A".repeat(35) + " です"],
    ["api-key", "sk-" + "a1".repeat(12)],
  ])("%s を検出する: %s", (kind, text) => {
    expect(findSensitiveContent(text)).toContain(kind)
  })

  it("全角の数字やアットマークも検出する", () => {
    expect(findSensitiveContent("ｔａｒｏ＠ｅｘａｍｐｌｅ．ｃｏｍ")).toContain(
      "email",
    )
    expect(findSensitiveContent("０９０−１２３４−５６７８")).toContain("phone")
  })

  it("英字と数字が混ざった長い文字列を検出する", () => {
    expect(
      findSensitiveContent("token=a8f3k2m9x7q1w5e6r4t2y8u0i3o9p1s7"),
    ).toContain("random-token")
  })

  it.each([
    "Server Components でデータを取得する理由は？",
    "use client を付けるとどうなりますか",
    "revalidateTag と updateTag の違いを教えて",
    "2026 年のバージョン 16.3 で変わったことは？",
    "useState を使うとき、なぜ Client Component にするの？",
  ])("教材についての普通の質問は検出しない: %s", (text) => {
    expect(findSensitiveContent(text)).toEqual([])
  })
})
