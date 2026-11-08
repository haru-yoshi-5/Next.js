import Link from "next/link"

import { BASE_PATH, ITEMS } from "../../demo-data"
import { DemoFrame } from "../../demo-frame"

// items/[id]/page.tsx が notFound() を呼んだときに表示される（Server Component）。
// props は受け取らないため、どの ID が見つからなかったかはここでは分からない
export default function ItemNotFound() {
  return (
    <DemoFrame
      file="app/learn/not-found-file/items/[id]/not-found.tsx"
      title="商品が見つかりません"
    >
      <p className="leading-relaxed text-muted-foreground">
        page.tsx が notFound()
        を呼んだため、同じフォルダにあるこのファイルが代わりに表示されています。商品が削除されたか、URL
        が間違っている可能性があります。
      </p>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">取り扱い中の商品</h2>
        <ul className="flex flex-wrap gap-2 text-sm">
          {ITEMS.map((item) => (
            <li key={item.id}>
              <Link
                href={`${BASE_PATH}/items/${item.id}`}
                className="underline-offset-4 hover:underline"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </DemoFrame>
  )
}
