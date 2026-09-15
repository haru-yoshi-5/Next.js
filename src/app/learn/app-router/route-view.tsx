import { FileCode2Icon } from "lucide-react"
import type { ReactNode } from "react"

interface RouteViewProps {
  /** このページを描画しているファイル */
  file: string
  /** page に渡された params（Dynamic Route の場合） */
  params?: Record<string, string>
  title: string
  children: ReactNode
}

/** デモ用ページの共通表示。「どのファイルがマッチしたか」を明示する */
export function RouteView({ file, params, title, children }: RouteViewProps) {
  return (
    <article className="flex flex-col gap-3">
      <dl className="grid gap-1 rounded-md bg-muted/50 px-3 py-2 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-x-2">
          <dt className="text-muted-foreground">matched</dt>
          <dd className="flex items-center gap-1">
            <FileCode2Icon aria-hidden className="size-3" />
            {file}
          </dd>
        </div>
        {params ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted-foreground">params</dt>
            <dd>{JSON.stringify(params)}</dd>
          </div>
        ) : null}
      </dl>
      <h3 className="font-semibold">{title}</h3>
      {children}
    </article>
  )
}
