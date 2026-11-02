import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/static-and-dynamic"

const clientReason =
  '"use client" の delivery-panel.tsx から import されるため Client'

export const staticAndDynamicLesson: LessonContent = {
  slug: "static-and-dynamic",
  title: "Static / Dynamic",
  lead: "Cache Components では、Static と Dynamic はルート全体の二択ではありません。1つのページの中で、ビルド時に作れる部分は静的シェルになり、リクエストが必要な部分だけがリクエスト時に実行されます。",
  keyPoints: [
    "静的シェルに入る処理と、リクエスト時に実行される処理の見分け方",
    '`"use cache"` と `io()` と `<Suspense>` の役割の違い',
    "`next build` の ○ と ◐ の読み方",
  ],
  sections: [
    {
      id: "per-component",
      title: "ルート単位からコンポーネント単位へ",
      blocks: [
        {
          type: "paragraph",
          text: "以前のモデルでは、`cookies()` を1回読むだけでルート全体が Dynamic になりました。Cache Components を有効にすると、ページは Partial Prerendering で配信され、Static と Dynamic の分かれ目はコンポーネントの単位になります。",
        },
        {
          type: "comparison",
          columns: [
            {
              runtime: "server",
              title: "静的シェル",
              items: [
                "ビルド時に実行され、結果が保存される",
                "どのリクエストにも同じ内容が届く",
                "`<Suspense>` の fallback もここに含まれる",
              ],
            },
            {
              runtime: "server",
              title: "リクエスト時の部分",
              items: [
                "リクエストのたびに実行される",
                "静的シェルに続いて、同じ応答の中で届く",
                "`<Suspense>` の内側に置く",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "what-goes-where",
      title: "どの処理がどちらに入るか",
      blocks: [
        {
          type: "paragraph",
          text: "ビルド時に Next.js はコンポーネントツリーを実行し、それぞれの処理を次のように扱います。",
        },
        {
          type: "list",
          items: [
            "import、同期のファイル読み込み、純粋な計算: 静的シェルに入る",
            '`"use cache"` の結果: 寿命が短すぎなければ静的シェルに入る',
            "`cookies()` / `headers()` / `searchParams`: リクエスト時に実行する",
            "`io()` より後の処理: リクエスト時に実行する",
            "キャッシュしていない非同期のデータ取得: リクエスト時に実行する",
          ],
        },
        {
          type: "callout",
          tone: "note",
          title: "Suspense だけでは Dynamic にならない",
          text: "`<Suspense>` は、待っている間の表示を決めるものです。中身が同期処理だけなら、Suspense の内側でもプリレンダーの間に完了して静的シェルに入ります。",
        },
        {
          type: "paragraph",
          text: '`Date.now()` や `crypto.randomUUID()` のように実行のたびに値が変わる処理は、どちらにするかを明示する必要があります。全員に同じ値を見せるなら `"use cache"` で囲み、リクエストごとに変えるなら `await io()` の後に書いて `<Suspense>` の内側に置きます。',
        },
      ],
    },
    {
      id: "build-output",
      title: "ビルド結果の読み方",
      blocks: [
        {
          type: "paragraph",
          text: "`next build` は、ルートごとにどう配信されるかを記号で表示します。○ はページ全体が静的シェルで完結するルートです。◐（Partial Prerender）は静的シェルの後にリクエスト時の部分が続くルートで、このページもここに入ります。",
        },
        {
          type: "callout",
          tone: "caution",
          title: "生成時刻が変わるのはデプロイのときだけとは限らない",
          text: 'デモのシェルIDは `cacheLife("max")` で保存しています。このプロファイルの再検証の間隔は30日なので、同じデプロイの中でも、その期間を過ぎると作り直されることがあります。',
        },
      ],
    },
  ],
  demo: {
    description:
      "同じページの中に、静的シェルに入る値とリクエスト時に作る値を並べています。計測では、このページを取得し直して、それぞれの値が届いた時間を応答から記録します。",
    steps: [
      "ページを再読み込みし、シェルIDは変わらず、リクエストIDだけが変わることを確認する",
      "再読み込みの直後に、リクエスト時の部分に fallback が表示されることを確認する",
      "「計測する」を2回以上押し、表でIDの変化と到着時間の差を比べる",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/shell-output.tsx`,
      role: "静的シェル",
      description: '"use cache" で、ビルド時に作った値を保存する',
    },
    {
      path: `${dir}/request-output.tsx`,
      role: "リクエスト時",
      description: "io() より後の処理と Suspense の fallback",
    },
    {
      path: `${dir}/delivery-demo.tsx`,
      role: "Server Component",
      description: "静的シェルの部分と Suspense の境界を並べる",
    },
    {
      path: `${dir}/delivery-panel.tsx`,
      role: "Client Component",
      description: "children の出力を置き、計測の操作と結果を扱う",
    },
    {
      path: `${dir}/measure-delivery.ts`,
      role: "ブラウザの処理",
      description: "応答を読み進めて、値が届いた時間を記録する",
      runtime: "client",
      runtimeReason: clientReason,
    },
    {
      path: `${dir}/trace.ts`,
      role: "Visualizer データ",
      description: "モデル図と計測結果をフローとして定義する",
      runtime: "client",
      runtimeReason: clientReason,
    },
  ],
  inside: {
    files: [
      {
        path: `${dir}/page.tsx`,
        role: "Page",
        description: "解説と Source Code も静的シェルに含まれる",
      },
      {
        path: `${dir}/delivery-demo.tsx`,
        role: "Server Component",
        description: "デモの Server Components を組み合わせる",
      },
      {
        path: `${dir}/shell-output.tsx`,
        role: "静的シェル",
        description: "ビルド時に実行され、結果が静的シェルに入る",
      },
      {
        path: `${dir}/request-output.tsx`,
        role: "リクエスト時",
        description: "リクエストのたびに実行される",
      },
      {
        path: `${dir}/stamp-card.tsx`,
        role: "Server Component",
        description: "生成された値を表示する枠",
      },
      {
        path: `${dir}/delivery-panel.tsx`,
        role: "Client Component",
        description: "計測の操作と結果を扱う",
      },
      {
        path: `${dir}/measure-delivery.ts`,
        role: "ブラウザの処理",
        description: "このページの応答を読み進めて計測する",
        runtime: "client",
        runtimeReason: clientReason,
      },
      {
        path: `${dir}/trace.ts`,
        role: "Visualizer データ",
        description: "計測の結果から処理の記録を組み立てる",
        runtime: "client",
        runtimeReason: clientReason,
      },
      {
        path: "src/components/visualizer/process-visualizer.tsx",
        role: "Client Component",
        description: "モデル図と計測結果を再生する",
      },
    ],
    features: [
      {
        name: "Partial Prerendering",
        description:
          "解説・Source Code・シェルID・fallback は静的シェルに入り、リクエストIDの部分だけがリクエスト時に届きます。",
      },
      {
        name: '"use cache" / cacheLife',
        description:
          "シェルIDの Server Component をキャッシュし、ビルド時の結果を静的シェルに残しています。",
      },
      {
        name: "io()",
        description:
          "これより後の処理を静的シェルから外し、リクエストごとに実行します。",
      },
      {
        name: "<Suspense>",
        description:
          "リクエスト時の部分を囲み、fallback を静的シェルに含めています。",
      },
      {
        name: "Server → Client の children",
        description:
          "Client Component の DeliveryPanel が、サーバーの出力を children として受け取っています。",
      },
    ],
  },
  related: ["streaming", "nextjs-cache", "server-components"],
}
