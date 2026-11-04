import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { findItem, ITEMS } from "../../demo-data"
import { DemoFrame } from "../../demo-frame"

const priceFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
})

export async function generateMetadata({
  params,
}: PageProps<"/learn/not-found-file/items/[id]">): Promise<Metadata> {
  const { id } = await params
  return {
    title: `${findItem(id)?.name ?? "商品が見つかりません"} | not-found.tsx`,
  }
}

// 存在する商品だけをビルド時にプリレンダーする
export function generateStaticParams() {
  return ITEMS.map(({ id }) => ({ id }))
}

export default async function ItemPage({
  params,
}: PageProps<"/learn/not-found-file/items/[id]">) {
  const { id } = await params
  const item = findItem(id)

  // 見つからなければ notFound() を呼ぶ。throw して描画を止め、
  // 一番近い not-found.tsx（このフォルダの not-found.tsx）が代わりに表示される
  if (!item) notFound()

  return (
    <DemoFrame
      file="app/learn/not-found-file/items/[id]/page.tsx"
      title={item.name}
    >
      <dl className="grid gap-1 rounded-md bg-muted/50 px-3 py-2 font-mono text-xs">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">id</dt>
          <dd>{item.id}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">価格</dt>
          <dd>{priceFormatter.format(item.price)}</dd>
        </div>
      </dl>
      <p className="leading-relaxed text-muted-foreground">
        商品が見つかったため、page.tsx がそのまま表示されています。
      </p>
    </DemoFrame>
  )
}
