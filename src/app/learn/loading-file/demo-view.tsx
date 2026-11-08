import { FileCode2Icon } from "lucide-react"
import type { ReactNode } from "react"

interface DemoViewProps {
  /** この表示を担当しているファイル */
  file: string
  title: string
  children: ReactNode
}

/** デモ用ページの共通表示。どのファイルが表示しているかを明示する */
export function DemoView({ file, title, children }: DemoViewProps) {
  return (
    <article className="flex flex-col gap-3">
      <p className="flex min-w-0 items-center gap-1.5 font-mono text-xs break-all text-muted-foreground">
        <FileCode2Icon aria-hidden className="size-3.5 shrink-0" />
        {file}
      </p>
      <h3 className="font-semibold">{title}</h3>
      {children}
    </article>
  )
}
