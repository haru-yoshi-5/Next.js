import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/app-router"

export const appRouterLesson: LessonContent = {
  slug: "app-router",
  title: "App Router",
  lead: "App Router では、`app` フォルダの構成がそのまま URL になります。`page.tsx` が画面を、`layout.tsx` が複数のページで共有する枠を表し、ページを移動しても layout は保たれたまま中身だけが切り替わります。",
  keyPoints: [
    "フォルダと `page.tsx` から URL が決まる仕組み",
    "`layout.tsx` がページ遷移で再レンダリングされない理由",
    "`[slug]` による Dynamic Routes と `notFound()`",
  ],
  sections: [
    {
      id: "folders-are-routes",
      title: "フォルダが URL になる",
      blocks: [
        {
          type: "paragraph",
          text: "App Router では `app` フォルダの中のフォルダ1つが URL のセグメント1つに対応します。そのフォルダに `page.tsx` を置くと、その URL で表示される画面になります。",
        },
        {
          type: "list",
          items: [
            "`app/page.tsx` → `/`",
            "`app/learn/page.tsx` → `/learn`",
            "`app/learn/app-router/page.tsx` → `/learn/app-router`",
            "`app/learn/app-router/[slug]/page.tsx` → `/learn/app-router/page-file` など",
          ],
        },
        {
          type: "callout",
          tone: "note",
          title: "page.tsx のないフォルダは公開されない",
          text: "フォルダを作っただけでは URL になりません。そのため、ページ専用のコンポーネントやデータを同じフォルダに置いておけます。このページの `route-demo-panel.tsx` や `demo-routes.ts` も同じフォルダにありますが、URL にはなりません。",
        },
      ],
    },
    {
      id: "layout",
      title: "layout.tsx は移動しても保たれる",
      blocks: [
        {
          type: "paragraph",
          text: "`layout.tsx` は、同じフォルダ以下のすべてのページを `children` として受け取り、共通の枠で包みます。ページを移動しても layout は再マウントされないため、layout の中にある入力欄の値やスクロール位置などの state がそのまま残ります。",
        },
        {
          type: "paragraph",
          text: "実はこの教材ページは、解説や Source Code を含む本体を `app-router/layout.tsx` に置いています。Live Demo の枠の中が `children` で、リンクを押すとそこだけが `page.tsx` や `[slug]/page.tsx` に切り替わります。",
        },
      ],
    },
    {
      id: "dynamic-routes",
      title: "Dynamic Routes と notFound()",
      blocks: [
        {
          type: "paragraph",
          text: "フォルダ名を `[slug]` のように角括弧で囲むと、その部分に任意の値が入る Dynamic Route になります。値は page の `params` として受け取れます（`params` は Promise なので `await` して使います）。",
        },
        {
          type: "paragraph",
          text: "`generateStaticParams` で返した値はビルド時にプリレンダーされます。それ以外の値はリクエスト時に処理され、対応するデータがなければ `notFound()` を呼んで `not-found.tsx` を表示します。待ち時間がある場合は `loading.tsx` が自動で表示されます。",
        },
      ],
    },
    {
      id: "link",
      title: "<Link> によるクライアントナビゲーション",
      blocks: [
        {
          type: "comparison",
          columns: [
            {
              runtime: "client",
              title: "ブラウザで行われること",
              items: [
                "クリックを受けて URL を書き換える（ページ全体は再読み込みしない）",
                "表示中のリンク先を事前にプリフェッチしておく",
                "受け取った結果で、変化した部分だけを差し替える",
              ],
            },
            {
              runtime: "server",
              title: "サーバーで行われること",
              items: [
                "移動先の URL に対応する page を描画する",
                "変化したセグメントの RSC Payload を返す",
                "対応するページがなければ not-found を描画する",
              ],
            },
          ],
        },
      ],
    },
  ],
  demo: {
    description:
      "Live Demo の枠は layout.tsx にある Client Component で、点線の中（children）だけがページごとに切り替わります。URL・useSelectedLayoutSegment() の値はブラウザで実際に取得したものです。",
    steps: [
      "メモ欄に何か入力する",
      "リンクを押してページを移動し、点線の中だけが変わってメモが残ることを確認する",
      "「存在しない URL」を押して not-found.tsx が表示されることを確認する",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/layout.tsx`,
      role: "Layout",
      description: "教材本体。Live Demo の中に children を渡している",
    },
    {
      path: `${dir}/route-demo-panel.tsx`,
      role: "Client Component",
      description: "リンク・メモ欄・Visualizer を持つ layout 内のパネル",
    },
    {
      path: `${dir}/page.tsx`,
      role: "Page",
      description: "/learn/app-router で children として表示される",
    },
    {
      path: `${dir}/[slug]/page.tsx`,
      role: "Dynamic Route",
      description: "params.slug に応じて表示し、該当がなければ notFound()",
    },
    {
      path: `${dir}/[slug]/not-found.tsx`,
      role: "not-found",
      description: "notFound() が呼ばれたときに page の代わりに表示される",
    },
    {
      path: `${dir}/[slug]/loading.tsx`,
      role: "loading",
      description: "page の描画を待つ間に表示される",
    },
  ],
  inside: {
    files: [
      {
        path: "src/app/layout.tsx",
        role: "Root Layout",
        description: "html / body とヘッダーを持つ最も外側の layout",
      },
      {
        path: "src/app/learn/layout.tsx",
        role: "Layout",
        description: "サイドバーを持つ教材共通の layout",
      },
      {
        path: `${dir}/layout.tsx`,
        role: "Layout",
        description: "この教材の解説と Live Demo の枠",
      },
      {
        path: `${dir}/route-demo-panel.tsx`,
        role: "Client Component",
        description: "usePathname / useSelectedLayoutSegment を使う",
      },
      {
        path: `${dir}/page.tsx`,
        role: "Page",
        description: "/learn/app-router",
      },
      {
        path: `${dir}/[slug]/page.tsx`,
        role: "Dynamic Route",
        description: "/learn/app-router/[slug]",
      },
      {
        path: `${dir}/[slug]/loading.tsx`,
        role: "loading",
        description: "[slug]/page.tsx を Suspense で包む",
      },
      {
        path: `${dir}/[slug]/not-found.tsx`,
        role: "not-found",
        description: "該当データがないときの表示",
      },
      {
        path: `${dir}/route-view.tsx`,
        role: "Server Component",
        description:
          "マッチしたファイルと params を表示する（URL にはならない）",
      },
      {
        path: `${dir}/demo-routes.ts`,
        role: "データ",
        description: "generateStaticParams とデモページで使う一覧",
        runtime: "server",
        runtimeReason:
          "Server Component から使われるが、route-demo-panel.tsx からも import されるため Client バンドルにも含まれる",
      },
      {
        path: `${dir}/navigation-trace.ts`,
        role: "Visualizer データ",
        description: "クリックと URL の変化をフローに変換する",
        runtime: "client",
        runtimeReason:
          '"use client" の route-demo-panel.tsx から import されるため Client',
      },
    ],
    features: [
      {
        name: "Nested Layouts",
        description:
          "Root Layout → learn/layout.tsx → app-router/layout.tsx の3層で、このページを包んでいます。",
      },
      {
        name: "Dynamic Routes",
        description:
          "[slug] フォルダで /learn/app-router/ 以下の任意の値を受け取っています。",
      },
      {
        name: "generateStaticParams",
        description:
          "3つの slug をビルド時にプリレンダーし、それ以外はリクエスト時に処理します。",
      },
      {
        name: "notFound() / not-found.tsx",
        description:
          "存在しない slug のとき、layout を保ったまま not-found.tsx を表示します。",
      },
      {
        name: "loading.tsx",
        description:
          "リクエスト時に描画する slug で、page を待つ間の表示を担当します。",
      },
      {
        name: "<Link> / usePathname",
        description:
          "クライアントナビゲーションと、現在の URL・セグメントの取得に使っています。",
      },
    ],
  },
  related: ["server-components", "client-components", "streaming"],
}
