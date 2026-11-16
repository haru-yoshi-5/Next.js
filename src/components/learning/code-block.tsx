import type { CSSProperties } from "react"

import { RuntimeBadge } from "@/components/visualizer/runtime-badge"
import type {
  CodeToken,
  HighlightedSource,
  ResolvedRuntime,
} from "@/lib/source-code"

interface CodeBlockProps {
  source: HighlightedSource
  runtime: ResolvedRuntime
  role: string
  description: string
  firstLine?: number
}

/** ライトテーマの色は color、ダークテーマの色は CSS 変数 --shiki-dark で渡す */
function tokenStyle(token: CodeToken): CSSProperties {
  return {
    color: token.color,
    fontStyle: token.fontStyle,
    ["--shiki-dark" as string]: token.darkColor,
  }
}

/** ハイライト済みトークンを描画するエディタ風コードブロック（Server Component） */
export function CodeBlock({
  source,
  runtime,
  role,
  description,
  firstLine = 1,
}: CodeBlockProps) {
  return (
    <figure className="overflow-hidden rounded-lg border">
      <figcaption className="flex flex-col gap-2 border-b bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs text-muted-foreground">
            {source.path}
          </p>
          <p className="mt-0.5 text-sm">{description}</p>
        </div>
        <RuntimeBadge runtime={runtime.runtime} detail={role} />
      </figcaption>
      <pre
        tabIndex={0}
        aria-label={`${source.fileName} のソースコード`}
        className="max-h-[32rem] overflow-auto bg-code py-3 font-mono text-[0.8rem] leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <code className="grid min-w-max">
          {source.lines.map((line, lineIndex) => (
            <span key={lineIndex} className="flex pr-6">
              <span
                aria-hidden
                className="sticky left-0 w-12 shrink-0 bg-code pr-4 text-right text-muted-foreground/50 select-none"
              >
                {lineIndex + firstLine}
              </span>
              <span>
                {line.map((token, tokenIndex) => (
                  <span
                    key={tokenIndex}
                    className="code-token"
                    style={tokenStyle(token)}
                  >
                    {token.content}
                  </span>
                ))}
                {"\n"}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </figure>
  )
}
