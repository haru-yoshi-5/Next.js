import { describe, expect, it } from "vitest"

import {
  buildSessionSetCookie,
  createSession,
  hashIdentifier,
  readClientIp,
  readSessionCookie,
  verifySessionCookie,
} from "./identity"
import { parseExplainRequest, QUESTION_MAX_LENGTH } from "./request"

const secret = "s".repeat(32)

function body(value: unknown) {
  return JSON.stringify(value)
}

describe("parseExplainRequest", () => {
  it("正しい入力を受け付け、教材の本文はサーバーで引く", () => {
    const result = parseExplainRequest(
      body({
        lessonId: "server-components",
        mode: "context_tutor",
        question: "  なぜサーバーで処理するの？  ",
      }),
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.lesson.slug).toBe("server-components")
      expect(result.value.question).toBe("なぜサーバーで処理するの？")
    }
  })

  it.each([
    ["JSON でない", "not json"],
    ["オブジェクトでない", body("text")],
    [
      "存在しない教材",
      body({ lessonId: "no-such", mode: "context_tutor", question: "a" }),
    ],
    [
      "教材 ID が文字列でない",
      body({ lessonId: 1, mode: "context_tutor", question: "a" }),
    ],
    [
      "許可していない mode",
      body({
        lessonId: "server-components",
        mode: "runtime_explain",
        question: "a",
      }),
    ],
    [
      "空の質問",
      body({
        lessonId: "server-components",
        mode: "context_tutor",
        question: "   ",
      }),
    ],
    [
      "質問が文字列でない",
      body({
        lessonId: "server-components",
        mode: "context_tutor",
        question: ["a"],
      }),
    ],
    [
      "長すぎる質問",
      body({
        lessonId: "server-components",
        mode: "context_tutor",
        question: "あ".repeat(QUESTION_MAX_LENGTH + 1),
      }),
    ],
    [
      "制御文字",
      body({
        lessonId: "server-components",
        mode: "context_tutor",
        question: "a\u0000b",
      }),
    ],
  ])("%s は 400 で断る", (_label, raw) => {
    const result = parseExplainRequest(raw)
    expect(result).toMatchObject({ ok: false, status: 400 })
  })

  it("上限ちょうどの長さの質問は受け付ける", () => {
    const result = parseExplainRequest(
      body({
        lessonId: "server-components",
        mode: "context_tutor",
        question: "あ".repeat(QUESTION_MAX_LENGTH),
      }),
    )
    expect(result.ok).toBe(true)
  })
})

describe("送信元の識別", () => {
  it("本番では x-real-ip、なければ x-forwarded-for の先頭を使う", () => {
    expect(readClientIp(new Headers({ "x-real-ip": "1.1.1.1" }), true)).toBe(
      "1.1.1.1",
    )
    expect(
      readClientIp(
        new Headers({ "x-forwarded-for": "2.2.2.2, 3.3.3.3" }),
        true,
      ),
    ).toBe("2.2.2.2")
    expect(readClientIp(new Headers(), true)).toBe("unknown")
    expect(readClientIp(new Headers({ "x-real-ip": "1.1.1.1" }), false)).toBe(
      "local",
    )
  })

  it("ハッシュは日付や種類が変わると別の値になり、元の値を含まない", () => {
    const a = hashIdentifier(secret, "2026-11-11", "ip", "1.1.1.1")
    expect(a).not.toContain("1.1.1.1")
    expect(hashIdentifier(secret, "2026-11-12", "ip", "1.1.1.1")).not.toBe(a)
    expect(hashIdentifier(secret, "2026-11-11", "session", "1.1.1.1")).not.toBe(
      a,
    )
    expect(hashIdentifier(secret, "2026-11-11", "ip", "1.1.1.1")).toBe(a)
  })

  it("署名付きの匿名 Cookie を確かめ、改ざんや別の秘密の値では断る", () => {
    const session = createSession(secret)
    expect(verifySessionCookie(secret, session.cookieValue)).toBe(session.id)
    expect(verifySessionCookie("t".repeat(32), session.cookieValue)).toBeNull()
    expect(
      verifySessionCookie(
        secret,
        `other-id.${session.cookieValue.split(".")[1]}`,
      ),
    ).toBeNull()
    expect(verifySessionCookie(secret, "no-signature")).toBeNull()
    expect(verifySessionCookie(secret, undefined)).toBeNull()
  })

  it("Cookie ヘッダーから匿名 Cookie を読み、Set-Cookie は HttpOnly で返す", () => {
    const headers = new Headers({
      cookie: "a=1; nextscope_ai_session=abc.def; b=2",
    })
    expect(readSessionCookie(headers)).toBe("abc.def")
    const setCookie = buildSessionSetCookie("abc.def", true)
    expect(setCookie).toContain("HttpOnly")
    expect(setCookie).toContain("Secure")
    expect(setCookie).toContain("Path=/api/ai")
    expect(buildSessionSetCookie("abc.def", false)).not.toContain("Secure")
  })
})
