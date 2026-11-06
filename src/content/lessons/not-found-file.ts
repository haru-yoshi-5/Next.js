import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/not-found-file"

const clientReason =
  '"use client" の not-found-panel.tsx から import されるため Client'

export const notFoundFileLesson: LessonContent = {
  slug: "not-found-file",
  title: "not-found.tsx",
  lead: "`notFound()` を呼ぶと描画が止まり、一番近い `not-found.tsx` が代わりに表示されます。どの `not-found.tsx` が使われるのか、ステータスコードはいくつになるのかを、実際に URL を取得して確かめます。",
  keyPoints: [
    "`notFound()` から、どの `not-found.tsx` が選ばれるか",
    "どのルートにも一致しない URL が `app/not-found.tsx` になる仕組み",
    "ステータスが 200 になる場合と 404 になる場合、本当の 404 を返す方法",
  ],
  sections: [
    {
      id: "nearest",
      title: "notFound() は一番近い not-found.tsx を表示する",
      blocks: [
        {
          type: "paragraph",
          text: "`notFound()` は、呼び出したところでエラーを throw して描画を止めます。そのエラーは親のフォルダへ順にさかのぼり、最初に見つかった `not-found.tsx` が、止まった部分の代わりに表示されます。`notFound()` は throw するため、後ろに `return` を書く必要はありません。TypeScript でも、その後ろでは値が見つかったものとして扱われます。",
        },
        {
          type: "list",
          items: [
            "同じフォルダに `not-found.tsx` があれば、それが表示される（デモの `items/[id]`）",
            "なければ親のフォルダへさかのぼる（デモの `orders/[id]` は `app/learn/not-found-file/not-found.tsx`）",
            "どこにもなければ `app/not-found.tsx`、それもなければ Next.js の既定の 404 画面になる",
          ],
        },
        {
          type: "paragraph",
          text: "`not-found.tsx` は props を受け取りません。どの値が見つからなかったかは渡されないため、文言は「商品が見つかりません」のような一般的なものにします。既定では Server Component で、async にしてデータを取得することもできます。",
        },
      ],
    },
    {
      id: "unmatched",
      title: "一致しない URL は app/not-found.tsx",
      blocks: [
        {
          type: "paragraph",
          text: "どのルートにも一致しない URL では、`notFound()` を呼ぶ page.tsx そのものがありません。この場合はフォルダの `not-found.tsx` ではなく、アプリ全体の `app/not-found.tsx` が表示されます。デモの「一致しない URL」は教材のフォルダの下の URL ですが、表示されるのは `app/not-found.tsx` です。",
        },
        {
          type: "callout",
          tone: "note",
          title: "global-not-found.tsx",
          text: "root layout が複数あるなど、layout と `not-found.tsx` の組み合わせで 404 ページを作れない場合のために、実験的な `global-not-found.tsx` もあります。layout を使わずに描画するため、`<html>` と `<body>` から自分で書きます。",
        },
      ],
    },
    {
      id: "status",
      title: "ステータスは 200 になることがある",
      blocks: [
        {
          type: "paragraph",
          text: 'ステータスコードは、応答の送信を始めるときに決まります。page.tsx の中で `notFound()` を呼んだときには、すでに 200 で送信が始まっていることがあり、後から 404 には変えられません。そのため Next.js は `<meta name="robots" content="noindex">` を加え、検索結果に載らないようにします。Cache Components を有効にしたこのサイトでは、動的なルートは静的なシェルを先に送るため、デモの `items/999` と `orders/999` はどちらも 200 になりました。',
        },
        {
          type: "paragraph",
          text: "本当の 404 を返すには、送信を始める前に、つまり描画より前に確かめる必要があります。Next.js のドキュメントでは、その確認を `proxy.ts` で行う方法が紹介されています。デモの `proxy.ts` は `checked/[id]` の商品の有無を確かめ、ない場合はどのルートにも一致しない URL に書き換えます。その結果 `app/not-found.tsx` が 404 で返ります。proxy は対象の URL へのリクエストのたびに描画より前に動くため、`matcher` で対象を絞り、確認は軽い処理にとどめます。",
        },
        {
          type: "comparison",
          columns: [
            {
              runtime: "server",
              title: "page.tsx で notFound()",
              items: [
                "一番近い not-found.tsx が表示される",
                "送信が始まった後なら、ステータスは 200 のまま",
                "noindex が加わるので、検索結果には載らない",
              ],
            },
            {
              runtime: "server",
              title: "proxy.ts で先に確かめる",
              items: [
                "描画の前に、一致しない URL へ書き換えるか応答を返す",
                "ステータスを 404 にできる",
                "表示されるのは app/not-found.tsx",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "pitfalls",
      title: "notFound() を使うときの注意",
      blocks: [
        {
          type: "list",
          items: [
            "`try/catch` で囲むと、`notFound()` のエラーも catch されて `not-found.tsx` が表示されない。近くでエラーを受け止めたい場合は、catch の中で先に `unstable_rethrow` を呼ぶ",
            "描画の流れの中で呼ぶ。await しない Promise の中で呼ぶと、受け止めるところがなく `not-found.tsx` は表示されない",
            "Route Handler の中で呼ぶと、ステータス 404 の応答を返す",
            "`not-found.tsx` は、同じフォルダの `error.tsx` に包まれる。`notFound()` は `error.tsx` には届かない",
          ],
        },
      ],
    },
  ],
  demo: {
    description:
      "6つの URL を実際に取得し、ステータスコードと noindex を調べます。さらに見えないフレームでページを開き、実際に表示されたファイルを確かめます。",
    steps: [
      "「存在する商品」と「存在しない商品」を取得し、表示されるファイルが変わることを確認する",
      "「存在しない注文」を取得し、親フォルダの not-found.tsx が使われることを確認する",
      "ここまでのステータスが、見つからない場合も 200 で、noindex が付くことを確認する",
      "「proxy を通す」の2つを取得し、存在しない場合だけ 404 になることを確認する",
      "「一致しない URL」を取得し、app/not-found.tsx が 404 で返ることを確認する",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/items/[id]/page.tsx`,
      role: "Page",
      description: "商品がなければ notFound() を呼ぶ",
    },
    {
      path: `${dir}/items/[id]/not-found.tsx`,
      role: "not-found",
      description: "同じフォルダの page.tsx の notFound() を受け止める",
    },
    {
      path: `${dir}/orders/[id]/page.tsx`,
      role: "Page",
      description: "not-found.tsx がないフォルダで notFound() を呼ぶ",
    },
    {
      path: `${dir}/not-found.tsx`,
      role: "not-found",
      description:
        "orders/[id] の notFound() を受け止める親フォルダの not-found",
    },
    {
      path: "src/proxy.ts",
      role: "Proxy",
      description:
        "描画の前に商品を確かめ、ない場合は一致しない URL へ書き換える",
    },
    {
      path: "src/app/not-found.tsx",
      role: "not-found",
      description: "一致しない URL で表示される、アプリ全体の not-found",
    },
  ],
  inside: {
    files: [
      {
        path: `${dir}/page.tsx`,
        role: "Page",
        description: "/learn/not-found-file（静的に配信）",
      },
      {
        path: `${dir}/not-found-panel.tsx`,
        role: "Client Component",
        description: "URL の取得と、結果の表示",
      },
      {
        path: `${dir}/measure-not-found.ts`,
        role: "計測",
        description:
          "ステータス・noindex・proxy の判断を調べ、見えないフレームで表示されたファイルを確かめる",
        runtime: "client",
        runtimeReason: clientReason,
      },
      {
        path: `${dir}/items/[id]/page.tsx`,
        role: "Page",
        description: "/learn/not-found-file/items/[id]",
      },
      {
        path: `${dir}/items/[id]/not-found.tsx`,
        role: "not-found",
        description: "商品が見つからないときの表示",
      },
      {
        path: `${dir}/orders/[id]/page.tsx`,
        role: "Page",
        description: "/learn/not-found-file/orders/[id]",
      },
      {
        path: `${dir}/not-found.tsx`,
        role: "not-found",
        description: "教材フォルダより下の notFound() を受け止める",
      },
      {
        path: "src/proxy.ts",
        role: "Proxy",
        description:
          "この教材では /learn/not-found-file/checked/[id] で動く（保護されたページ 教材の URL も、パスで分けて扱う）",
        runtime: "server",
        runtimeReason: "リクエストごとに、描画より前にサーバーで実行される",
      },
      {
        path: "src/app/not-found.tsx",
        role: "not-found",
        description: "一致しない URL の表示",
      },
      {
        path: `${dir}/demo-frame.tsx`,
        role: "共通の枠",
        description: "表示しているファイル名を示し、目印の属性を付ける",
      },
      {
        path: `${dir}/demo-data.ts`,
        role: "データ",
        description: "デモの商品と注文、ヘッダー名と属性名",
        runtime: "server",
        runtimeReason:
          "page と proxy から使われるが、not-found-panel.tsx からも import されるため Client バンドルにも含まれる",
      },
      {
        path: `${dir}/trace.ts`,
        role: "Visualizer データ",
        description: "計測した結果をフローに変換する",
        runtime: "client",
        runtimeReason: clientReason,
      },
    ],
    features: [
      {
        name: "not-found.tsx / notFound()",
        description:
          "フォルダごとに not-found.tsx を置き、どれが選ばれるかを比べています。",
      },
      {
        name: "Proxy",
        description:
          "描画の前に商品の有無を確かめ、ステータスを 404 にしています。",
      },
      {
        name: "Dynamic Routes / generateStaticParams",
        description:
          "存在する商品と注文だけをビルド時にプリレンダーしています。",
      },
      {
        name: "generateMetadata",
        description:
          "商品が見つからない場合は、タブのタイトルも「商品が見つかりません」にしています。",
      },
    ],
  },
  related: ["dynamic-routes", "error-file", "route-handlers"],
}
