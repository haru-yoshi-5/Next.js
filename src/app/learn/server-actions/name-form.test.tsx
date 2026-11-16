// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { XRayEntry } from "@/components/learning/x-ray-details"

import { NameForm } from "./name-form"

vi.mock("./actions", () => ({ saveName: vi.fn() }))

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock)
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
})
afterEach(() => {
  cleanup()
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

const entries: XRayEntry[] = [
  {
    id: "submit-button",
    label: "保存するボタン",
    component: "NameForm",
    nodes: ["client-component"],
    firstLine: 20,
    runtime: { runtime: "client", basis: "use client" },
    source: {
      fileName: "name-form.tsx",
      path: "src/app/learn/server-actions/name-form.tsx",
      lines: [[{ content: "async function saveNameWithTiming(" }]],
      directive: "use client",
    },
  },
  {
    id: "guestbook-list",
    label: "保存された名前の一覧",
    component: "GuestbookList",
    nodes: ["server-component", "cache"],
    firstLine: 17,
    runtime: { runtime: "server", basis: "教材" },
    source: {
      fileName: "guestbook-list.tsx",
      path: "src/app/learn/server-actions/guestbook-list.tsx",
      lines: [[{ content: "export async function GuestbookList() {" }]],
      directive: null,
    },
  },
]

function renderDemo(isAiAvailable: boolean) {
  render(
    <NameForm
      list={null}
      xRayEntries={entries}
      isAiAvailable={isAiAvailable}
    />,
  )
  return within(screen.getByRole("region", { name: "AI X-Ray Mode" }))
}

describe("Server Actions の X-Ray", () => {
  it("AI が無効でもデモ要素とノードをキーボードで選択できる", async () => {
    const user = userEvent.setup()
    const details = renderDemo(false)

    const demoButton = screen.getByRole("button", { name: "保存するボタン" })
    demoButton.focus()
    await user.keyboard("{Enter}")
    expect(demoButton.getAttribute("aria-pressed")).toBe("true")
    expect(details.getByText("NameForm")).toBeTruthy()
    expect(details.getByText("20")).toBeTruthy()
    expect(
      (
        details.getByRole("button", {
          name: "この実装を AI で解説",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
    expect(details.getByText(/AI 解説は現在使えません/)).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()

    const node = screen.getByRole("button", { name: "Server Component" })
    node.focus()
    await user.keyboard(" ")
    expect(node.getAttribute("aria-pressed")).toBe("true")
    expect(details.getByText("GuestbookList")).toBeTruthy()
    expect(details.getByText(/Server Component、Cache/)).toBeTruthy()

    await user.click(screen.getByRole("button", { name: "Browser" }))
    expect(details.getByText("Browserは未対応です。")).toBeTruthy()
    expect(details.queryByRole("figure")).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("解説ボタンだけが送信し、切り替え前の応答を表示しない", async () => {
    const user = userEvent.setup()
    let finish!: (value: Response) => void
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve
      }),
    )
    const details = renderDemo(true)
    await user.type(screen.getByLabelText("名前"), "入力した名前")
    await user.click(screen.getByRole("button", { name: "保存するボタン" }))
    expect(details.getByText(/公開教材の内容を Gemini に送ります/)).toBeTruthy()
    expect(details.getByText(/日本国内の 18 歳以上/)).toBeTruthy()
    expect(details.getByText(/24 時間有効な匿名 Cookie/)).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
    await user.dblClick(
      details.getByRole("button", { name: "この実装を AI で解説" }),
    )
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      lessonId: "server-actions",
      mode: "code_explain",
      selectedComponentId: "submit-button",
    })
    await user.click(screen.getByRole("button", { name: "Server Component" }))
    await act(async () => {
      finish(Response.json({ status: "ok", answer: "前の選択の解説" }))
    })
    expect(details.getByText("GuestbookList")).toBeTruthy()
    expect(details.queryByText("前の選択の解説")).toBeNull()
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it("切り替え中も生成状態と結果を要素ごとに保持する", async () => {
    const user = userEvent.setup()
    let finishA!: (value: Response) => void
    let finishB!: (value: Response) => void
    fetchMock
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finishA = resolve
        }),
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finishB = resolve
        }),
      )
    const details = renderDemo(true)
    const selectA = () =>
      user.click(screen.getByRole("button", { name: "保存するボタン" }))
    const selectB = () =>
      user.click(screen.getByRole("button", { name: "保存された名前の一覧" }))
    const explain = () =>
      details.getByRole("button", {
        name: "この実装を AI で解説",
      }) as HTMLButtonElement

    await selectA()
    await user.click(explain())
    await selectB()
    await user.click(explain())
    await selectA()
    expect(explain().disabled).toBe(true)
    await user.click(explain())
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(details.getByText("解説を作成しています…")).toBeTruthy()

    await act(async () => {
      finishB(Response.json({ status: "ok", answer: "B の回答" }))
    })
    expect(details.queryByText("B の回答")).toBeNull()
    await act(async () => {
      finishA(Response.json({ status: "ok", answer: "A の回答" }))
    })
    expect(details.getByText("A の回答")).toBeTruthy()
    await user.click(screen.getByRole("button", { name: "Browser" }))
    await selectB()
    expect(details.getByText("B の回答")).toBeTruthy()
    await selectA()
    expect(details.getByText("A の回答")).toBeTruthy()
  })
})
