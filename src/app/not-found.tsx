import type { Metadata } from "next"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "ページが見つかりません",
}

// 存在しない URL にアクセスしたときに表示される（Server Component）
export default function NotFound() {
  return (
    <main
      id="main-content"
      // not-found.tsx 教材の Live Demo が、表示されたファイルを見つけるための目印
      data-nsc-rendered-file="app/not-found.tsx"
      className="mx-auto flex max-w-xl flex-1 flex-col items-start justify-center gap-4 px-4 py-24"
    >
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">
        ページが見つかりません
      </h1>
      <p className="leading-relaxed text-muted-foreground">
        URL
        が間違っているか、ページが移動した可能性があります。教材一覧から目的のページを探してください。
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href="/learn" className={buttonVariants()}>
          教材一覧へ
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          トップページへ
        </Link>
      </div>
    </main>
  )
}
