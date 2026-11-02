import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/revalidation"

export const revalidationLesson: LessonContent = {
  slug: "revalidation",
  title: "Revalidation",
  lead: "キャッシュを作り直すタイミングは、時間で決める方法と、データの更新に合わせて指示する方法があります。指示には `updateTag` / `revalidateTag` / `revalidatePath` を使い分けます。",
  keyPoints: [
    "時間ベースとオンデマンドの再検証の違い",
    "`updateTag` / `revalidateTag` / `revalidatePath` の使い分け",
    "古い値を返しながら裏側で更新する仕組み",
    "デプロイ先によって反映までに時間差が出る理由",
  ],
  sections: [
    {
      id: "two-ways",
      title: "再検証には2つの方法がある",
      blocks: [
        {
          type: "comparison",
          columns: [
            {
              runtime: "server",
              title: "時間ベース",
              items: [
                "`cacheLife` で期間を指定する",
                "期間を過ぎたら、古い値を返しながら裏側で作り直す",
                "更新の頻度が決まっているデータに向いている",
              ],
            },
            {
              runtime: "server",
              title: "オンデマンド",
              items: [
                "`cacheTag` で付けたタグやパスを指定して失効させる",
                "データを更新したタイミングで実行する",
                "いつ変わるか分からないデータに向いている",
              ],
            },
          ],
        },
        {
          type: "paragraph",
          text: "2つは併用できます。長めの `cacheLife` を指定しておき、データを更新したときだけタグで失効させる構成がよく使われます。",
        },
      ],
    },
    {
      id: "three-apis",
      title: "3つの関数を使い分ける",
      blocks: [
        {
          type: "list",
          items: [
            "`updateTag(tag)`: Server Action 専用。すぐに期限切れにし、次の読み取りは新しい値を待つ。自分の変更をすぐ見せたいときに使う",
            '`revalidateTag(tag, "max")`: Server Action と Route Handler で使える。古い印を付け、次のリクエストをきっかけに裏側で更新する',
            "`revalidatePath(path)`: Server Action と Route Handler で使える。タグではなくパス単位で無効にする",
          ],
        },
        {
          type: "paragraph",
          text: "`revalidatePath` は指定したパスだけが対象です。同じタグを使う別のページは更新されないので、複数のページで使うデータにはタグが向いています。",
        },
        {
          type: "callout",
          tone: "caution",
          title: "revalidateTag の第2引数は必須",
          text: "第2引数を省略する書き方は非推奨です。Webhook など Server Action の外からすぐに失効させたいときは、`revalidateTag(tag, { expire: 0 })` と書きます。",
        },
      ],
    },
    {
      id: "stale-while-revalidate",
      title: "古い値を返しながら更新する",
      blocks: [
        {
          type: "paragraph",
          text: '`revalidateTag(tag, "max")` は stale-while-revalidate という考え方に基づいています。公式ドキュメントでは、失効の呼び出しで作り直しは始まらず、次のリクエストには古い値を返しながら裏側で更新すると説明されています。',
        },
        {
          type: "callout",
          tone: "note",
          title: "図はモデルとして表示しています",
          text: "Process Visualizer の最初の図は、公式ドキュメントに沿ったモデル図です。ローカルの `next start` では失効後もしばらく古い値が返りましたが、Vercel の検証用アプリで測定したときは失効直後から新しい値が返りました。ボタンを押した後の結果は、その場で観測した値です。",
        },
      ],
    },
    {
      id: "multi-instance",
      title: "反映までに時間差が出ることがある",
      blocks: [
        {
          type: "paragraph",
          text: "複数のインスタンスやキャッシュの層があると、失効がすべてに届くまで時間差が出ることがあります。自前でサーバーを複数台動かす場合、失効は既定ではそのインスタンスの中だけで有効です。",
        },
        {
          type: "paragraph",
          text: "Vercel でビルド時に生成されたページに `updateTag` を使った測定では、操作した本人への応答はすぐ最新になりましたが、別のリクエストには数秒から15秒ほど古いページが返りました。「自分には反映された」ことと「全員に反映された」ことは別だと考えておきます。",
        },
      ],
    },
  ],
  demo: {
    description:
      "ボタンは本物の Server Action を呼び出し、タグ付きのキャッシュを失効させます。押した時点の画面の生成IDと応答後の生成IDを比べて表示します。値は閲覧者全員で共有しているので、変化の原因が自分の操作とは限りません。",
    steps: [
      "現在の生成IDを確認する",
      "3つのボタンをそれぞれ押し、生成IDの変わり方を比べる（値の生成や直前の操作から5秒間は失効を受け付けない）",
      "`revalidateTag` の後は「もう一度読み取る」を押し、値が変わるタイミングも確認する",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/actions.ts`,
      role: "Server Action",
      description: "指定された方法でキャッシュを失効させる",
    },
    {
      path: `${dir}/shared-data.ts`,
      role: "use cache: remote",
      description: "cacheTag を付けてキャッシュする値",
    },
    {
      path: `${dir}/revalidation-panel.tsx`,
      role: "Client Component",
      description: "useActionState で操作と結果の表示をつなぐ",
    },
    {
      path: `${dir}/trace.ts`,
      role: "Visualizer データ",
      description: "操作の結果とモデル図をフローとして定義する",
    },
    {
      path: `${dir}/action-state.ts`,
      role: "型と定数",
      description: "Server Action とボタンで共有する定義",
    },
    {
      path: `${dir}/revalidation-demo.tsx`,
      role: "Server Component",
      description: "キャッシュの値を読み取って Client Component に渡す",
    },
  ],
  inside: {
    files: [
      {
        path: `${dir}/page.tsx`,
        role: "Page",
        description: "解説と Live Demo を含むページ全体",
      },
      {
        path: `${dir}/revalidation-demo.tsx`,
        role: "Server Component",
        description: "リクエストごとにキャッシュの値を読み取る",
      },
      {
        path: `${dir}/shared-data.ts`,
        role: "use cache: remote",
        description: "タグ付きでキャッシュされる値",
      },
      {
        path: `${dir}/revalidation-panel.tsx`,
        role: "Client Component",
        description: "ボタンの操作と送信中の状態を扱う",
      },
      {
        path: `${dir}/actions.ts`,
        role: "Server Action",
        description: "ボタンから POST で呼び出される関数",
      },
      {
        path: `${dir}/action-state.ts`,
        role: "型と定数",
        description: "Server Action とボタンで共有する定義",
        runtime: "client",
        runtimeReason:
          '"use client" の revalidation-panel.tsx から import されるため Client（Server Action からも使用）',
      },
      {
        path: `${dir}/trace.ts`,
        role: "Visualizer データ",
        description: "操作の前後の値から処理の記録を組み立てる",
        runtime: "client",
        runtimeReason:
          '"use client" の revalidation-panel.tsx から import されるため Client',
      },
      {
        path: "src/components/visualizer/process-visualizer.tsx",
        role: "Client Component",
        description: "操作の記録とモデル図を再生する",
      },
    ],
    features: [
      {
        name: "cacheTag",
        description:
          '"revalidation-demo" タグを付け、失効させる対象を指定できるようにしています。',
      },
      {
        name: "updateTag / revalidateTag / revalidatePath",
        description: "Server Action の中で、選んだ方法の失効を実行します。",
      },
      {
        name: '"use cache: remote"',
        description:
          "値を remote 用のキャッシュハンドラーへ保存します。全インスタンスでの共有には、ホスティング先の保存先か `cacheHandlers` の設定が必要です。",
      },
      {
        name: "useActionState",
        description: "Server Action の結果と送信中の状態を受け取ります。",
      },
    ],
  },
  related: ["nextjs-cache", "server-actions", "route-handlers"],
}
