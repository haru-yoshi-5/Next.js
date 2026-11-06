import { type NextRequest, NextResponse } from "next/server"

import {
  BASE_PATH,
  findItem,
  PROXY_HEADER,
  type ProxyDecision,
} from "./app/learn/not-found-file/demo-data"
import {
  guardProxiedPage,
  PROXIED_PATH,
} from "./app/learn/protected-pages/proxy-guard"

const CHECKED_PREFIX = `${BASE_PATH}/checked/`

/**
 * このサイトの proxy。matcher の URL だけで動き、教材ごとの処理にパスで振り分ける。
 * それぞれの処理は、自分の URL のリクエストだけを扱って完結させる。
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === PROXIED_PATH) return guardProxiedPage(request)
  if (pathname.startsWith(CHECKED_PREFIX)) return rewriteCheckedItem(request)
  return NextResponse.next()
}

/**
 * not-found.tsx 教材のデモ。
 *
 * page.tsx の中で notFound() を呼ぶと、ステータスは 200 で送信が始まった後なので 404 にできない。
 * ここでは描画の前に商品の有無を確かめ、ない場合はどのルートにも一致しない URL に書き換える。
 * ルートが決まらないため app/not-found.tsx が使われ、ステータスは 404 になる。
 */
function rewriteCheckedItem(request: NextRequest) {
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
  // matcher はビルド時に読み取られるため、定数ではなく文字列で書く
  matcher: [
    "/learn/not-found-file/checked/:id",
    "/learn/protected-pages/proxied",
  ],
}
