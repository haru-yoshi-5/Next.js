import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/dynamic-routes"

const clientReason =
  '"use client" の article-panel.tsx から import されるため Client'

export const dynamicRoutesLesson: LessonContent = {
  slug: "dynamic-routes",
  title: "Dynamic Routes",
  lead: "フォルダ名を `[id]` のように角括弧で囲むと、URL のその部分に入った値を `params` として受け取れます。Cache Components を有効にすると、値が `generateStaticParams` に含まれるかどうかで、ページの届き方が変わります。",
  keyPoints: [
    "`[id]`・`[...slug]`・`[[...slug]]` の違いと、`params` の型",
    "`generateStaticParams` に含まれる値と含まれない値で、届き方が変わる理由",
    "存在しない値で `notFound()` を呼んでも、ステータスが 200 になる理由",
  ],
  sections: [
    {
      id: "segments",
      title: "Dynamic Segment の種類",
      blocks: [
        {
          type: "paragraph",
          text: "`[slug]` で値を受け取り、`params` を `await` して使う基本は App Router 教材で扱いました。角括弧の中に `...` を付けると、それ以降のセグメントをまとめて配列で受け取れます。",
        },
        {
          type: "list",
          items: [
            "`articles/[id]/page.tsx` → `/articles/42` で `{ id: '42' }`",
            "`shop/[...slug]/page.tsx` → `/shop/a/b` で `{ slug: ['a', 'b'] }`。`/shop` にはマッチしない",
            "`shop/[[...slug]]/page.tsx` → `/shop` にもマッチし、そのときは `{ slug: undefined }`",
          ],
        },
        {
          type: "callout",
          tone: "caution",
          title: "params の値は誰でも自由に入力できる",
          text: "`params` の値は、アドレスバーに入力された任意の文字列です。そのため型は `string` になります。このデモの `findArticle` のように、形式と範囲をサーバー側で確かめてから使います。",
        },
      ],
    },
    {
      id: "static-params",
      title: "generateStaticParams で事前に作る値を決める",
      blocks: [
        {
          type: "paragraph",
          text: "`generateStaticParams` が返した値のページは、ビルド時にプリレンダーされます。このデモでは 1〜3 を返しているため、ビルドの出力では `/learn/dynamic-routes/articles/1` などが ○（Static）になります。",
        },
        {
          type: "paragraph",
          text: "Cache Components では、返した値以外のページも同じ URL で表示できます。ビルド時には、値が決まっていない状態で1回描画し、`await params` で止まるところまでを App Shell として保存します。返していない値のリクエストには App Shell を先に返し、`params` を使う部分をリクエスト時に描画して、同じ応答の続きとして送ります。",
        },
        {
          type: "callout",
          tone: "note",
          title: "空の配列は返せない",
          text: "Cache Components では、`generateStaticParams` は少なくとも1つの値を返す必要があります。空の配列を返すとビルドエラーになります。また、返していない値を 404 にする `dynamicParams` は使えません。",
        },
      ],
    },
    {
      id: "not-found-status",
      title: "notFound() とステータスコード",
      blocks: [
        {
          type: "paragraph",
          text: "存在しない値では `notFound()` を呼び、同じフォルダの `not-found.tsx` を表示します。ただし、App Shell を送った時点で、レスポンスのステータスとヘッダーはすでに送信されています。そのため、後から `notFound()` が呼ばれてもステータスは 200 のままです。",
        },
        {
          type: "paragraph",
          text: '代わりに Next.js は `<meta name="robots" content="noindex">` を HTML に加え、検索エンジンに登録されないようにします。404 のステータスを返す必要がある場合は、応答を送り始める前に、proxy で値を確かめます。',
        },
      ],
    },
    {
      id: "measured",
      title: "このデモで実測したこと",
      blocks: [
        {
          type: "comparison",
          columns: [
            {
              runtime: "server",
              title: "generateStaticParams に含まれる値",
              items: [
                "ビルド時に作った完成した HTML が、最初の応答でまとめて届く",
                "`next start` では `x-nextjs-cache: HIT` が付く",
                "page.tsx はリクエストのたびには実行されない",
              ],
            },
            {
              runtime: "server",
              title: "含まれない値（有効・存在しないの両方）",
              items: [
                "loading.tsx の表示を含む App Shell が先に届く",
                "記事、または `notFound()` の結果が同じ応答の続きとして届く",
                "`next start` では `x-nextjs-postponed: 1` が付き、2回目以降も同じ届き方だった",
              ],
            },
          ],
        },
        {
          type: "paragraph",
          text: "表示されるヘッダーはデプロイ先によって変わります。このデモでは、ヘッダーではなく HTML の中身から届き方を判定しています。完成した HTML か、App Shell に続いて記事や `noindex` が届いたかを見ています。",
        },
      ],
    },
  ],
  demo: {
    description:
      "ボタンを押すと、articles/[id] の記事ページを fetch() で取得します。応答を読み進めながら、App Shell・記事・noindex の目印がいつ届いたかを記録し、届き方を判定しています。",
    steps: [
      "「articles/1」を押し、完成した HTML が届くことを確認する",
      "「articles/42」を押し、App Shell が先に届いた後に記事が届くことを確認する",
      "「articles/999」を押し、ステータスが 200 のまま not-found の結果が届くことを確認する",
      "任意の値（例: 7、abc）で取得し、同じルールで判定されることを確かめる",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/articles/[id]/page.tsx`,
      role: "Dynamic Route",
      description:
        "generateStaticParams で 1〜3 を返し、params に応じて記事を表示する",
    },
    {
      path: `${dir}/articles/[id]/loading.tsx`,
      role: "loading",
      description: "App Shell に含まれ、記事を待つ間に表示される",
    },
    {
      path: `${dir}/articles/[id]/not-found.tsx`,
      role: "not-found",
      description: "notFound() が呼ばれたときに page の代わりに表示される",
    },
    {
      path: `${dir}/articles.ts`,
      role: "データ",
      description: "有効な番号の範囲と、事前生成する番号",
      runtime: "server",
      runtimeReason:
        "記事ページから使われるが、article-panel.tsx からも import されるため Client バンドルにも含まれる",
    },
    {
      path: `${dir}/measure-article.ts`,
      role: "ブラウザの処理",
      description: "記事ページを取得し、届き方を判定する",
      runtime: "client",
      runtimeReason: clientReason,
    },
    {
      path: `${dir}/article-panel.tsx`,
      role: "Client Component",
      description: "値を選んで取得し、結果を表に残す",
    },
  ],
  inside: {
    files: [
      {
        path: `${dir}/page.tsx`,
        role: "Page",
        description: "リクエスト時のデータを使わず、静的に配信される",
      },
      {
        path: `${dir}/articles/[id]/page.tsx`,
        role: "Dynamic Route",
        description: "/learn/dynamic-routes/articles/[id]",
      },
      {
        path: `${dir}/articles/[id]/loading.tsx`,
        role: "loading",
        description: "[id]/page.tsx を Suspense で包む",
      },
      {
        path: `${dir}/articles/[id]/not-found.tsx`,
        role: "not-found",
        description: "該当する記事がないときの表示",
      },
      {
        path: `${dir}/article-frame.tsx`,
        role: "Server Component",
        description: "記事ページの枠。表示しているファイル名を示す",
      },
      {
        path: `${dir}/articles.ts`,
        role: "データ",
        description: "generateStaticParams と入力の検証で使う",
        runtime: "server",
        runtimeReason:
          "記事ページから使われるが、article-panel.tsx からも import されるため Client バンドルにも含まれる",
      },
      {
        path: `${dir}/article-panel.tsx`,
        role: "Client Component",
        description: "入力と計測の状態を扱う",
      },
      {
        path: `${dir}/measure-article.ts`,
        role: "ブラウザの処理",
        description: "応答を読み進めて目印の到着を記録する",
        runtime: "client",
        runtimeReason: clientReason,
      },
      {
        path: `${dir}/trace.ts`,
        role: "Visualizer データ",
        description: "計測結果をフローに変換する",
        runtime: "client",
        runtimeReason: clientReason,
      },
      {
        path: "src/components/visualizer/process-visualizer.tsx",
        role: "Client Component",
        description: "モデル図と、実際の計測から作った記録を再生する",
      },
    ],
    features: [
      {
        name: "Dynamic Segment",
        description:
          "[id] フォルダで /learn/dynamic-routes/articles/ 以下の任意の値を受け取っています。",
      },
      {
        name: "generateStaticParams",
        description:
          "1〜3 をビルド時にプリレンダーし、それ以外の値には App Shell を先に返します。",
      },
      {
        name: "Partial Prerendering",
        description:
          "await params で止まる部分を loading.tsx の表示にして、App Shell に含めています。",
      },
      {
        name: "notFound() / not-found.tsx",
        description:
          "存在しない値で not-found.tsx を表示します。App Shell の後なのでステータスは 200 です。",
      },
      {
        name: "Streaming の読み取り",
        description:
          "fetch() の応答をストリームで読み、目印が届いた時間を記録しています。",
      },
    ],
  },
  related: ["app-router", "static-and-dynamic", "streaming"],
}
