/** デモのページがサーバーで描画にかける時間（ms） */
export const RENDER_DELAY_MS = 1500

export const BASE_PATH = "/learn/loading-file"

export type DemoPageKey = "with-loading" | "without-loading" | "with-suspense"

/**
 * - loading: loading.tsx の表示に切り替わる
 * - suspense: page の静的な部分と、page 内の <Suspense> の fallback に切り替わる
 * - none: 待ちの表示がなく、内容が届くまで前の画面のまま
 */
export type WaitingUi = "loading" | "suspense" | "none"

export interface DemoPage {
  key: DemoPageKey
  href: string
  label: string
  /** 遷移先を担当するファイル */
  file: string
  waitingUi: WaitingUi
  description: string
}

export const demoPages: DemoPage[] = [
  {
    key: "with-loading",
    href: `${BASE_PATH}/with-loading`,
    label: "loading.tsx あり",
    file: "app/learn/loading-file/with-loading/page.tsx",
    waitingUi: "loading",
    description: "同じフォルダに loading.tsx がある",
  },
  {
    key: "without-loading",
    href: `${BASE_PATH}/without-loading`,
    label: "loading.tsx なし",
    file: "app/learn/loading-file/without-loading/page.tsx",
    waitingUi: "none",
    description: "loading.tsx も <Suspense> もない",
  },
  {
    key: "with-suspense",
    href: `${BASE_PATH}/with-suspense`,
    label: "page 内の <Suspense>",
    file: "app/learn/loading-file/with-suspense/page.tsx",
    waitingUi: "suspense",
    description: "遅い部分だけを <Suspense> で囲む",
  },
]
