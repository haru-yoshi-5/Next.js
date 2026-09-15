import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/server-components"

export const serverComponentsLesson: LessonContent = {
  slug: "server-components",
  title: "Server Components",
  lead: "App Router のコンポーネントは、何も書かなければ Server Component です。サーバーで実行され、ブラウザにはコンポーネントのコードではなく「描画結果」だけが届きます。",
  keyPoints: [
    "Server Component が、どこで・いつ実行されるのか",
    "`async` / `await` でサーバーから直接データを取得できる理由",
    "ブラウザへ JavaScript が送られない部分はどこか",
  ],
  sections: [
    {
      id: "what-is-server-component",
      title: "Server Component とは",
      blocks: [
        {
          type: "paragraph",
          text: 'App Router では、`page.tsx` や `layout.tsx` を含むすべてのコンポーネントが、ファイル先頭に `"use client"` を書かない限り Server Component として扱われます。',
        },
        {
          type: "paragraph",
          text: "Server Component はサーバー（リクエスト時、またはビルド時）で実行され、その結果は RSC Payload という形式に変換されてブラウザへ送られます。RSC Payload には描画結果と、Client Component を配置する場所の情報が含まれますが、Server Component 自身の JavaScript は含まれません。",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "ブラウザがページをリクエストする",
            "Next.js が URL に対応する `page.tsx` を見つけ、Server Component を実行する",
            "Server Component がデータを取得し、JSX を返す",
            "描画結果が HTML と RSC Payload としてブラウザへ届き、表示される",
          ],
        },
      ],
    },
    {
      id: "fetch-on-server",
      title: "サーバーで直接データを取得する",
      blocks: [
        {
          type: "paragraph",
          text: "Server Component は `async` 関数にでき、コンポーネントの中で `await` を使ってデータベースや API から直接データを取得できます。データ取得のために `useEffect` を書いたり、ブラウザ向けの API エンドポイントを別に用意したりする必要はありません。",
        },
        {
          type: "callout",
          tone: "note",
          title: "秘密情報を扱うコードをブラウザに送らない",
          text: 'Server Component のコードはブラウザに送られないため、API キーやデータベースの接続情報を使う処理を書けます。デモの `snapshot-data.ts` は `import "server-only"` を宣言しており、誤って Client Component から import するとビルドエラーになります。',
        },
      ],
    },
    {
      id: "server-or-client",
      title: "Server Component に向いている処理・向いていない処理",
      blocks: [
        {
          type: "comparison",
          columns: [
            {
              runtime: "server",
              title: "Server Component に向いている",
              items: [
                "`async` / `await` によるデータ取得",
                "データベースやファイルなど、サーバーの資源へのアクセス",
                "API キーなど秘密情報を使う処理",
                "ブラウザへ送る JavaScript を減らしたい表示部分",
              ],
            },
            {
              runtime: "client",
              title: "Client Component が必要",
              items: [
                "`useState` / `useEffect` などのフック",
                "`onClick` / `onChange` などのイベントハンドラ",
                "`window` / `localStorage` などのブラウザ API",
              ],
            },
          ],
        },
        {
          type: "paragraph",
          text: "このデモの「サーバーで再レンダリング」ボタンはクリックを扱うため Client Component（`refresh-panel.tsx`）ですが、表示しているデータは Server Component（`server-snapshot.tsx`）が描画したものを `children` として受け取っています。",
        },
      ],
    },
    {
      id: "prerender-and-request",
      title: "ビルド時に作る部分と、リクエストごとに実行する部分",
      blocks: [
        {
          type: "paragraph",
          text: "このサイトは Cache Components（`cacheComponents: true`）を有効にしています。ページはビルド時にプリレンダーされ、リクエストごとに変わる処理だけが `<Suspense>` の内側でリクエスト時に実行されます。",
        },
        {
          type: "paragraph",
          text: "デモの `ServerSnapshot` は現在時刻を扱うため、先頭で `await io()` を呼び、プリレンダーの対象外であることを明示しています。タイトルや解説文はビルド時に HTML になり、デモ部分だけがリクエストのたびにサーバーで実行されます。",
        },
      ],
    },
  ],
  demo: {
    description:
      "左側は Server Component がサーバーで取得して描画した結果です。右側の Process Visualizer には、そのとき実際にサーバーで計測したデータ取得時間が表示されます。",
    steps: [
      "ページを開くと、表示までの流れが右側で再生される",
      "「サーバーで再レンダリング」を押す",
      "取得時刻と取得回数が変わり、新しい計測値でフローが再生されることを確認する",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/page.tsx`,
      role: "Page",
      description: "教材ページ本体。デモ部分だけを Suspense で囲んでいる",
    },
    {
      path: `${dir}/server-snapshot.tsx`,
      role: "Server Component",
      description:
        "サーバーでデータを取得し、結果を描画する async コンポーネント",
    },
    {
      path: `${dir}/snapshot-data.ts`,
      role: "Data Source",
      description: "サーバーでしか取得できない情報を返すデータ取得関数",
    },
    {
      path: `${dir}/refresh-panel.tsx`,
      role: "Client Component",
      description: "再レンダリングボタンと Process Visualizer を表示する",
    },
    {
      path: `${dir}/trace.ts`,
      role: "Visualizer データ",
      description:
        "サーバーで計測した値を Process Visualizer 用のデータに変換する",
    },
  ],
  inside: {
    files: [
      {
        path: "src/app/learn/layout.tsx",
        role: "Layout",
        description: "教材ページ共通のサイドバー付きレイアウト",
      },
      {
        path: `${dir}/page.tsx`,
        role: "Page",
        description: "解説・Source Code を含むページ全体を組み立てる",
      },
      {
        path: `${dir}/server-snapshot.tsx`,
        role: "Data Fetch",
        description: "リクエストごとにサーバーで実行されるデモ本体",
      },
      {
        path: `${dir}/snapshot-data.ts`,
        role: "Data Source",
        description: "server-only で保護されたデータ取得関数",
      },
      {
        path: `${dir}/trace.ts`,
        role: "Visualizer データ",
        description: "Server Component から呼ばれ、計測値をフローに変換する",
      },
      {
        path: `${dir}/refresh-panel.tsx`,
        role: "Client Component",
        description: "router.refresh() を呼ぶボタンを持つ",
      },
      {
        path: "src/components/learning/lesson-page.tsx",
        role: "Server Component",
        description: "全教材で共通のページ構成",
      },
      {
        path: "src/components/learning/source-code.tsx",
        role: "Server Component",
        description: "実ファイルを読み込み、ハイライト済みのコードを描画する",
      },
      {
        path: "src/components/learning/code-tabs.tsx",
        role: "Client Component",
        description: "タブの選択状態だけを扱う",
      },
      {
        path: "src/components/layout/sidebar-nav.tsx",
        role: "Client Component",
        description: "usePathname で現在の教材をハイライトする",
      },
      {
        path: "src/components/visualizer/process-visualizer.tsx",
        role: "Client Component",
        description: "受け取ったフローをステップごとに再生する",
      },
      {
        path: "src/lib/source-code.ts",
        role: "use cache",
        description:
          "ソースコードの読み込みとハイライトをビルド時に実行してキャッシュする",
      },
    ],
    features: [
      {
        name: "Server Components",
        description:
          "ページ本体・解説・Source Code・Inside This Page はすべて Server Component で描画しています。",
      },
      {
        name: "<Suspense>",
        description:
          "リクエストごとに実行する ServerSnapshot だけを囲み、それ以外の部分を静的シェルとして先に表示します。",
      },
      {
        name: "io()",
        description:
          "現在時刻を扱う処理の前で呼び、プリレンダーの対象外であることを Next.js に伝えます。",
      },
      {
        name: '"use cache"',
        description:
          "Source Code 表示のためのファイル読み込みとハイライト処理をキャッシュし、静的シェルに含めます。",
      },
      {
        name: "router.refresh()",
        description:
          "Client Component から、現在のページの Server Components の再実行をサーバーへ要求します。",
      },
      {
        name: "Metadata API",
        description:
          "教材データから title・description・Open Graph を生成しています。",
      },
    ],
  },
  related: ["client-components", "streaming", "server-actions"],
}
