// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { animate } from "motion/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ShortPlayer, type ShortScene } from "./short-player"

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  animate: vi.fn(),
}))

const scenes: ShortScene[] = [0, 1].map((i) => ({
  id: String(i),
  duration: 1000,
  title: `場面${i}`,
  caption: `説明${i}`,
  tone: "explain",
  nodes: [
    { id: "item", label: "部品", description: "表示", runtime: "server" },
  ],
  metrics: [{ id: "count", label: "個数", value: 1, unit: "個" }],
  codeKey: "code",
}))
const label = "図解ショート"
const code = { code: <p>コード</p> }
let reduced = false
let change: ((event: MediaQueryListEvent) => void) | undefined
beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  reduced = false
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      get matches() {
        return reduced
      },
      addEventListener: (_: string, fn: typeof change) => {
        change = fn
      },
      removeEventListener: () => {},
    }),
  })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  change = undefined
})
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })
describe("図解ショート", () => {
  it("高さを確保する見えない要素は、文字も読み上げも出さない", () => {
    const { container } = render(
      <ShortPlayer
        label={label}
        scenes={[{ ...scenes[0], title: "長い題名の場面" }, scenes[1]]}
        code={code}
      />,
    )
    const reserves = [...container.querySelectorAll("[data-reserve]")]
    // 2 場面分の題名・字幕と、各場面の図・数値の分がある
    expect(reserves.length).toBeGreaterThan(0)
    expect(reserves.map((el) => el.getAttribute("data-reserve"))).toEqual(
      expect.arrayContaining(["長い題名の場面", "場面1", "説明0", "説明1"]),
    )
    for (const el of reserves) {
      // 文字は CSS の content で描くので、DOM の文字は持たない
      expect(el.textContent).toBe("")
      expect(el.closest('[aria-hidden="true"]')).not.toBeNull()
    }
    // 本物の文言は 1 つだけ
    expect(screen.getAllByText("説明0")).toHaveLength(1)
    expect(screen.getAllByRole("heading")).toHaveLength(1)
  })
  it("数値のない場面では、注記の文字を消して場所だけ残す", () => {
    const { container } = render(
      <ShortPlayer
        label={label}
        scenes={[scenes[0], { ...scenes[1], metrics: [] }]}
        code={code}
        metricNote="図の例"
      />,
    )
    const noteReserve = () => container.querySelector('[data-reserve="図の例"]')
    // 数値のある場面は、本物の注記を表示する
    expect(screen.getByText("図の例")).toBeTruthy()
    expect(noteReserve()).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "次へ" }))
    expect(screen.getByRole("heading", { name: "場面1" })).toBeTruthy()
    // 数値のない場面は、文字を出さずに同じ場所を確保する
    expect(screen.queryByText("図の例")).toBeNull()
    const reserve = noteReserve()
    expect(reserve).not.toBeNull()
    expect(reserve?.closest('[aria-hidden="true"]')).toBeTruthy()
  })
  it("id が重複する場面は高さの確保に含めない", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      const { container } = render(
        <ShortPlayer
          label={label}
          scenes={[scenes[0], scenes[1], { ...scenes[1], caption: "重複" }]}
          code={code}
        />,
      )
      const captions = [...container.querySelectorAll("[data-reserve]")].map(
        (el) => el.getAttribute("data-reserve"),
      )
      expect(captions).toContain("説明0")
      expect(captions).not.toContain("説明1")
      expect(captions).not.toContain("重複")
      expect(error).not.toHaveBeenCalled()
    } finally {
      // 途中の確認で失敗しても、次のテストへ差し替えを持ち越さない
      error.mockRestore()
    }
  })
  it("再生、停止、残り時間からの再開とループ", () => {
    render(<ShortPlayer label={label} scenes={scenes} code={code} />)
    advance(400)
    fireEvent.click(screen.getByRole("button", { name: "一時停止" }))
    advance(2000)
    expect(screen.getByRole("heading", { name: "場面0" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "再生" }))
    advance(600)
    expect(screen.getByRole("heading", { name: "場面1" })).toBeTruthy()
    advance(1000)
    expect(screen.getByRole("heading", { name: "場面0" })).toBeTruthy()
  })
  it("手動移動は停止し、もう一度は先頭から再生する", () => {
    render(<ShortPlayer label={label} scenes={scenes} code={code} />)
    fireEvent.click(screen.getByRole("button", { name: "次へ" }))
    advance(2000)
    expect(screen.getByRole("heading", { name: "場面1" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "もう一度" }))
    expect(screen.getByRole("heading", { name: "場面0" })).toBeTruthy()
    advance(1000)
    expect(screen.getByRole("heading", { name: "場面1" })).toBeTruthy()
  })
  it("動きを減らす設定では停止し、解除しても再開しない", () => {
    render(<ShortPlayer label={label} scenes={scenes} code={code} />)
    act(() => {
      reduced = true
      change?.({ matches: true } as MediaQueryListEvent)
    })
    advance(2000)
    act(() => {
      reduced = false
      change?.({ matches: false } as MediaQueryListEvent)
    })
    advance(2000)
    expect(screen.getByRole("heading", { name: "場面0" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "再生" })).toBeTruthy()
  })
  it("動きを減らす設定が最初から有効でも手動で前後に移動できる", () => {
    reduced = true
    render(<ShortPlayer label={label} scenes={scenes} code={code} />)
    advance(2000)
    expect(screen.getByRole("heading", { name: "場面0" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "次へ" }))
    expect(screen.getByRole("heading", { name: "場面1" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "前へ" }))
    expect(screen.getByRole("heading", { name: "場面0" })).toBeTruthy()
  })
  it("コード例にフォーカスがある間は場面を保持し、再生操作で残り時間から再開する", () => {
    render(
      <ShortPlayer
        label={label}
        scenes={scenes}
        code={{ code: <pre tabIndex={0}>コード</pre> }}
      />,
    )
    const snippet = screen.getByText("コード")
    advance(400)
    act(() => snippet.focus())
    advance(2000)
    expect(document.activeElement).toBe(snippet)
    expect(screen.getByRole("heading", { name: "場面0" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "再生" }))
    advance(600)
    expect(screen.getByRole("heading", { name: "場面1" })).toBeTruthy()
  })
  it("場面が変わってもカードを維持し、図と数値のアニメーションを停止・再開する", () => {
    const controls = { play: vi.fn(), pause: vi.fn(), stop: vi.fn() }
    // このテストでは、プレイヤーが使う再生制御だけを代替する。
    vi.mocked(animate).mockReturnValue(
      controls as unknown as ReturnType<typeof animate>,
    )
    const { container } = render(
      <ShortPlayer
        label={label}
        scenes={[
          scenes[0],
          {
            ...scenes[1],
            nodes: [{ ...scenes[1].nodes[0], runtime: "client" }],
            metrics: [{ ...scenes[1].metrics[0], value: 2 }],
          },
        ]}
        code={code}
      />,
    )
    const card = container.querySelector<HTMLElement>("[data-short-node]")
    expect(card).toBeTruthy()
    advance(1000)
    expect(animate).toHaveBeenCalledTimes(2)
    expect(controls.play).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole("button", { name: "一時停止" }))
    expect(controls.pause).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole("button", { name: "再生" }))
    expect(controls.play).toHaveBeenCalledTimes(4)
    expect(container.querySelector("[data-short-node]")).toBe(card)
  })
  it("空の場面は枠を出さず、説明やコードが欠けた場面は代替文を表示", () => {
    const { rerender, container } = render(
      <ShortPlayer label={label} scenes={[]} code={{}} />,
    )
    expect(container.innerHTML).toBe("")
    rerender(
      <ShortPlayer
        label={label}
        scenes={[{ ...scenes[0], caption: "" }]}
        code={{}}
      />,
    )
    expect(screen.getByText("この場面の説明はありません。")).toBeTruthy()
    expect(screen.queryByText("コード")).toBeNull()
  })
  it.each([
    { duration: Number.NaN },
    { tone: "unknown" as ShortScene["tone"] },
    { codeKey: "toString" },
    { nodes: [{ ...scenes[0].nodes[0], runtime: "unknown" as "server" }] },
  ])("不正な場面は字幕だけを表示して停止する (%o)", (overrides) => {
    render(
      <ShortPlayer
        label={label}
        scenes={[scenes[0], { ...scenes[1], ...overrides }]}
        code={code}
      />,
    )
    advance(1000)
    expect(screen.getByText("説明1")).toBeTruthy()
    expect(screen.queryByRole("heading", { name: "場面1" })).toBeNull()
    expect(screen.queryByText("コード")).toBeNull()
    advance(2000)
    expect(screen.getByText("説明1")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "次へ" }))
    expect(screen.getByRole("heading", { name: "場面0" })).toBeTruthy()
  })
})
