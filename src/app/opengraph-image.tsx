import { ImageResponse } from "next/og"

export const alt = "NextScope — See what happens inside Next.js"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const nodes = [
  { label: "Browser", runtime: "CLIENT", color: "#b45309" },
  { label: "Next.js Server", runtime: "SERVER", color: "#0f766e" },
  { label: "Server Component", runtime: "SERVER", color: "#0f766e" },
  { label: "Browser", runtime: "CLIENT", color: "#b45309" },
]

// サイト共通の Open Graph 画像。ビルド時に生成され、静的ファイルとして配信される。
// 日本語フォントを同梱しないため、画像内のテキストは英語にしている。
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#0b0b0c",
        color: "#fafafa",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 30, color: "#a1a1aa", letterSpacing: 4 }}>
          INTERACTIVE NEXT.JS LEARNING
        </div>
        <div style={{ fontSize: 88, fontWeight: 700 }}>NextScope</div>
        <div style={{ fontSize: 38, color: "#d4d4d8" }}>
          See what happens inside Next.js.
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {nodes.map((node, index) => (
          <div
            key={`${node.label}-${index}`}
            style={{ display: "flex", alignItems: "center", gap: 18 }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: "16px 22px",
                border: "2px solid #3f3f46",
                borderRadius: 14,
              }}
            >
              <div style={{ fontSize: 26 }}>{node.label}</div>
              <div
                style={{ fontSize: 18, color: node.color, letterSpacing: 2 }}
              >
                {node.runtime}
              </div>
            </div>
            {index < nodes.length - 1 ? (
              <div style={{ fontSize: 32, color: "#71717a" }}>→</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>,
    size,
  )
}
