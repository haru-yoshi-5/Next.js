import { type NextRequest, NextResponse } from "next/server"

import {
  BASE_PATH,
  findItem,
  PROXY_HEADER,
  type ProxyDecision,
} from "./app/learn/not-found-file/demo-data"

const CHECKED_PREFIX = `${BASE_PATH}/checked/`

/**
 * not-found.tsx 教材のデモ用の proxy。matcher の URL だけで動く。
 *
 * page.tsx の中で notFound() を呼ぶと、ステータスは 200 で送信が始まった後なので 404 にできない。
 * ここでは描画の前に商品の有無を確かめ、ない場合はどのルートにも一致しない URL に書き換える。
 * ルートが決まらないため app/not-found.tsx が使われ、ステータスは 404 になる。
 */
export function proxy(request: NextRequest) {
  const id = request.nextUrl.pathname.slice(CHECKED_PREFIX.length)
  const item = findItem(id)

  // 存在する商品は items/[id] を表示する。URL は checked/[id] のまま変わらない。
  // 存在しない商品は _missing へ。_ で始まるフォルダはルートにならないため、必ず一致しない
  const destination = item
    ? `${BASE_PATH}/items/${item.id}`
    : `${BASE_PATH}/_missing`
  const decision: ProxyDecision = item ? "found" : "missing"

  const response = NextResponse.rewrite(new URL(destination, request.url))
  // Live Demo が proxy の判断を確かめられるよう、レスポンスヘッダーに載せる
  response.headers.set(PROXY_HEADER, decision)
  return response
}

export const config = {
  matcher: "/learn/not-found-file/checked/:id",
}
