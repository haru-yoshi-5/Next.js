import { FileCode2Icon, LoaderIcon } from "lucide-react"
import { type ReactNode, Suspense } from "react"

interface DemoPageViewProps {
  /** この表示を担当しているファイル */
  file: string
  title: string
  description: ReactNode
  /** <Suspense> の中で描画する部分（cookie などリクエスト時の値を読む） */
  children: ReactNode
  fallback: string
}

/**
 * Live Demo の枠に表示するページの共通部分。
 * 見出しと説明は静的なまま配信し、リクエスト時に確かめる部分だけを <Suspense> の中に置く。
 * 見出しと説明には、守る内容を書かない。
 */
export function DemoPageView({
  file,
  title,
  description,
  children,
  fallback,
}: DemoPageViewProps) {
  return (
    <article className="flex flex-col gap-3">
      <p className="flex min-w-0 items-center gap-1.5 font-mono text-xs break-all text-muted-foreground">
        <FileCode2Icon aria-hidden className="size-3.5 shrink-0" />
        {file}
      </p>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <Suspense
        fallback={
          <p
            role="status"
            className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
          >
            <LoaderIcon
              aria-hidden
              className="size-4 motion-safe:animate-spin"
            />
            {fallback}
          </p>
        }
      >
        {children}
      </Suspense>
    </article>
  )
}
