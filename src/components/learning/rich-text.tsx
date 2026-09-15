import { Fragment } from "react"

/**
 * `バッククォート` で囲まれた部分をインラインコードとして表示する。
 * HTML 文字列を解釈しないため、教材データに HTML を書く必要がなく XSS の心配もない。
 */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g)

  return parts.map((part, index) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 1 ? (
      <code
        key={index}
        className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]"
      >
        {part.slice(1, -1)}
      </code>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  )
}
