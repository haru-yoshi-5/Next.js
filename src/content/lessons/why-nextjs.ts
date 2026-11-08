import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/why-nextjs"

const clientImportReason =
  '"use client" の why-panel.tsx から import されるため Client'

export const whyNextjsLesson: LessonContent = {
  slug: "why-nextjs",
  title: "Next.jsを使う理由",
  lead: "Next.js を選ぶ理由は、機能の多さよりも、Web アプリに必要な仕組みを1つのプロジェクトで組み合わせて使えることにあります。このサイト NextScope がなぜ Next.js で作られているのかを、実際の実装と結び付けて見ていきます。",
  keyPoints: [
    "このサイトに必要だったことと、それを担当する Next.js の仕組み",
    "本文を先に届けることと、ブラウザの仕事を絞ることの利点",
    "Next.js を選ばない判断が合う場合と、引き受けるコスト",
  ],
  sections: [
    {
      id: "what-this-site-needs",
      title: "このサイトに必要だったこと",
      blocks: [
        {
          type: "paragraph",
          text: "NextScope は、読む教材と、操作して確かめるデモを組み合わせたサイトです。作るにあたって、次のことが必要でした。",
        },
        {
          type: "list",
          items: [
            "本文の配信 — 解説や Source Code を、JavaScript を待たずに読める形で届ける",
            "操作できるデモ — ボタンや入力に反応し、結果をその場で表示する",
            "サーバーでの処理 — ログイン、フォームからの更新、API への応答を、ブラウザに任せずサーバーで行う",
            "公開と共有 — 検索エンジンや SNS に、ページのタイトルや URL を正しく伝える",
          ],
        },
        {
          type: "paragraph",
          text: "React だけで作る場合、それぞれに合うライブラリやサーバーを選んで組み合わせることになります。Next.js では、これらをルーティングと同じ規約の上で、1つのプロジェクトとして扱えます。",
        },
      ],
    },
    {
      id: "deliver-content-first",
      title: "本文を先に届けられる",
      blocks: [
        {
          type: "paragraph",
          text: "先に用意できる本文はビルド時に作っておき、リクエストのたびに必要な部分だけを後から届けられます。遅い処理があっても、その待ち時間がページ全体に広がりにくくなります。",
        },
        {
          type: "paragraph",
          text: "例えば「Reactとの関係」のページでは、解説はビルド時に HTML になっています。デモのサーバー生成IDだけが、`<Suspense>` の内側で `io()` の後に、リクエスト時に描画されます。",
        },
        {
          type: "callout",
          tone: "note",
          title: "速さが保証されるわけではない",
          text: "Next.js を使えば必ず速くなる、というわけではありません。どこを先に作り、どこをリクエスト時に回すかを選べることが利点です。仕組みは「静的と動的」と「ストリーミング」で詳しく扱います。",
        },
      ],
    },
    {
      id: "narrow-browser-work",
      title: "ブラウザの仕事を絞れる",
      blocks: [
        {
          type: "paragraph",
          text: "Server Component 自身の実装は、ブラウザで実行する JavaScript に含まれません。操作が必要な部分だけを Client Component にすることで、ブラウザ側の処理を抑えられます。",
        },
        {
          type: "comparison",
          columns: [
            {
              runtime: "server",
              title: "このサイトでサーバーが担当すること",
              items: [
                "Source Code 欄のファイルを読み込む",
                "Shiki でコードに色を付ける（`server-only` のファイルで行う）",
                "色付けしたコードを描画して、完成した UI を渡す",
              ],
            },
            {
              runtime: "client",
              title: "このサイトでブラウザが担当すること",
              items: [
                "Source Code 欄のタブを切り替える",
                "Live Demo のボタン操作と結果の表示",
                "Process Visualizer の再生",
              ],
            },
          ],
        },
        {
          type: "callout",
          tone: "caution",
          title: "JavaScript がなくなるわけではない",
          text: "Client Components や Next.js 自体の JavaScript、HTML と RSC Payload は、引き続きブラウザに届きます。減らせるのは、サーバーだけで済む部分の実装です。",
        },
      ],
    },
    {
      id: "one-project",
      title: "サーバーの処理と公開の仕組みをまとめられる",
      blocks: [
        {
          type: "paragraph",
          text: "画面と同じプロジェクトの中で、サーバーの処理や公開に必要な情報も、決まった API やファイルの置き場所で書けます。このサイトでは次のように使っています。",
        },
        {
          type: "list",
          items: [
            "Server Actions — フォームからの更新やログインを、画面のコードの近くに書く",
            "Route Handlers — `route.ts` で、HTTP の API に応答する",
            "Proxy — ページを描画する前に、リクエストを通すか振り分けるかを決める",
            "`next/font` — Google Fonts をビルド時に取り込み、このサイトと同じドメインから配信する",
            "metadata・`sitemap.ts`・`robots.ts` — ページのタイトルや URL、検索エンジン向けの情報を出力する",
            "`<Link>` — ページ全体を読み込み直さずに移動し、本番では条件に応じて移動先を先に読み込む",
          ],
        },
        {
          type: "callout",
          tone: "caution",
          title: "まとめて書けても、確認は入口ごとに必要",
          text: "認証の共通コードを、ページ・Server Action・Route Handler から使えます。ただし、Proxy を置けば認証が済むわけではありません。このサイトでも、Proxy を通った後にページ側でもう一度確認しています。",
        },
      ],
    },
    {
      id: "when-not",
      title: "Next.js を選ばない判断もある",
      blocks: [
        {
          type: "paragraph",
          text: "Next.js は、必要な機能と、引き受ける負担の釣り合いで選ぶものです。次のような点は、事前に考えておく必要があります。",
        },
        {
          type: "list",
          items: [
            "規模 — 更新の少ない静的なページだけなら、より小さい構成で足りることがある（Next.js にも静的に書き出す方法はあるが、使えない機能がある）",
            "実行する環境 — 認証やリクエスト時の処理を使うなら、サーバーで動かせる配信先が必要になる",
            "学ぶことと保守 — ファイルの規約やキャッシュの考え方を理解し、版が上がったときの変更を確認し続ける必要がある",
          ],
        },
        {
          type: "paragraph",
          text: "このサイトは、認証や Server Actions を実際に使うため、サーバーで動かせる環境を前提にしています。Next.js 16 で変わった API にも合わせています。",
        },
      ],
    },
  ],
  demo: {
    description:
      "このページに届いたものから、Next.js の仕組みが残した跡を調べます。フォントの配信元、`<head>` に入ったメタデータ、`/sitemap.xml` と `/robots.txt` の中身を確かめ、それぞれを担当するファイルと結び付けます。ここで分かるのは「出力されていること」までで、検索順位などの効果を測るものではありません。",
    steps: [
      "「このページを調べる」を押す",
      "フォントが、このサイトと同じ origin から届いていることを確認する",
      "ページのタイトル・canonical・og:url が、この教材の値になっていることを確認する",
      "sitemap にこの教材の URL があり、robots.txt が sitemap を参照していることを確認する",
      "右側で、それぞれの跡を出力した仕組みを確認する",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/page.tsx`,
      role: "Page",
      description: "metadata を出力し、WhyDemo を配置している",
    },
    {
      path: `${dir}/why-demo.tsx`,
      role: "Server Component",
      description: "このサイトの URL 設定から、期待する値を作って渡す",
    },
    {
      path: `${dir}/why-panel.tsx`,
      role: "Client Component",
      description: "調べるボタンと、確認できた跡の表示を扱う",
    },
    {
      path: `${dir}/inspect-site.ts`,
      role: "ブラウザの処理",
      description:
        "フォントの取得記録、head のメタデータ、sitemap と robots を調べる",
      runtime: "client",
      runtimeReason: clientImportReason,
    },
    {
      path: `${dir}/trace.ts`,
      role: "Visualizer データ",
      description: "調べた結果から、仕組みと跡の対応を組み立てる",
      runtime: "client",
      runtimeReason: clientImportReason,
    },
    {
      path: "src/lib/lesson-metadata.ts",
      role: "metadata",
      description: "教材データから title・canonical・Open Graph を作る",
    },
    {
      path: "src/app/sitemap.ts",
      role: "Route Handler",
      description: "公開中の教材から /sitemap.xml を作る",
    },
    {
      path: "src/app/robots.ts",
      role: "Route Handler",
      description: "/robots.txt を作り、sitemap の場所を伝える",
    },
  ],
  inside: {
    files: [
      {
        path: "src/app/layout.tsx",
        role: "Root Layout",
        description: "next/font でフォントを読み込み、共通の metadata を定める",
      },
      {
        path: "src/app/learn/layout.tsx",
        role: "Layout",
        description: "教材ページ共通のサイドバー付きレイアウト",
      },
      {
        path: `${dir}/page.tsx`,
        role: "Page",
        description: "/learn/why-nextjs の URL で表示されるページ",
      },
      {
        path: `${dir}/why-demo.tsx`,
        role: "Server Component",
        description: "プリレンダー時に実行され、期待する値を用意する",
      },
      {
        path: `${dir}/why-panel.tsx`,
        role: "Client Component",
        description: "Server と Client の境界。ボタンの操作を扱う",
      },
      {
        path: "src/app/sitemap.ts",
        role: "Route Handler",
        description: "特別な Route Handler。ビルド時に作られ、キャッシュされる",
      },
      {
        path: "src/components/visualizer/process-visualizer.tsx",
        role: "Client Component",
        description: "仕組みと跡の対応を再生する",
      },
    ],
    features: [
      {
        name: "next/font",
        description:
          "layout.tsx で Geist・Geist Mono・Noto Sans JP を読み込んでいます。フォントはビルド時に取り込まれ、/_next/static/media から配信されます。Noto Sans JP はサイズが大きいため preload: false にしています。",
      },
      {
        name: "metadata と title.template",
        description:
          "Root Layout の title.template と、教材ごとの createLessonMetadata() を組み合わせて、<title> や canonical を出力しています。",
      },
      {
        name: "sitemap.ts と robots.ts",
        description:
          "決まったファイル名で置くと、/sitemap.xml と /robots.txt に応答する特別な Route Handler になります。sitemap は、カリキュラムで公開中の教材から作っています。",
      },
      {
        name: "Resource Timing",
        description:
          "ブラウザが記録した取得の一覧から、フォントファイルの URL を探しています。記録の上限や設定で見つからないときは、「確認できなかった」ではなく「観測できなかった」と表示します。",
      },
    ],
  },
  related: ["static-and-dynamic", "server-components", "protected-pages"],
}
