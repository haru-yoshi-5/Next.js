import { ArrowLeftIcon, FileCode2Icon } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

interface ArticleFrameProps {
  /** この表示を担当しているファイル */
  file: string
  children: ReactNode
}

/** 記事ページの共通の枠。どのファイルが表示しているかを明示する */
export function ArticleFrame({ file, children }: ArticleFrameProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 lg:px-10">
      <Link
        href="/learn/dynamic-routes"
        className="flex items-center gap-1 self-start text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeftIcon aria-hidden className="size-4" />
        Dynamic Routes 教材へ戻る
      </Link>
      <p className="flex min-w-0 items-center gap-1.5 font-mono text-xs break-all text-muted-foreground">
        <FileCode2Icon aria-hidden className="size-3.5 shrink-0" />
        {file}
      </p>
      {children}
    </div>
  )
}
