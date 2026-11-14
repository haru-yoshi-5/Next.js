// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { buildActionTrace } from "@/app/learn/server-actions/action-trace"
import { EXPLAIN_ENDPOINT } from "@/lib/ai/client"
import { summarizeTrace } from "@/lib/tracing/adapter"

import { RuntimeDetective } from "./runtime-detective"

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  cleanup()
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

const ticket = {
  summary: summarizeTrace(
    "server-actions",
    buildActionTrace({
      requestId: "0b6f3a52-6a8e-4c1e-9d7a-2f4b8c9e1a30",
      totalMs: 263,
      outcome: { type: "saved", name: "ひみつの名前", writeMs: 251 },
    }),
  ),
  token: "aaa.bbb.ccc",
}

function renderDetective() {
  return render(
    <RuntimeDetective
      lessonId="server-actions"
      ticket={ticket}
      browserRoundTripMs={412.4}
    />,
  )
}

describe("RuntimeDetective", () => {
  it("表示しただけでは API を呼ばず、送る内容を実測・概念・申告に分けて表示する", () => {
    renderDetective()
    expect(fetchMock).not.toHaveBeenCalled()

    const list = screen.getByRole("list", { name: "AI に送るステップ" })
    expect(within(list).getAllByText("実測")).toHaveLength(4)
    expect(within(list).getAllByText("概念")).toHaveLength(4)
    expect(screen.getAllByText("申告").length).toBeGreaterThan(0)
    expect(
      screen.getByText(/送信から応答を受け取るまで/).textContent,
    ).toContain("412 ms")
    // ひみつの名前は表示も送信もしない
    expect(document.body.textContent).not.toContain("ひみつの名前")
  })

  it("ボタンを押したときに 1 回だけ送り、回答を 3 つの見出しで表示する", async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        status: "ok",
        answer: "全文",
        references: [],
        cached: false,
        notice: "AI が生成した解説です。",
        sections: {
          observed: "観測の内容",
          lessonExplanation: "教材の内容",
          unobservable: "分からない内容",
        },
      }),
    )
    const user = userEvent.setup()
    renderDetective()
    await user.click(
      screen.getByRole("button", { name: "この実行を AI で解説" }),
    )

    expect(
      await screen.findByRole("heading", { name: "観測されたこと" }),
    ).toBeTruthy()
    expect(screen.getByText("教材の内容")).toBeTruthy()
    expect(screen.getByText("分からない内容")).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(EXPLAIN_ENDPOINT)
    const sent = JSON.parse(String(init?.body))
    expect(sent).toMatchObject({
      lessonId: "server-actions",
      mode: "runtime_explain",
      traceToken: "aaa.bbb.ccc",
      browserReport: { roundTripMs: 412 },
    })
    expect(String(init?.body)).not.toContain("ひみつの名前")
  })

  it("記録を確認できなかったときは、再送ボタンを出さずに案内を表示する", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          status: "error",
          code: "invalid_trace",
          message: "実行の記録を確認できませんでした。",
        },
        { status: 400 },
      ),
    )
    const user = userEvent.setup()
    renderDetective()
    await user.click(
      screen.getByRole("button", { name: "この実行を AI で解説" }),
    )
    expect(
      await screen.findByText("実行の記録を確認できませんでした。"),
    ).toBeTruthy()
    expect(
      screen.queryByRole("button", { name: "もう一度送信する" }),
    ).toBeNull()
  })

  it("送信中はローディングを表示し、ボタンを押せないため重複して送らない", async () => {
    let resolve!: (response: Response) => void
    fetchMock.mockReturnValue(
      new Promise<Response>((r) => {
        resolve = r
      }),
    )
    const user = userEvent.setup()
    renderDetective()
    await user.click(
      screen.getByRole("button", { name: "この実行を AI で解説" }),
    )

    expect(screen.getByText(/解説を作成しています/)).toBeTruthy()
    const button = screen.getByRole("button", { name: "解説を作成中…" })
    expect((button as HTMLButtonElement).disabled).toBe(true)
    await user.click(button)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    resolve(
      Response.json({
        status: "ok",
        answer: "見出しのない回答",
        references: [],
        cached: false,
        notice: "AI が生成した解説です。",
        sections: null,
      }),
    )
    // 見出しで分けられない回答は、そのまま表示する
    expect(await screen.findByText("見出しのない回答")).toBeTruthy()
  })

  it("通信に失敗したら案内と再送ボタンを表示し、押すともう一度送れる", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"))
    fetchMock.mockResolvedValueOnce(
      Response.json({
        status: "ok",
        answer: "全文",
        references: [],
        cached: false,
        notice: "AI が生成した解説です。",
        sections: {
          observed: "観測の内容",
          lessonExplanation: "教材の内容",
          unobservable: "分からない内容",
        },
      }),
    )
    const user = userEvent.setup()
    renderDetective()
    await user.click(
      screen.getByRole("button", { name: "この実行を AI で解説" }),
    )
    expect(await screen.findByText(/通信状況を確認して/)).toBeTruthy()

    await user.click(screen.getByRole("button", { name: "もう一度送信する" }))
    expect(await screen.findByText("観測の内容")).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
