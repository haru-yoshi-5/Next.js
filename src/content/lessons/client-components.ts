import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/client-components"

export const clientComponentsLesson: LessonContent = {
  slug: "client-components",
  title: "Client Components",
  lead: 'ファイル先頭に `"use client"` を書くと Client Component になり、ブラウザで state やイベントを扱えるようになります。ただし初回表示の HTML は、Client Component もサーバーでプリレンダーされます。',
  keyPoints: [
    '`"use client"` が必要になる条件',
    "state の更新がブラウザの中だけで完結すること",
    "Client Component の範囲を小さく保つ理由",
  ],
  sections: [
    {
      id: "why-use-client",
      title: 'なぜ "use client" が必要なのか',
      blocks: [
        {
          type: "paragraph",
          text: 'Server Component はサーバーで実行されて結果だけが送られるため、クリックに反応したり、値を覚えておいたりすることができません。`useState`、`useEffect`、`onClick` などのイベントハンドラ、`window` などのブラウザ API を使うコンポーネントには、ファイルの先頭に `"use client"` を書きます。',
        },
        {
          type: "paragraph",
          text: '`"use client"` は Server と Client の「境界」を宣言します。そのファイルと、そこから import されるモジュールはクライアント用の JavaScript バンドルに含まれます。そのため、境界の内側にある子コンポーネントに一つずつ `"use client"` を書く必要はありません。',
        },
      ],
    },
    {
      id: "how-it-runs",
      title: "Client Component が動き出すまで",
      blocks: [
        {
          type: "list",
          ordered: true,
          items: [
            "サーバーが Client Component も含めて HTML をプリレンダーする（最初の表示を速くするため）",
            "ブラウザが HTML を表示する（この時点ではまだクリックに反応しない）",
            "Client Component の JavaScript を読み込み、ハイドレーションでイベントハンドラを結び付ける",
            "以降のクリックや state の更新は、サーバーと通信せずブラウザの中で処理される",
          ],
        },
        {
          type: "callout",
          tone: "caution",
          title:
            "「Client Component はブラウザでしか実行されない」わけではない",
          text: "Client Component も初回表示のためにサーバーでプリレンダーされます。レンダー中に `window` や `localStorage` へ直接アクセスするとサーバーでエラーになるため、ブラウザ API はイベントハンドラや `useEffect` の中で使います。",
        },
      ],
    },
    {
      id: "keep-it-small",
      title: "Client Component は小さく切り出す",
      blocks: [
        {
          type: "paragraph",
          text: "ページ全体を Client Component にすると、その配下のコードがすべてブラウザ向けの JavaScript になります。インタラクションが必要な部分だけを小さな Client Component に切り出し、残りは Server Component のままにするのが基本です。",
        },
        {
          type: "comparison",
          columns: [
            {
              runtime: "server",
              title: "このページで Server Component のままの部分",
              items: [
                "`page.tsx` と、見出し・解説文の表示",
                "Source Code のファイル読み込みとハイライト処理",
                "Inside This Page のファイル構成表示",
              ],
            },
            {
              runtime: "client",
              title: "このページで Client Component にした部分",
              items: [
                "カウンターの state（`counter-demo.tsx`）",
                "Process Visualizer の再生状態",
                "Source Code のタブ切り替え・テーマ切り替え",
              ],
            },
          ],
        },
      ],
    },
  ],
  demo: {
    description:
      "カウンターは Client Component です。ボタンを押すと、クリックの処理から再レンダリングまでがブラウザの中で完結し、サーバー側のノードは一度も使われません。",
    steps: [
      "「+1」「-1」「リセット」を押す",
      "右側でブラウザ側のノードだけが順番に強調されることを確認する",
      "サーバー側のノードが灰色のまま（通信が発生していない）ことを確認する",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/page.tsx`,
      role: "Page",
      description: "Server Component のまま、CounterDemo を配置している",
    },
    {
      path: `${dir}/counter-demo.tsx`,
      role: "Client Component",
      description: "useState と onClick でカウンターを動かす",
    },
    {
      path: `${dir}/counter-trace.ts`,
      role: "Visualizer データ",
      description: "実際のクリックと state の変化をフローに変換する",
      runtime: "client",
      runtimeReason:
        '"use client" の counter-demo.tsx から import されるため Client',
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
        description: "解説と Source Code を含むページ全体",
      },
      {
        path: `${dir}/counter-demo.tsx`,
        role: "Client Component",
        description:
          "Server と Client の境界。ここから下がブラウザ向けのバンドルに入る",
      },
      {
        path: `${dir}/counter-trace.ts`,
        role: "Visualizer データ",
        description: "境界の内側から import されるモジュール",
        runtime: "client",
        runtimeReason:
          '"use client" の counter-demo.tsx から import されるため Client',
      },
      {
        path: "src/components/learning/demo-layout.tsx",
        role: "共通 UI",
        description: "ディレクティブはないが、Client Component から使われる",
        runtime: "client",
        runtimeReason: '"use client" のファイルから import されるため Client',
      },
      {
        path: "src/components/visualizer/process-visualizer.tsx",
        role: "Client Component",
        description: "再生位置を state で持ち、タイマーで進める",
      },
      {
        path: "src/components/learning/lesson-page.tsx",
        role: "Server Component",
        description: "全教材で共通のページ構成",
      },
      {
        path: "src/components/learning/inside-this-page.tsx",
        role: "Server Component",
        description: "このファイル一覧をサーバーで組み立てる",
      },
      {
        path: "src/components/layout/theme-toggle.tsx",
        role: "Client Component",
        description: "テーマ切り替えボタン（onClick を使う）",
      },
    ],
    features: [
      {
        name: '"use client"',
        description:
          "counter-demo.tsx を Server / Client の境界として宣言しています。",
      },
      {
        name: "useState",
        description:
          "カウンターの値と、Process Visualizer に渡す処理の記録を保持しています。",
      },
      {
        name: "Server → Client の組み合わせ",
        description:
          "Server Component の page.tsx が、Client Component の CounterDemo を子として描画しています。",
      },
      {
        name: "プリレンダー + ハイドレーション",
        description:
          "カウンターの初期表示 0 はビルド時に HTML になり、ブラウザでハイドレーションされてから操作できます。",
      },
    ],
  },
  related: ["server-components", "server-actions", "app-router"],
}
