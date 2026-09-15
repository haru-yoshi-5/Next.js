import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/streaming"

export const streamingLesson: LessonContent = {
  slug: "streaming",
  title: "Streaming",
  lead: "Streaming は、ページ全体の完成を待たずに、準備ができた部分から順番にブラウザへ送る仕組みです。App Router では `<Suspense>` の境界ごとに HTML が分割されて届きます。",
  keyPoints: [
    "`<Suspense>` の外側と fallback が先に表示される理由",
    "複数の Suspense 境界が互いを待たずに届くこと",
    "`loading.tsx` と `<Suspense>` の使い分け",
  ],
  sections: [
    {
      id: "why-streaming",
      title: "なぜ Streaming が必要なのか",
      blocks: [
        {
          type: "paragraph",
          text: "サーバーで HTML を作る場合、Streaming がなければ一番遅いデータ取得が終わるまで何も送れません。1つの遅い API がページ全体の表示を止めてしまいます。",
        },
        {
          type: "paragraph",
          text: "Streaming では、レイアウトや見出しなどすぐに作れる部分（静的シェル）を先に送り、遅いデータに依存する部分は準備ができた時点で追加のチャンクとして送ります。ブラウザは届いた順に表示を更新します。",
        },
      ],
    },
    {
      id: "suspense-boundary",
      title: "Suspense の境界が「分割点」になる",
      blocks: [
        {
          type: "paragraph",
          text: "`<Suspense fallback={...}>` で囲んだ部分は、中のコンポーネントがデータを待っている間 fallback が表示されます。中身の描画が終わると、React が完成した HTML と差し替え用の小さな `<script>` を同じレスポンスの続きとして送り、fallback と入れ替えます。",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "Header（Suspense の外側）と2つの fallback を含むシェルが送られる",
            "約1秒後、`ProfileSection` の描画が終わり、Profile のチャンクが届く",
            "約2秒後、`ActivitySection` の描画が終わり、Activity のチャンクが届く",
          ],
        },
        {
          type: "callout",
          tone: "note",
          title: "兄弟の Suspense 境界は並行して処理される",
          text: "Profile と Activity は別々の Suspense 境界にあるため、Activity は Profile の完了を待ちません。デモの経過時間が「1秒 + 2秒 = 3秒」ではなく約2秒になっていることで確認できます。",
        },
      ],
    },
    {
      id: "loading-vs-suspense",
      title: "loading.tsx と Suspense の使い分け",
      blocks: [
        {
          type: "comparison",
          columns: [
            {
              runtime: "server",
              title: "loading.tsx",
              items: [
                "page.tsx 全体を自動で Suspense に包む",
                "ページ全体のスケルトンを出したいときに手軽",
                "意味のある内容を出せるまで何も見せられない場合に向く",
              ],
            },
            {
              runtime: "server",
              title: "<Suspense>",
              items: [
                "遅い部分だけを細かく囲める",
                "解説や見出しなど、すぐ出せる内容を先に表示できる",
                "このページのように、境界ごとに独立して表示できる",
              ],
            },
          ],
        },
        {
          type: "paragraph",
          text: "このサイトは Cache Components を有効にしているため、`searchParams` のようにリクエスト時にしか分からない値を読むコンポーネントも `<Suspense>` の内側に置いています。解説や Source Code はビルド時の静的シェルに含まれ、デモ部分だけがリクエスト時にストリーミングされます。",
        },
      ],
    },
  ],
  demo: {
    description:
      "Profile は約1秒、Activity は約2秒かかる Server Component です。それぞれ別の Suspense 境界に入っており、準備ができた順に表示されます。",
    steps: [
      "ページを開いた直後に Header と2つの fallback が表示されることを確認する",
      "Profile → Activity の順に表示が差し替わるのを見る",
      "「もう一度ストリーミング」で何度でも繰り返す",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/streaming-demo.tsx`,
      role: "Server Component",
      description: "Header と2つの Suspense 境界を配置する",
    },
    {
      path: `${dir}/profile-section.tsx`,
      role: "Server Component",
      description: "約1秒かかるデータ取得を行う",
    },
    {
      path: `${dir}/activity-section.tsx`,
      role: "Server Component",
      description: "約2秒かかるデータ取得を行う",
    },
    {
      path: `${dir}/slow-data.ts`,
      role: "Data Source",
      description: "待ち時間付きのデータ取得と、リクエスト開始時刻の共有",
    },
    {
      path: `${dir}/page.tsx`,
      role: "Page",
      description: "searchParams を読むデモ部分を Suspense で囲む",
    },
    {
      path: `${dir}/stream-timeline.tsx`,
      role: "Client Component",
      description: "届いたチャンクを記録し、Process Visualizer に渡す",
    },
    {
      path: `${dir}/arrival-reporter.tsx`,
      role: "Client Component",
      description: "チャンクがブラウザで表示されたことを通知する",
    },
  ],
  inside: {
    files: [
      {
        path: `${dir}/page.tsx`,
        role: "Page",
        description:
          "解説と Source Code は静的シェル、デモだけがストリーミングされる",
      },
      {
        path: `${dir}/streaming-demo.tsx`,
        role: "Server Component",
        description: "searchParams を読み、Suspense 境界を配置する",
      },
      {
        path: `${dir}/profile-section.tsx`,
        role: "Streaming",
        description: "1つ目の Suspense 境界の中身",
      },
      {
        path: `${dir}/activity-section.tsx`,
        role: "Streaming",
        description: "2つ目の Suspense 境界の中身",
      },
      {
        path: `${dir}/section-fallback.tsx`,
        role: "fallback",
        description: "Suspense の fallback として先に表示される",
      },
      {
        path: `${dir}/slow-data.ts`,
        role: "Data Source",
        description: "React の cache() でリクエスト開始時刻を共有する",
      },
      {
        path: `${dir}/stream-timeline.tsx`,
        role: "Client Component",
        description:
          "Server Components を children として受け取る Context Provider",
      },
      {
        path: `${dir}/arrival-reporter.tsx`,
        role: "Client Component",
        description:
          "Server Component の中に置かれた、描画しない Client Component",
      },
      {
        path: "src/components/learning/demo-skeleton.tsx",
        role: "fallback",
        description: "デモ全体の Suspense fallback",
      },
    ],
    features: [
      {
        name: "<Suspense>",
        description:
          "デモ全体と、Profile / Activity のそれぞれを独立した境界として囲んでいます。",
      },
      {
        name: "Partial Prerendering",
        description:
          "解説・Source Code・fallback はビルド時に静的シェルとなり、デモ部分だけがリクエスト時に届きます。",
      },
      {
        name: "searchParams",
        description:
          "?run= の値を key に使い、Suspense 境界を作り直してストリーミングを再実行します。",
      },
      {
        name: "React cache()",
        description:
          "同じリクエスト内で、リクエスト開始時刻を複数の Server Components から共有しています。",
      },
      {
        name: "Server → Client の children",
        description:
          "Client Component の StreamTimeline が、サーバーで描画された Suspense 境界を children として受け取っています。",
      },
    ],
  },
  related: ["server-components", "server-actions", "app-router"],
}
