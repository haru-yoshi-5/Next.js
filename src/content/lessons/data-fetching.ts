import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/data-fetching"

export const dataFetchingLesson: LessonContent = {
  slug: "data-fetching",
  title: "Data Fetching",
  lead: "Server Components では、コンポーネントの中で直接 await してデータを取得できます。書き方はシンプルですが、await の並べ方によってページの待ち時間は大きく変わります。",
  keyPoints: [
    "Server Component でデータを取得する基本の書き方",
    "直列の取得と並列の取得の違い、それぞれを使う場面",
    "同じデータを複数のコンポーネントで使うときの考え方",
  ],
  sections: [
    {
      id: "fetch-on-server",
      title: "サーバーで直接データを取得する",
      blocks: [
        {
          type: "paragraph",
          text: "コンポーネントを `async` 関数にすると、`fetch` やデータベースのクライアントを直接 await できます。データを取得するための API をわざわざ用意する必要はありません。",
        },
        {
          type: "paragraph",
          text: "コードはサーバーで実行されるため、接続情報や問い合わせの処理はブラウザ用の JavaScript に含まれません。ただし、誰がそのデータを読めるのかの認証・認可は、別途確認する必要があります。",
        },
        {
          type: "callout",
          tone: "note",
          title: "fetch の結果は自動ではキャッシュされない",
          text: '`fetch` はデフォルトではキャッシュされず、完了するまでレンダリングを止めます。結果を再利用するなら `"use cache"` を使い、リクエストごとに新しいデータが必要なら `<Suspense>` で囲んでストリーミングします。',
        },
      ],
    },
    {
      id: "sequential-and-parallel",
      title: "直列と並列",
      blocks: [
        {
          type: "paragraph",
          text: "`await` を上から順に書くと、前の取得が終わるまで次の取得は始まりません。これが直列の取得です。一方、先に2つの関数を呼び出してから `Promise.all` で待つと、取得は同時に進みます。",
        },
        {
          type: "comparison",
          columns: [
            {
              runtime: "server",
              title: "直列",
              items: [
                "全体の時間は、それぞれの時間の合計に近づく",
                "前の結果を使って次の取得を行うときに必要",
                "例: 著者を取得し、その ID で記事を取得する",
              ],
            },
            {
              runtime: "server",
              title: "並列",
              items: [
                "全体の時間は、最も遅い取得の時間に近づく",
                "お互いの結果を使わない取得に向いている",
                "例: 著者と、それとは無関係な通知を取得する",
              ],
            },
          ],
        },
        {
          type: "callout",
          tone: "caution",
          title: "Promise.all は1つでも失敗すると全体が失敗する",
          text: "一部のデータがなくても表示を続けたい場合は、成功と失敗を個別に受け取れる `Promise.allSettled` を使います。",
        },
      ],
    },
    {
      id: "reuse",
      title: "同じデータを複数の場所で使う",
      blocks: [
        {
          type: "paragraph",
          text: "同じデータが複数のコンポーネントで必要でも、props でバケツリレーをする必要はありません。同じレンダリングの中で同じ内容の `fetch` を呼ぶと、結果は自動で共有されます。",
        },
        {
          type: "paragraph",
          text: "`fetch` を使わないデータベースの問い合わせなどは、関数を React の `cache` で包みます。共有されるのは同じリクエストの中だけで、別のリクエストには持ち越されません。",
        },
      ],
    },
    {
      id: "client-components",
      title: "Client Component でデータを使う",
      blocks: [
        {
          type: "paragraph",
          text: "Client Component にデータが必要な場合、Server Component で取得を始めて、その Promise を props として渡せます。受け取った側は React の `use` で読み取り、完了するまでは `<Suspense>` の fallback が表示されます。",
        },
        {
          type: "paragraph",
          text: "ブラウザでの操作をきっかけに何度も取得し直す画面では、SWR や React Query などのライブラリをブラウザ側で使う方法もあります。",
        },
      ],
    },
  ],
  demo: {
    description:
      "同じ2つのデータ取得を、直列と並列で実行しています。棒の位置と長さはサーバーで計測した値で、2つのタイムラインは同じ目盛りです。データベースの代わりに、待ち時間を入れた関数を使っています。",
    steps: [
      "直列では、getPosts() が getAuthor() の完了後に始まっていることを確認する",
      "並列では、2つの取得がほぼ同時に始まっていることを確認する",
      "「もう一度取得する」を押し、実行のたびに計測値が変わることを確認する",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/fetch-strategies.ts`,
      role: "データ取得",
      description: "直列と並列の取得を実行し、時間を計測する",
    },
    {
      path: `${dir}/data-source.ts`,
      role: "データ取得",
      description: "データベースの代わりに、待ち時間のあるデータを返す",
    },
    {
      path: `${dir}/fetch-demo.tsx`,
      role: "Server Component",
      description: "2つの取得方法を実行し、結果を描画する",
    },
    {
      path: `${dir}/fetch-timeline.tsx`,
      role: "Server Component",
      description: "計測した時間をタイムラインとして表示する",
    },
    {
      path: `${dir}/fetch-panel.tsx`,
      role: "Client Component",
      description: "children の出力を置き、再取得の操作を扱う",
    },
    {
      path: `${dir}/trace.ts`,
      role: "Visualizer データ",
      description: "計測結果をフローとして組み立てる",
    },
  ],
  inside: {
    files: [
      {
        path: `${dir}/page.tsx`,
        role: "Page",
        description: "解説と Source Code は静的シェルに含まれる",
      },
      {
        path: `${dir}/fetch-demo.tsx`,
        role: "Server Component",
        description: "リクエストのたびに実行される",
      },
      {
        path: `${dir}/fetch-strategies.ts`,
        role: "データ取得",
        description: "server-only により、サーバーからだけ使える",
      },
      {
        path: `${dir}/data-source.ts`,
        role: "データ取得",
        description: "server-only により、サーバーからだけ使える",
      },
      {
        path: `${dir}/fetch-timeline.tsx`,
        role: "Server Component",
        description: "サーバーで描画され、HTML として届く",
      },
      {
        path: `${dir}/fetch-panel.tsx`,
        role: "Client Component",
        description: "再取得の操作を扱う",
      },
      {
        path: `${dir}/trace.ts`,
        role: "Visualizer データ",
        description: "サーバーで処理の記録を組み立てる",
      },
      {
        path: "src/components/visualizer/process-visualizer.tsx",
        role: "Client Component",
        description: "サーバーから受け取った処理の記録を再生する",
      },
    ],
    features: [
      {
        name: "async Server Component",
        description:
          "コンポーネントの中で直接 await し、取得した結果を描画しています。",
      },
      {
        name: "Promise.all",
        description:
          "2つの取得を先に開始してから、完了をまとめて待っています。",
      },
      {
        name: "io()",
        description:
          "これより後の処理を静的シェルから外し、リクエストごとに実行します。",
      },
      {
        name: "<Suspense>",
        description:
          "データ取得を待つ部分を囲み、fallback を静的シェルに含めています。",
      },
      {
        name: "Server → Client の children",
        description:
          "Client Component の FetchPanel が、サーバーの出力を children として受け取っています。",
      },
    ],
  },
  related: ["server-components", "streaming", "nextjs-cache"],
}
