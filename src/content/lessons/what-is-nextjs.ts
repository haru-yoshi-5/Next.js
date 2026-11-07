import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/what-is-nextjs"

export const whatIsNextjsLesson: LessonContent = {
  slug: "what-is-nextjs",
  title: "Next.jsとは",
  lead: "Next.js は、React で Web アプリを作るためのフレームワークです。React が担当する「画面の部品づくり」に、ルーティング・サーバーでのレンダリング・ビルドの設定などを加えます。このページ自体も Next.js で動いています。",
  keyPoints: [
    "React と Next.js の役割の違い",
    "Next.js が React に加える主な仕組み",
    "このページの応答から、Next.js の仕事を確かめる方法",
  ],
  sections: [
    {
      id: "react-alone",
      title: "React だけでは足りないもの",
      blocks: [
        {
          type: "paragraph",
          text: "React は、画面を部品（コンポーネント）に分けて組み立てるためのライブラリです。ただし、Web アプリとして公開するには、画面を作る以外にも次のような仕組みが必要になります。",
        },
        {
          type: "list",
          items: [
            "URL ごとに、どの画面を表示するかを決める仕組み（ルーティング）",
            "最初の表示を速くし、検索エンジンにも内容を伝えるために、サーバーで HTML を作る仕組み",
            "データを取得・更新するための、サーバー側の処理",
            "コードをまとめて圧縮し、必要な分だけ配信するためのバンドラーやコンパイラーの設定",
          ],
        },
        {
          type: "paragraph",
          text: "React だけで作る場合は、これらを別のライブラリから選んで自分で組み合わせる必要があります。Next.js はこれらをまとめて用意し、バンドラーやコンパイラーの設定も自動で行うフレームワークです。",
        },
      ],
    },
    {
      id: "what-nextjs-adds",
      title: "Next.js が加えるもの",
      blocks: [
        {
          type: "list",
          ordered: true,
          items: [
            "ルーティング — 基本的に `src/app` のフォルダの区切りが URL の区切りに対応し、`layout.tsx` や `page.tsx` などの決まった名前のファイルで画面を組み立てる（Route Groups など、URL に現れないフォルダもある）",
            "サーバーでのレンダリング — Server Components をサーバーで実行し、Client Components の初回の表示も含めて、内容の入った HTML をブラウザへ返す",
            "サーバーとブラウザの橋渡し — Server Components の結果を RSC Payload としてブラウザへ送り、Client Components と組み合わせる",
            "バンドルと分割 — コードをまとめてページごとに分割し、静的にできる部分は事前に生成しておく",
          ],
        },
        {
          type: "callout",
          tone: "note",
          title: "App Router と Pages Router",
          text: "Next.js には2種類のルーターがあります。この教材で扱うのは、Server Components などの新しい React の機能に対応した App Router です。以前からある Pages Router も引き続きサポートされています。",
        },
      ],
    },
    {
      id: "this-site",
      title: "このサイトも Next.js で動いている",
      blocks: [
        {
          type: "paragraph",
          text: "NextScope 自体が、App Router で作った Next.js アプリです。今見ているページでも、サーバーとブラウザで次のように仕事を分けています。",
        },
        {
          type: "comparison",
          columns: [
            {
              runtime: "server",
              title: "サーバーで行っていること",
              items: [
                "URL から `layout.tsx` と `page.tsx` を選んで組み立てる",
                "解説文や Source Code を、ビルド時のプリレンダーで HTML にしておく",
                "Live Demo のファイル一覧を `src/app` から探す",
              ],
            },
            {
              runtime: "client",
              title: "ブラウザで行っていること",
              items: [
                "届いた HTML をすぐに表示する",
                "JavaScript を読み込み、ボタンを押せるようにする（ハイドレーション）",
                "「このページを調べる」で応答を取得し直して数える",
              ],
            },
          ],
        },
        {
          type: "callout",
          tone: "caution",
          title: "React を使わなくなるわけではない",
          text: "Next.js を使っても、画面の部品は React のコンポーネントとして書きます。React と Next.js がそれぞれ何を担当しているかは、次の「Reactとの関係」で詳しく扱います。",
        },
      ],
    },
  ],
  demo: {
    description:
      "①は、この URL に関係する特別なファイル（layout・error・loading など）を、サーバーが `src/app` から実際に探した結果です。「このページを調べる」を押すと、このページの HTML と JavaScript を取得し直し、②〜④の仕事の跡を数えます。取得した内容は数えるだけで実行しないため、ハイドレーションなど観測できない部分は、調べる前のモデル図で示しています。",
    steps: [
      "①で、URL の区切りごとにフォルダが対応していることを確認する",
      "「このページを調べる」を押す",
      "JavaScript を実行する前の HTML に、見出しや本文が入っていることを確認する",
      "RSC Payload を運ぶ script と、HTML が参照する JavaScript の数を確認する",
      "右側で、調べる前のモデル図と、調べた後の実測の流れを見比べる",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/page.tsx`,
      role: "Page",
      description: "Server Component のまま、AnatomyDemo を配置している",
    },
    {
      path: `${dir}/anatomy-demo.tsx`,
      role: "Server Component",
      description: "ファイルを探した結果を Client Component に渡す",
    },
    {
      path: `${dir}/route-files.ts`,
      role: "サーバー専用",
      description: "URL の区切りごとに、src/app の特別なファイルを探す",
    },
    {
      path: `${dir}/anatomy-panel.tsx`,
      role: "Client Component",
      description: "ファイルの一覧と、調べた結果を表示する",
    },
    {
      path: `${dir}/inspect-page.ts`,
      role: "ブラウザの処理",
      description: "このページの HTML と JavaScript を取得し直して数える",
      runtime: "client",
      runtimeReason:
        '"use client" の anatomy-panel.tsx から import されるため Client',
    },
    {
      path: `${dir}/trace.ts`,
      role: "Visualizer データ",
      description: "調べた結果から処理の記録を組み立てる",
      runtime: "client",
      runtimeReason:
        '"use client" の anatomy-panel.tsx から import されるため Client',
    },
  ],
  inside: {
    files: [
      {
        path: "src/app/layout.tsx",
        role: "Root Layout",
        description: "すべてのページを包む一番外側のレイアウト",
      },
      {
        path: "src/app/learn/layout.tsx",
        role: "Layout",
        description: "教材ページ共通のサイドバー付きレイアウト",
      },
      {
        path: `${dir}/page.tsx`,
        role: "Page",
        description: "/learn/what-is-nextjs の URL で表示されるページ",
      },
      {
        path: `${dir}/anatomy-demo.tsx`,
        role: "Server Component",
        description: "プリレンダー時に実行され、ファイルの一覧を用意する",
      },
      {
        path: `${dir}/route-files.ts`,
        role: "サーバー専用",
        description: "server-only で Client からの import を防ぐ",
      },
      {
        path: `${dir}/anatomy-panel.tsx`,
        role: "Client Component",
        description: "Server と Client の境界。ボタンの操作を扱う",
      },
      {
        path: `${dir}/inspect-page.ts`,
        role: "ブラウザの処理",
        description: "ブラウザに届いた内容を数える",
        runtime: "client",
        runtimeReason:
          '"use client" の anatomy-panel.tsx から import されるため Client',
      },
      {
        path: "src/components/visualizer/process-visualizer.tsx",
        role: "Client Component",
        description: "調べた結果とモデル図を再生する",
      },
    ],
    features: [
      {
        name: "ファイルベースのルーティング",
        description:
          "src/app/learn/what-is-nextjs/page.tsx を置いただけで、/learn/what-is-nextjs の URL になっています。",
      },
      {
        name: '"use cache"',
        description:
          'route-files.ts のファイル探索をプリレンダー時に実行し、結果をキャッシュして静的な HTML に含めています。cacheLife("max") は長く保持する指定で、再検証などで再実行されることはあります。',
      },
      {
        name: "server-only",
        description:
          "node:fs を使う route-files.ts が、Client Component から import されないことをビルド時に保証します。",
      },
      {
        name: "DOMParser",
        description:
          "取得し直した HTML を、script を実行しない文書として読み込み、JavaScript を実行する前の中身を調べています。RSC Payload を運ぶ script は、この HTML の書き方で使われている self.__next_f を目印に数えています。",
      },
    ],
  },
  related: ["app-router", "server-components", "client-components"],
}
