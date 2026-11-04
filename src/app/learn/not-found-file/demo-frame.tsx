import { ArrowLeftIcon, FileCode2Icon } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { BASE_PATH, RENDERED_FILE_ATTR } from "./demo-data"

interface DemoFrameProps {
  /** この表示を担当しているファイル */
  file: string
  title: string
  children: ReactNode
}

/**
 * デモのページと not-found.tsx の共通の枠。どのファイルが表示しているかを明示する。
 * 同じ値を属性にも書き、Live Demo が実際に表示されたファイルを DOM から見つけられるようにする。
 */
export function DemoFrame({ file, title, children }: DemoFrameProps) {
  return (
    <div
      {...{ [RENDERED_FILE_ATTR]: file }}
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 lg:px-10"
    >
      <Link
        href={BASE_PATH}
        className="flex items-center gap-1 self-start text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeftIcon aria-hidden className="size-4" />
        not-found.tsx 教材へ戻る
      </Link>
      <p className="flex min-w-0 items-center gap-1.5 font-mono text-xs break-all text-muted-foreground">
        <FileCode2Icon aria-hidden className="size-3.5 shrink-0" />
        {file}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
    </div>
  )
}
