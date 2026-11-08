export const BASE_PATH = "/learn/not-found-file"

/** proxy.ts が判断の結果を載せるレスポンスヘッダー。Live Demo が実測の根拠として読む */
export const PROXY_HEADER = "x-nsc-proxy"
export type ProxyDecision = "found" | "missing"

/** 描画したファイルを示す属性。Live Demo が、実際に表示されたファイルを DOM から見つける */
export const RENDERED_FILE_ATTR = "data-nsc-rendered-file"

export interface Item {
  id: string
  name: string
  price: number
}

export interface Order {
  id: string
  itemName: string
  quantity: number
}

/** デモの商品。この3件以外の ID は「存在しない商品」になる */
export const ITEMS: Item[] = [
  { id: "1", name: "方眼ノート", price: 480 },
  { id: "2", name: "ゲルインクペン", price: 220 },
  { id: "3", name: "マスキングテープ", price: 350 },
]

/** デモの注文。この2件以外の ID は「存在しない注文」になる */
export const ORDERS: Order[] = [
  { id: "101", itemName: "方眼ノート", quantity: 2 },
  { id: "102", itemName: "ゲルインクペン", quantity: 5 },
]

export function findItem(id: string) {
  return ITEMS.find((item) => item.id === id)
}

export function findOrder(id: string) {
  return ORDERS.find((order) => order.id === id)
}
