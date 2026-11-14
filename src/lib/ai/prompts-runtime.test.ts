import { describe, expect, it } from "vitest"

import { splitRuntimeAnswer } from "./prompts"

describe("splitRuntimeAnswer", () => {
  it("見出しの前後の記号（#・**・コロン）を許して分ける", () => {
    const answer = [
      "## **【観測されたこと】**",
      "A",
      "### 【教材上の説明】：",
      "B",
      "【観測できないこと】",
      "C",
    ].join("\n")
    expect(splitRuntimeAnswer(answer)).toEqual({
      observed: "A",
      lessonExplanation: "B",
      unobservable: "C",
    })
  })

  it("見出しが欠けている・順番が違う・中身が空なら null", () => {
    expect(
      splitRuntimeAnswer("【観測されたこと】\nA\n【教材上の説明】\nB"),
    ).toBeNull()
    expect(
      splitRuntimeAnswer(
        "【教材上の説明】\nB\n【観測されたこと】\nA\n【観測できないこと】\nC",
      ),
    ).toBeNull()
    expect(
      splitRuntimeAnswer(
        "【観測されたこと】\n【教材上の説明】\nB\n【観測できないこと】\nC",
      ),
    ).toBeNull()
  })

  it("文中に出てくる見出しの文字列では分けない", () => {
    const answer =
      "記録には【観測されたこと】があります。\n【教材上の説明】\nB\n【観測できないこと】\nC"
    expect(splitRuntimeAnswer(answer)).toBeNull()
  })
})
