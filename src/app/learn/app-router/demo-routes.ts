export interface DemoRoute {
  slug: string
  /** ナビゲーションに表示する名前 */
  title: string
  summary: string
  points: string[]
}

/**
 * [slug] に対応するデモ用ページのデータ。
 * generateStaticParams でこの一覧をビルド時にプリレンダーする。
 */
export const demoRoutes: DemoRoute[] = [
  {
    slug: "page-file",
    title: "page.tsx",
    summary:
      "URL に対応する画面そのもの。page.tsx があるフォルダだけが URL として公開される。",
    points: [
      "app/learn/app-router/page.tsx → /learn/app-router",
      "app/learn/app-router/[slug]/page.tsx → /learn/app-router/page-file など",
      "page.tsx のないフォルダ（コンポーネント置き場など）は URL にならない",
    ],
  },
  {
    slug: "layout-file",
    title: "layout.tsx",
    summary:
      "配下のページで共有される UI。ページを移動しても再レンダリングされず、state が保たれる。",
    points: [
      "layout は children として配下のページを受け取る",
      "このデモの左上にあるメモ欄は layout 側にあるため、移動しても消えない",
      "layout は入れ子にでき、外側から順に内側を包む",
    ],
  },
  {
    slug: "link-component",
    title: "<Link>",
    summary: "ページ全体を再読み込みせずに移動するためのコンポーネント。",
    points: [
      "画面内に表示されたリンク先は、あらかじめ読み込まれる（プリフェッチ）",
      "移動時は変化したセグメントの描画結果だけを受け取る",
      "ブラウザの戻る / 進むにも対応する",
    ],
  },
]

export function findDemoRoute(slug: string) {
  return demoRoutes.find((route) => route.slug === slug)
}
