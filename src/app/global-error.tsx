"use client"

// ルートレイアウト自体でエラーが起きた場合の最終的な表示。
// global-error は独自の <html> / <body> を持ち、グローバル CSS が読み込まれないため、最小限のインラインスタイルで描画する。
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          padding: "1rem",
        }}
      >
        <title>エラーが発生しました | NextScope</title>
        <main role="alert" style={{ maxWidth: "32rem" }}>
          <h1 style={{ fontSize: "1.5rem" }}>サイトを表示できませんでした</h1>
          <p style={{ lineHeight: 1.7 }}>
            一時的な問題の可能性があります。もう一度読み込んでください。
          </p>
          {error.digest ? (
            <p style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
              エラーID: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => retry()}
            style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
          >
            もう一度読み込む
          </button>
        </main>
      </body>
    </html>
  )
}
