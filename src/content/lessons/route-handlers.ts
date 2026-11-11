import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/route-handlers"

const clientReason =
  '"use client" の request-panel.tsx から import されるため Client'

export const routeHandlersLesson: LessonContent = {
  slug: "route-handlers",
  title: "Route Handlers",
  lead: "`route.ts` に HTTP メソッドの名前で関数を書くと、その URL へのリクエストを受け取る Route Handler になります。Web 標準の Request を受け取り、Response を返す、URL を持った HTTP エンドポイントです。",
  keyPoints: [
    "`route.ts` に GET / POST などの関数を定義する書き方",
    "定義していないメソッドや、不正な入力へのレスポンスの返し方",
    "Server Actions との使い分けと、GET のキャッシュの扱い",
  ],
  sections: [
    {
      id: "route-file",
      title: "route.ts で HTTP エンドポイントを作る",
      blocks: [
        {
          type: "paragraph",
          text: "`app` ディレクトリの中に `route.ts` を置き、`GET`・`POST`・`PUT`・`PATCH`・`DELETE`・`HEAD`・`OPTIONS` の名前で関数を export します。関数は Web 標準の Request（Next.js が拡張した `NextRequest`）を受け取り、Response を返します。",
        },
        {
          type: "paragraph",
          text: "同じルートセグメントに `page.tsx` と `route.ts` は置けません。このデモでは、教材ページの `learn/route-handlers/page.tsx` とは別のフォルダに `api/route.ts` を置き、`/learn/route-handlers/api` という URL で受け付けています。Route Handler は layout には含まれず、返す内容は Response で自由に決められます。このデモでは JSON を返しています。",
        },
        {
          type: "callout",
          tone: "note",
          title: "定義していないメソッドには 405 が返る",
          text: "`route.ts` に関数がないメソッドでリクエストすると、Next.js が `405 Method Not Allowed` を返します。ただし、`HEAD` と `OPTIONS` は例外です。`GET` を定義していれば `HEAD` は `GET` を使って自動で応答し、`OPTIONS` は定義しなくても自動で用意されて、使えるメソッドが `Allow` ヘッダーで返されます。",
        },
      ],
    },
    {
      id: "validate",
      title: "入力はサーバー側で検証する",
      blocks: [
        {
          type: "paragraph",
          text: "Route Handler は URL を持つため、アプリの画面を経由せず、誰でも直接リクエストを送れます。本文の大きさ・形式・内容は Route Handler の中で確認し、問題があれば `400 Bad Request` などのステータスコードで理由を返します。",
        },
        {
          type: "paragraph",
          text: "本番のアプリでは、ログイン状態や権限の確認も Route Handler の中で行います。画面でボタンを隠すだけでは、直接のリクエストを防げません。",
        },
      ],
    },
    {
      id: "compare-actions",
      title: "Server Actions との使い分け",
      blocks: [
        {
          type: "comparison",
          columns: [
            {
              runtime: "server",
              title: "Route Handlers",
              items: [
                "URL を持ち、メソッドもレスポンスの形式も自由に決められる",
                "Webhook の受け取りや、外部のサービス・アプリに公開する API に向く",
                "Client Component から fetch() で呼び出す",
              ],
            },
            {
              runtime: "server",
              title: "Server Actions",
              items: [
                "アプリの画面からのデータ更新に向く",
                "フォームと組み合わせて、更新後の画面を1回の応答で受け取れる",
                "URL を意識せず、関数として呼び出せる",
              ],
            },
          ],
        },
        {
          type: "callout",
          tone: "caution",
          title: "Server Component からは自分の Route Handler を fetch しない",
          text: "Server Component はサーバーで動くため、データの取得元を直接呼び出せます。Route Handler を経由すると HTTP の往復が1回増えるうえ、ビルド時のプリレンダーではリクエストを受け付けるサーバーがないため失敗します。",
        },
      ],
    },
    {
      id: "caching",
      title: "GET のキャッシュ",
      blocks: [
        {
          type: "paragraph",
          text: "Cache Components を有効にすると、`GET` の Route Handler もページと同じ考え方で扱われます。リクエスト時のデータを使わなければビルド時にプリレンダーされ、`request` のプロパティや `headers()` などを読むとリクエストのたびに実行されます。`GET` 以外のメソッドはキャッシュされません。",
        },
        {
          type: "paragraph",
          text: '結果をキャッシュしたい処理は、`"use cache"` を書いた別の関数に切り出して呼び出します。Route Handler の関数本体には `"use cache"` を直接書けません。',
        },
      ],
    },
    {
      id: "demo-store",
      title: "このデモの保存先",
      blocks: [
        {
          type: "paragraph",
          text: "デモのメッセージは、データベースの代わりにサーバーのメモリ（`message-store.ts`）へ一時的に保存しています。一覧は同じインスタンスにアクセスした利用者の間で共有されるため、他の人のメッセージも表示されることがあります。新しい順に20件まで残ります。GET では、そのうち最新の3件を返します。",
        },
        {
          type: "callout",
          tone: "caution",
          title: "本番では、追加したメッセージが GET の一覧に出ないことがある",
          text: "Vercel などのサーバーレス環境では、リクエストごとに別のサーバー（インスタンス）が応答することがあり、メモリの内容はインスタンスの間で共有されません。POST と GET は別のリクエストのため、GET が別のインスタンスに届くと、追加したメッセージは一覧に出ません。保存できたかどうかは、POST の応答（201 Created と、返ってきたメッセージ）で確かめてください。本番のアプリでは、どのインスタンスからも読み書きできるデータベースなどに保存します。",
        },
      ],
    },
  ],
  demo: {
    description:
      "ボタンを押すと、教材ページから本物の Route Handler（api/route.ts）へ fetch() でリクエストを送ります。届いたステータスコード・ヘッダー・本文をそのまま表示し、サーバーでの処理時間は Server-Timing ヘッダーから読み取っています。",
    steps: [
      "「GET を送る」を押し、200 OK と JSON の一覧が届くことを確認する",
      "メッセージを入力して「POST を送る」を押し、201 Created と、保存されたメッセージが本文で返ることを確認する",
      "空欄のまま POST を送り、Route Handler の検証で 400 Bad Request が返ることを確認する",
      "「PUT を送る」を押し、関数が実行されずに 405 Method Not Allowed が返ることを確認する",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/api/route.ts`,
      role: "Route Handler",
      description: "GET と POST を受け付け、検証して JSON を返す",
    },
    {
      path: `${dir}/message-store.ts`,
      role: "Data Source",
      description:
        "データベースの代わりにメモリへ一時保存するストア（インスタンスの間で共有されない）",
    },
    {
      path: `${dir}/request-panel.tsx`,
      role: "Client Component",
      description: "ボタンと入力欄から Route Handler を呼び出す",
    },
    {
      path: `${dir}/call-route.ts`,
      role: "ブラウザの処理",
      description: "fetch() でリクエストを送り、レスポンスを記録する",
      runtime: "client",
      runtimeReason: clientReason,
    },
    {
      path: `${dir}/response-view.tsx`,
      role: "Client Component",
      description: "ステータス・ヘッダー・本文を表示する",
      runtime: "client",
      runtimeReason: clientReason,
    },
    {
      path: `${dir}/trace.ts`,
      role: "Visualizer データ",
      description: "レスポンスからフローを組み立てる",
      runtime: "client",
      runtimeReason: clientReason,
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
        path: `${dir}/api/route.ts`,
        role: "Route Handler",
        description: "/learn/route-handlers/api へのリクエストを受け付ける",
      },
      {
        path: `${dir}/message-store.ts`,
        role: "Data Source",
        description: "server-only で保護されたメモリ上のストア",
      },
      {
        path: `${dir}/request-panel.tsx`,
        role: "Client Component",
        description: "入力とリクエストの状態を扱う",
      },
      {
        path: `${dir}/call-route.ts`,
        role: "ブラウザの処理",
        description: "ブラウザから Route Handler へ fetch() する",
        runtime: "client",
        runtimeReason: clientReason,
      },
      {
        path: `${dir}/response-view.tsx`,
        role: "Client Component",
        description: "届いたレスポンスを表示する",
        runtime: "client",
        runtimeReason: clientReason,
      },
      {
        path: `${dir}/trace.ts`,
        role: "Visualizer データ",
        description: "ブラウザで処理の記録を組み立てる",
        runtime: "client",
        runtimeReason: clientReason,
      },
      {
        path: "src/components/visualizer/process-visualizer.tsx",
        role: "Client Component",
        description: "モデル図と、実際のレスポンスから作った記録を再生する",
      },
    ],
    features: [
      {
        name: "route.ts",
        description:
          "GET と POST を export し、/learn/route-handlers/api で受け付けています。",
      },
      {
        name: "NextRequest / Response.json()",
        description:
          "クエリ文字列と本文を読み取り、ステータスコード付きの JSON を返します。",
      },
      {
        name: "405 Method Not Allowed",
        description:
          "定義していない PUT へのリクエストに、Next.js が自動で応答します。",
      },
      {
        name: "Server-Timing",
        description:
          "サーバーで計測した時間をレスポンスヘッダーに入れ、ブラウザで読み取っています。",
      },
      {
        name: "server-only",
        description:
          "ストアのモジュールが Client Component から import されないことをビルド時に保証します。",
      },
    ],
  },
  related: ["server-actions", "data-fetching", "client-components"],
}
