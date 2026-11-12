import { describe, expect, it } from "vitest"

import {
  formatAnswer,
  parseExplainResponse,
  QUESTION_MAX_LENGTH,
  validateQuestion,
} from "./client"

describe("validateQuestion", () => {
  it("空や空白だけの質問を断る", () => {
    expect(validateQuestion("")).toBe("質問を入力してください。")
    expect(validateQuestion("   \n")).toBe("質問を入力してください。")
  })

  it("上限ちょうどは通し、超えたら断る（絵文字も 1 文字として数える）", () => {
    expect(validateQuestion("😀".repeat(QUESTION_MAX_LENGTH))).toBeNull()
    expect(validateQuestion("あ".repeat(QUESTION_MAX_LENGTH + 1))).toBe(
      `質問は${QUESTION_MAX_LENGTH}文字以内で入力してください。`,
    )
  })
})

describe("parseExplainResponse", () => {
  it("成功の応答を読み、教材ページ以外のリンクを捨てる", () => {
    const result = parseExplainResponse({
      status: "ok",
      answer: "解説",
      cached: true,
      notice: "AI が生成した解説です。",
      references: [
        {
          slug: "server-components",
          title: "Server Components",
          href: "/learn/server-components",
        },
        { slug: "x", title: "外部", href: "https://example.com" },
        { slug: "y", title: "スクリプト", href: "javascript:alert(1)" },
        "壊れた値",
      ],
    })
    expect(result).toEqual({
      status: "ok",
      answer: "解説",
      cached: true,
      notice: "AI が生成した解説です。",
      references: [
        {
          slug: "server-components",
          title: "Server Components",
          href: "/learn/server-components",
        },
      ],
    })
  })

  it("時間をおけば成功しうる失敗だけを、再試行できるものとして扱う", () => {
    const timeout = parseExplainResponse({
      status: "error",
      code: "timeout",
      message: "中断",
    })
    expect(timeout).toMatchObject({
      status: "error",
      code: "timeout",
      retryable: true,
    })

    for (const code of [
      "rate_limited",
      "disabled",
      "region_not_supported",
      "sensitive_content",
      "no_answer",
    ]) {
      expect(
        parseExplainResponse({ status: "error", code, message: "失敗" }),
      ).toMatchObject({
        retryable: false,
      })
    }
  })

  it("想定外の形は、読み取れなかった失敗にする", () => {
    for (const body of [
      null,
      "text",
      {},
      { status: "ok", answer: "" },
      { status: "error", code: "unknown", message: "x" },
    ]) {
      expect(parseExplainResponse(body)).toMatchObject({
        status: "error",
        code: "invalid_response",
        retryable: true,
      })
    }
  })
})

describe("formatAnswer", () => {
  it("強調記号を取り除き、コードのバッククォートは残す", () => {
    expect(formatAnswer("**Server** Components では `fetch` を使う")).toBe(
      "Server Components では `fetch` を使う",
    )
  })

  it("インラインコードの中の ** は消さない", () => {
    expect(
      formatAnswer("**べき乗**は `2 ** 3`、glob は `app/**/page.tsx` です"),
    ).toBe("べき乗は `2 ** 3`、glob は `app/**/page.tsx` です")
  })

  it("コードブロックの中身（行頭の * や # を含む）は変えない", () => {
    const block = "```ts\n# コメントではない行\n* 2 ** 3\n- item\n```"
    expect(formatAnswer(`## 例\n${block}\n- まとめ`)).toBe(
      `例\n${block}\n・まとめ`,
    )
  })

  it("閉じていないコードブロックは、末尾までコードとして扱う", () => {
    // 回答はサーバーで文字数を切るため、閉じる ``` がなくなることがある
    expect(formatAnswer("**例**\n```ts\nconst x = 2 ** 3\n* item")).toBe(
      "例\n```ts\nconst x = 2 ** 3\n* item",
    )
  })

  it('コードブロックの中の文字列 "```" では、ブロックを閉じない', () => {
    const block = '```ts\nconst fence = "```"\nconst x = 2 ** 3\n```'
    expect(formatAnswer(`${block}\n**後**`)).toBe(`${block}\n後`)
  })

  it("~~~ のコードブロックも保護する", () => {
    const block = "~~~\nconst x = 2 ** 3\n~~~"
    expect(formatAnswer(`${block}\n**後**`)).toBe(`${block}\n後`)
  })

  it("長いフェンスは、同じ長さ以上の記号だけの行で閉じる", () => {
    const block = "````md\n```\nconst x = 2 ** 3\n```\n````"
    expect(formatAnswer(`${block}\n**後**`)).toBe(`${block}\n後`)
  })

  it("二重バッククォートのインラインコードも保護する", () => {
    expect(formatAnswer("**例**: ``const s = `2 ** 3`;``")).toBe(
      "例: ``const s = `2 ** 3`;``",
    )
  })

  it("閉じていないインラインコードは、行の末尾まで残す", () => {
    expect(formatAnswer("**例**: `2 ** 3\n**次の行**")).toBe(
      "例: `2 ** 3\n次の行",
    )
  })

  it("1 行に書いた ```a``` はコードブロックではなく、インラインコードとして扱う", () => {
    expect(formatAnswer("```2 ** 3``` と **強調**\n**次**")).toBe(
      "```2 ** 3``` と 強調\n次",
    )
  })

  it("行頭の箇条書きを「・」にし、見出しの記号を取り除く", () => {
    expect(
      formatAnswer(
        "## まとめ\n* 1 つ目\n- 2 つ目\n  * 入れ子\n値は -1 や a * b",
      ),
    ).toBe("まとめ\n・1 つ目\n・2 つ目\n  ・入れ子\n値は -1 や a * b")
  })
})
