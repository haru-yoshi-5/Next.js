import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/react-and-nextjs"

const clientImportReason =
  '"use client" の react-panel.tsx から import されるため Client'

export const reactAndNextjsLesson: LessonContent = {
  slug: "react-and-nextjs",
  title: "Reactとの関係",
  lead: "Next.js を使っても、画面は React で作ります。React はコンポーネントで画面を作る仕組みを提供し、Next.js はそれをルーティング・ビルド・配信・キャッシュと組み合わせて、Web アプリとして動かします。",
  keyPoints: [
    "React が提供するものと、Next.js が組み込むもの",
    "Server Components やハイドレーションでの、React と Next.js の共同作業",
    "App Router が Next.js に同梱された React を使うこと",
  ],
  sections: [
    {
      id: "what-react-provides",
      title: "React が提供するもの",
      blocks: [
        {
          type: "paragraph",
          text: "React は、画面を部品に分けて作るためのライブラリです。部品の書き方だけでなく、画面を描画して更新する処理そのものも React が提供しています。",
        },
        {
          type: "list",
          items: [
            "コンポーネントと JSX — 画面を部品に分けて書く方法",
            "state と Hooks — `useState` などで値を持ち、値が変わったら描画し直す仕組み",
            "差分の反映 — 描画し直した結果を前回と比べ、変わった部分だけを画面に反映する処理",
            "ハイドレーション — サーバーで作った HTML に、React DOM がボタンの操作などを結び付ける処理",
            'Server Components・`"use client"`・Suspense — サーバーとブラウザで部品を分ける考え方と、それを処理する実装',
          ],
        },
      ],
    },
    {
      id: "what-nextjs-integrates",
      title: "Next.js が組み込むもの",
      blocks: [
        {
          type: "paragraph",
          text: "React だけでは、どの URL でどの部品を描画するか、いつどこで描画するかは決まりません。Next.js は React の仕組みを使って、次のことを担当します。",
        },
        {
          type: "list",
          items: [
            "ルーティング — URL に合わせて、どのコンポーネントを描画するかを決める",
            "実行する時期と場所 — ビルド時にプリレンダーするか、リクエスト時に描画するかを決める",
            'バンドルと分割 — `"use client"` の境界ごとにコードを分け、ブラウザに必要な JavaScript だけを届ける',
            "配信 — HTML と RSC Payload をブラウザへ届け、ハイドレーションを起動する",
            "キャッシュ — 設定やデータの使い方に合わせて、描画結果やデータを保持する",
          ],
        },
        {
          type: "callout",
          tone: "note",
          title: "Server Components は Next.js だけの機能ではない",
          text: "Server Components は React の機能です。動かすには、バンドラーやフレームワークがアプリに組み込む必要があります。Next.js の App Router は、それを組み込んだフレームワークの一つです。",
        },
      ],
    },
    {
      id: "working-together",
      title: "React と Next.js の共同作業",
      blocks: [
        {
          type: "paragraph",
          text: "多くの処理は、どちらか一方だけの仕事ではありません。React が仕組みを提供し、Next.js がそれをアプリの中で使える形にしています。",
        },
        {
          type: "list",
          items: [
            "コンポーネントと state — React が API と更新の処理を提供し、Next.js がアプリの中で実行できるようにする",
            'Server Components と `"use client"` — React が境界の意味と処理を提供し、Next.js がコードの分割・ルートとの組み合わせ・配信を行う',
            "ハイドレーション — React DOM が実行し、Next.js が必要な HTML と JavaScript を用意して起動する",
            "描画の時期とキャッシュ — React が描画の仕組みを提供し、Next.js が設定やデータの使い方に合わせて制御する",
          ],
        },
        {
          type: "callout",
          tone: "caution",
          title: '"use client" はブラウザだけで動かす宣言ではない',
          text: '`"use client"` は、サーバーとブラウザの境界を示す React の指定です。Client Components も、初回の HTML を作るためにサーバーで描画されます。',
        },
      ],
    },
    {
      id: "bundled-react",
      title: "Next.js は React を同梱している",
      blocks: [
        {
          type: "paragraph",
          text: "App Router は、Next.js に同梱された React の canary 版を使います。canary 版には、React 19 の安定した変更に加えて、フレームワークで検証中の新しい機能が含まれます。そのため、package.json に書いた版と、実際に動いている版が違うことがあります。",
        },
        {
          type: "paragraph",
          text: "それでも、package.json には `react` と `react-dom` を書いておきます。型定義や Lint、React に依存するほかのライブラリなど、ツールやエコシステムとの互換性のためです。",
        },
      ],
    },
  ],
  demo: {
    description:
      "①は、package.json に書いた React の版と、サーバーとブラウザで実際に読んだ `React.version` を並べたものです。②では、カウンター（React の state）を動かした後に「サーバーの表示を更新」を押します。Next.js がサーバーから新しい結果を取り寄せ、React がそれを反映しても、カウンターの値は残ります。カウンターは同じ場所・同じ種類のコンポーネントのまま描画されるため、state が保たれます。",
    steps: [
      "①で、package.json の版と、サーバー・ブラウザで動いている版を見比べる",
      "②のカウンターを 3 にする",
      "「サーバーの表示を更新」を押す",
      "サーバー生成IDが変わり、カウンターが 3 のまま残ることを確認する",
      "右側で、Next.js が取り寄せた結果を React が反映する流れを確認する",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/page.tsx`,
      role: "Page",
      description: "Server Component のまま、ReactDemo を配置している",
    },
    {
      path: `${dir}/react-demo.tsx`,
      role: "Server Component",
      description:
        "package.json の版と、サーバーの React.version を Client Component に渡す",
    },
    {
      path: `${dir}/server-stamp.tsx`,
      role: "Server Component",
      description: "io() の後で、リクエストごとにサーバー生成IDを描画する",
    },
    {
      path: `${dir}/react-panel.tsx`,
      role: "Client Component",
      description:
        "ブラウザの React.version、カウンターの state、更新ボタンを扱う",
    },
    {
      path: `${dir}/observe-rsc.ts`,
      role: "ブラウザの処理",
      description: "Resource Timing から RSC Payload の取得の候補を探す",
      runtime: "client",
      runtimeReason: clientImportReason,
    },
    {
      path: `${dir}/trace.ts`,
      role: "Visualizer データ",
      description: "観測した値から処理の記録を組み立てる",
      runtime: "client",
      runtimeReason: clientImportReason,
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
        description: "/learn/react-and-nextjs の URL で表示されるページ",
      },
      {
        path: `${dir}/react-demo.tsx`,
        role: "Server Component",
        description: "プリレンダー時に実行され、React の版を読む",
      },
      {
        path: `${dir}/server-stamp.tsx`,
        role: "Server Component",
        description: "Suspense の内側で、リクエスト時に描画される",
      },
      {
        path: `${dir}/react-panel.tsx`,
        role: "Client Component",
        description: "Server と Client の境界。state とボタンの操作を扱う",
      },
      {
        path: "src/components/visualizer/process-visualizer.tsx",
        role: "Client Component",
        description: "モデル図と、観測した値を再生する",
      },
    ],
    features: [
      {
        name: "Next.js に同梱された React",
        description:
          "react-demo.tsx と react-panel.tsx は、どちらも react から version を import しています。App Router では、package.json の版ではなく Next.js に同梱された版が読み込まれます。",
      },
      {
        name: "io() と Suspense",
        description:
          "server-stamp.tsx は io() の後でサーバー生成IDを作るため、プリレンダーされずにリクエスト時に描画されます。Suspense で囲み、ページのほかの部分は静的なまま配信しています。",
      },
      {
        name: "router.refresh()",
        description:
          "現在のページの RSC Payload をサーバーへ要求し、Server Components を描画し直します。結果を反映するとき、影響を受けない Client Components の state は残ります。サーバー側のキャッシュは無効にしません。",
      },
      {
        name: "useSyncExternalStore",
        description:
          "ブラウザの React.version を、サーバーでの描画とハイドレーションの間は「確認中」とし、ブラウザで描画し直したときに表示しています。render 中にそのまま読むと、サーバーで描画した値と区別できないためです。",
      },
      {
        name: "Resource Timing",
        description:
          "更新を始めた後に記録された、このページへの _rsc 付きの取得を探しています。リクエストヘッダーは読めないため、RSC Payload の取得の「候補」として扱います。",
      },
    ],
  },
  related: ["what-is-nextjs", "server-components", "client-components"],
}
