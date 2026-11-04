import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { findOrder, ORDERS } from "../../demo-data"
import { DemoFrame } from "../../demo-frame"

export async function generateMetadata({
  params,
}: PageProps<"/learn/not-found-file/orders/[id]">): Promise<Metadata> {
  const { id } = await params
  return {
    title: `${findOrder(id) ? `注文 ${id}` : "注文が見つかりません"} | not-found.tsx`,
  }
}

// 存在する注文だけをビルド時にプリレンダーする
export function generateStaticParams() {
  return ORDERS.map(({ id }) => ({ id }))
}

export default async function OrderPage({
  params,
}: PageProps<"/learn/not-found-file/orders/[id]">) {
  const { id } = await params
  const order = findOrder(id)

  // このフォルダには not-found.tsx がない。notFound() は親フォルダへ伝わり、
  // app/learn/not-found-file/not-found.tsx が表示される
  if (!order) notFound()

  return (
    <DemoFrame
      file="app/learn/not-found-file/orders/[id]/page.tsx"
      title={`注文 ${order.id}`}
    >
      <dl className="grid gap-1 rounded-md bg-muted/50 px-3 py-2 font-mono text-xs">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">商品</dt>
          <dd>{order.itemName}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">数量</dt>
          <dd>{order.quantity}</dd>
        </div>
      </dl>
      <p className="leading-relaxed text-muted-foreground">
        注文が見つかったため、page.tsx がそのまま表示されています。
      </p>
    </DemoFrame>
  )
}
