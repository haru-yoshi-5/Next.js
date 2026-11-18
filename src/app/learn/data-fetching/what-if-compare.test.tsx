// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { WhatIfCompare } from "./what-if-compare"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
describe("比較のAI解説", () => {
  it("表示や更新では送信せず、連打しても一度だけ送る", async () => {
    let resolve!: (value: Response) => void
    const fetchMock = vi.fn<typeof fetch>(
      () =>
        new Promise<Response>((done) => {
          resolve = done
        }),
    )
    vi.stubGlobal("fetch", fetchMock)
    const view = render(<WhatIfCompare />)
    view.rerender(<WhatIfCompare />)
    expect(fetchMock).not.toHaveBeenCalled()
    const button = screen.getByRole("button", { name: "この比較をAIで解説" })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      lessonId: "data-fetching",
      mode: "what_if_compare",
    })
    resolve(
      Response.json({
        status: "ok",
        answer: "一般的な説明",
        references: [],
        notice: "注意",
      }),
    )
    await waitFor(() => expect(screen.getByText("AIによる一般論")).toBeTruthy())
  })
  it("失敗を表示する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          status: "error",
          code: "disabled",
          message: "利用できません",
        }),
      ),
    )
    render(
      <>
        <p>実測（今回のサーバー上のデモ）: 123 ms</p>
        <WhatIfCompare />
      </>,
    )
    fireEvent.click(screen.getByRole("button", { name: "この比較をAIで解説" }))
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain("利用できません"),
    )
    expect(
      screen.getByText("実測（今回のサーバー上のデモ）: 123 ms"),
    ).toBeTruthy()
  })
})
