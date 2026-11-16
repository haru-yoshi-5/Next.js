import { describe, expect, it, vi } from "vitest"

import {
  EXPLAIN_ENDPOINT,
  formatAnswer,
  parseExplainResponse,
  QUESTION_MAX_LENGTH,
  requestExplanation,
  validateQuestion,
} from "./client"

describe("requestExplanation", () => {
  const okBody = {
    status: "ok",
    answer: "回答です",
    references: [],
    cached: false,
    notice: "注意",
  }

  it("教材 ID と質問だけを JSON で送り、応答を画面の形に直す", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json(okBody))
    const result = await requestExplanation({
      lessonId: "server-actions",
      question: "なぜ？",
      fetchImpl,
    })

    expect(result).toEqual({ ...okBody, status: "ok" })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe(EXPLAIN_ENDPOINT)
    expect(init?.method).toBe("POST")
    expect(init?.credentials).toBe("same-origin")
    expect(init?.signal).toBeInstanceOf(AbortSignal)
    expect(JSON.parse(String(init?.body))).toEqual({
      lessonId: "server-actions",
      mode: "context_tutor",
      question: "なぜ？",
    })
  })

  it("API のエラー応答（HTTP 429 など）も、メッセージと再試行の可否に直す", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json(
        { status: "error", code: "rate_limited", message: "上限です" },
        { status: 429 },
      ),
    )
    expect(
      await requestExplanation({ lessonId: "a", question: "q", fetchImpl }),
    ).toEqual({
      status: "error",
      code: "rate_limited",
      message: "上限です",
      retryable: false,
    })
  })

  it("通信に失敗したら network_error（再試行できる）を返す", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new TypeError("Failed to fetch")
    })
    expect(
      await requestExplanation({ lessonId: "a", question: "q", fetchImpl }),
    ).toMatchObject({ status: "error", code: "network_error", retryable: true })
  })

  it("時間内に応答がなければ打ち切り、network_error を返す", async () => {
    // signal が中断されたら、fetch と同じように DOMException で失敗する
    const fetchImpl = vi.fn<typeof fetch>(
      (_, init) =>
        new Promise((_, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(init.signal?.reason),
          )
        }),
    )
    expect(
      await requestExplanation({
        lessonId: "a",
        question: "q",
        fetchImpl,
        timeoutMs: 10,
      }),
    ).toMatchObject({ status: "error", code: "network_error" })
  })

  it("本文の読み取り中に中断されたら network_error を返す", async () => {
    const response = new Response("{}")
    vi.spyOn(response, "json").mockRejectedValue(
      new DOMException("timed out", "TimeoutError"),
    )
    const fetchImpl = vi.fn<typeof fetch>(async () => response)
    expect(
      await requestExplanation({ lessonId: "a", question: "q", fetchImpl }),
    ).toMatchObject({ status: "error", code: "network_error" })
  })

  it.each([
    ["JSON でない本文", new Response("<html>502</html>", { status: 502 })],
    ["空の本文", new Response(null, { status: 500 })],
    ["想定外の形の JSON", Response.json({ foo: 1 })],
  ])("%s なら invalid_response（再試行できる）を返す", async (_, response) => {
    const fetchImpl = vi.fn<typeof fetch>(async () => response)
    expect(
      await requestExplanation({ lessonId: "a", question: "q", fetchImpl }),
    ).toMatchObject({
      status: "error",
      code: "invalid_response",
      retryable: true,
    })
  })
})

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
  it("生成中のメッセージを表示し、同じ質問を再送できる", () => {
    const response = {
      status: "error",
      code: "generation_in_progress",
      message: "同じ内容の解説を生成中です。",
    }
    expect(parseExplainResponse(response)).toEqual({
      ...response,
      retryable: true,
    })
  })

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

  // コードの範囲がはっきりしない回答は、まったく変えずに返す（先頭の空行と末尾の空白だけ除く）
  it.each([
    ["通常のコードブロック", "## 例\n```ts\n# 行\n* 2 ** 3\n```\n- **まとめ**"],
    ["閉じていないコードブロック", "**例**\n```ts\nconst x = 2 ** 3\n* item"],
    [
      'ブロックの中の文字列 "```"',
      '```ts\nconst fence = "```"\nconst x = 2 ** 3\n```\n**後**',
    ],
    ["~~~ のコードブロック", "~~~\nconst x = 2 ** 3\n~~~\n**後**"],
    ["長いフェンス", "````md\n```\nconst x = 2 ** 3\n```\n````\n**後**"],
    ["箇条書きの中のフェンス", "- ```js\n  const x = 2 ** 3;\n  ```\n- **後**"],
    ["引用の中のフェンス", "> ```js\n> const x = 2 ** 3;\n> ```\n**後**"],
    ["タブで字下げした閉じ記号", "```js\n\t```\nconst x = 2 ** 3;\n```"],
    ["4 つの空白で字下げしたコード", "**例**\n\n    const x = 2 ** 3\n"],
    ["タブで字下げしたコード", "**例**\n\n\tconst x = 2 ** 3"],
    ["1 行に書いた ```a```", "```2 ** 3``` と **強調**"],
    ["1 行目から字下げしたコード", "    const x = 2 ** 3"],
    ["引用の中の字下げしたコード", "**例**\n>     const x = 2 ** 3"],
    ["リストの中の字下げしたコード", "- **例**\n\n      const x = 2 ** 3"],
    ["番号付きリストの中の字下げしたコード", "1.     const x = 2 ** 3"],
    ["改行をまたぐインラインコード", "**例**: `const x =\n2 ** 3`"],
    ["改行をまたぐ二重バッククォート", "**例**: ``const s =\n`2 ** 3`;``"],
    ["閉じていないインラインコード", "**例**: `2 ** 3\n**次の行**"],
    [
      "エスケープしたバッククォート",
      "\\` はバッククォート。`2 ** 3` はべき乗。\\`",
    ],
    ["エスケープしたバッククォートと強調", "**例**: \\`2 ** 3\\`"],
  ])("%s を含む回答は整形しない", (_, answer) => {
    expect(formatAnswer(answer)).toBe(answer.trimEnd())
  })

  it("整形しないときも、1 行目の字下げは残し、先頭の空行と末尾の空白だけを除く", () => {
    expect(formatAnswer("\n\n    const x = 2 ** 3\n  \n")).toBe(
      "    const x = 2 ** 3",
    )
  })

  it("二重バッククォートのインラインコードも保護する", () => {
    expect(formatAnswer("**例**: ``const s = `2 ** 3`;``")).toBe(
      "例: ``const s = `2 ** 3`;``",
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
