// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { EXPLAIN_ENDPOINT } from "@/lib/ai/client"

import { AiTutorPanel } from "./ai-tutor-panel"

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  cleanup()
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

const okBody = {
  status: "ok",
  answer: "## ポイント\n* **サーバー**で動きます",
  references: [
    { slug: "caching", title: "キャッシュ", href: "/learn/caching" },
    // 教材以外のリンクは表示しない
    { slug: "evil", title: "外部", href: "javascript:alert(1)" },
  ],
  cached: false,
  notice: "AI が生成した解説です。",
}

/** 解決を手で決められる Promise（送信中の状態を確かめるため） */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

async function openPanel() {
  const user = userEvent.setup()
  render(
    <AiTutorPanel lessonId="server-actions" lessonTitle="Server Actions" />,
  )
  await user.click(screen.getByRole("button", { name: /AI に質問する/ }))
  const textarea = await screen.findByRole("textbox", { name: "質問" })
  return { user, textarea }
}

describe("AiTutorPanel", () => {
  it("開いた直後は、まだ質問していないことと質問の例を表示し、API は呼ばない", async () => {
    const { user, textarea } = await openPanel()

    expect(screen.getByText(/まだ質問していません/)).toBeTruthy()
    await user.click(
      screen.getByRole("button", {
        name: "この教材のポイントを短くまとめてください",
      }),
    )
    expect((textarea as HTMLTextAreaElement).value).toBe(
      "この教材のポイントを短くまとめてください",
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("空のまま送信すると、入力のエラーを表示し、API は呼ばない", async () => {
    const { user } = await openPanel()

    await user.click(screen.getByRole("button", { name: "送信する" }))

    expect(screen.getByRole("alert").textContent).toBe(
      "質問を入力してください。",
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("送信中は送信ボタンを止め、回答が届いたら整形して表示する", async () => {
    const pending = deferred<Response>()
    fetchMock.mockReturnValue(pending.promise)
    const { user, textarea } = await openPanel()

    await user.type(textarea, "  なぜサーバー？  ")
    await user.click(screen.getByRole("button", { name: "送信する" }))

    const sending = screen.getByRole("button", { name: "送信中…" })
    expect((sending as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(/回答を作成しています/)).toBeTruthy()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(EXPLAIN_ENDPOINT)
    expect(JSON.parse(String(init?.body))).toEqual({
      lessonId: "server-actions",
      mode: "context_tutor",
      question: "なぜサーバー？",
    })

    pending.resolve(Response.json(okBody))

    expect(await screen.findByText(/サーバーで動きます/)).toBeTruthy()
    const answer = screen.getByText(/サーバーで動きます/)
    expect(answer.textContent).toBe("ポイント\n・サーバーで動きます")
    expect(
      screen.getByRole("link", { name: /キャッシュ/ }).getAttribute("href"),
    ).toBe("/learn/caching")
    expect(screen.queryByRole("link", { name: /外部/ })).toBeNull()
    expect(screen.getByRole("button", { name: "送信する" })).toBeTruthy()
  })

  it("送信の操作を続けて行っても、API は 1 回だけ呼ぶ", async () => {
    const pending = deferred<Response>()
    fetchMock.mockReturnValue(pending.promise)
    const { user, textarea } = await openPanel()

    await user.type(textarea, "質問")
    // Ctrl + Enter の連打（ボタンの無効化を経由しない送信）
    await user.keyboard("{Control>}{Enter}{Enter}{Enter}{/Control}")

    expect(fetchMock).toHaveBeenCalledTimes(1)
    pending.resolve(Response.json(okBody))
    expect(await screen.findByText(/サーバーで動きます/)).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("通信に失敗したらエラーを表示し、もう一度送信すると同じ質問で回答を得られる", async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(Response.json(okBody))
    const { user, textarea } = await openPanel()

    await user.type(textarea, "再試行の質問")
    await user.click(screen.getByRole("button", { name: "送信する" }))

    expect(await screen.findByText(/通信状況を確認して/)).toBeTruthy()
    await user.click(screen.getByRole("button", { name: "もう一度送信する" }))

    expect(await screen.findByText(/サーバーで動きます/)).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body)).question).toBe(
      "再試行の質問",
    )
  })

  it("JSON でない応答は、読み取れなかったエラーとして表示する", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html>502</html>", { status: 502 }),
    )
    const { user, textarea } = await openPanel()

    await user.type(textarea, "質問")
    await user.click(screen.getByRole("button", { name: "送信する" }))

    expect(
      await screen.findByText(/AI の応答を読み取れませんでした/),
    ).toBeTruthy()
    expect(
      screen.getByRole("button", { name: "もう一度送信する" }),
    ).toBeTruthy()
  })

  it("送り直しても変わらないエラーには、再試行のボタンを出さない", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          status: "error",
          code: "rate_limited",
          message: "今日の上限に達しました。",
        },
        { status: 429 },
      ),
    )
    const { user, textarea } = await openPanel()

    await user.type(textarea, "質問")
    await user.click(screen.getByRole("button", { name: "送信する" }))

    expect(await screen.findByText("今日の上限に達しました。")).toBeTruthy()
    expect(
      screen.queryByRole("button", { name: "もう一度送信する" }),
    ).toBeNull()
  })

  it("送信中にパネルを閉じても、開き直すと届いた回答が表示される", async () => {
    const pending = deferred<Response>()
    fetchMock.mockReturnValue(pending.promise)
    const { user, textarea } = await openPanel()

    await user.type(textarea, "閉じても残る？")
    await user.click(screen.getByRole("button", { name: "送信する" }))
    await user.click(screen.getByRole("button", { name: "閉じる" }))
    await waitFor(() =>
      expect(screen.queryByRole("textbox", { name: "質問" })).toBeNull(),
    )

    // 閉じている間も、パネルを開くボタンで送信中であることがわかる
    expect(screen.getByLabelText("回答を作成中")).toBeTruthy()
    pending.resolve(Response.json(okBody))
    await waitFor(() =>
      expect(screen.queryByLabelText("回答を作成中")).toBeNull(),
    )

    await user.click(screen.getByRole("button", { name: /AI に質問する/ }))
    expect(await screen.findByText(/サーバーで動きます/)).toBeTruthy()
    // 「質問: …」の行（入力欄ではなく、回答の上に出す質問）
    expect(screen.getByText("閉じても残る？", { selector: "p" })).toBeTruthy()
    expect(
      (screen.getByRole("textbox", { name: "質問" }) as HTMLTextAreaElement)
        .value,
    ).toBe("閉じても残る？")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
