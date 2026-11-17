// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react"
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
