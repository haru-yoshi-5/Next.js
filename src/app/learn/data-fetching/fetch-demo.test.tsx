import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { FetchDemo } from "./fetch-demo"

vi.mock("next/cache", () => ({ io: vi.fn() }))
vi.mock("@/lib/ai/config", () => ({
  readAiConfig: () => ({ status: "disabled" }),
}))
vi.mock("./fetch-panel", () => ({
  FetchPanel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))
vi.mock("./fetch-strategies", () => {
  const run = { totalMs: 100, calls: [], author: { name: "著者" }, posts: [] }
  return {
    fetchSequentially: async () => run,
    fetchInParallel: async () => run,
  }
})
vi.mock("./trace", () => ({ buildFetchTrace: () => ({}) }))

describe("データ取得デモ", () => {
  it("AI無効でもサーバー上の実測と利用不可の案内を表示する", async () => {
    const html = renderToStaticMarkup(await FetchDemo())
    expect(html).toContain("実測（今回のサーバー上のデモ）")
    expect(html).toContain("100 ms")
    expect(html).toContain("現在使えません")
  })
})
