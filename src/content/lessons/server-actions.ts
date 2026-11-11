import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/server-actions"

export const serverActionsLesson: LessonContent = {
  slug: "server-actions",
  title: "Server Actions",
  lead: '`"use server"` で定義した関数は、フォームやボタンからそのまま呼び出せる Server Action になります。呼び出しはブラウザからの POST リクエストになり、関数の本体はサーバーでだけ実行されます。',
  keyPoints: [
    "フォーム送信から Server Action の実行、画面の更新までの流れ",
    "バリデーションとエラー処理をサーバー側で行う理由",
    "`updateTag` でキャッシュを更新し、1回の往復で新しい UI を受け取る仕組み",
  ],
  sections: [
    {
      id: "what-is-server-action",
      title: "Server Action とは",
      blocks: [
        {
          type: "paragraph",
          text: 'Server Action は、サーバーで実行される非同期関数（Server Function）を、フォーム送信やデータ更新に使う呼び方です。ファイルの先頭、または関数本体の先頭に `"use server"` を書いて定義します。',
        },
        {
          type: "paragraph",
          text: "Client Component から Server Action を import すると、ブラウザ側のバンドルには関数の本体ではなく「サーバーの関数を呼び出すための参照」だけが含まれます。`<form action={saveName}>` のように渡すと、送信時に Next.js が POST リクエストを送り、サーバーで関数が実行されます。",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "ブラウザでフォームが送信される",
            "Server Action の ID とフォームデータが POST で Next.js Server へ送られる",
            "サーバーで `saveName(prevState, formData)` が実行される",
            "バリデーション → データ更新 → キャッシュの更新",
            "戻り値と、更新後のページの描画結果が1回の応答で返される",
          ],
        },
      ],
    },
    {
      id: "security",
      title: "検証と認可は必ずサーバー側で行う",
      blocks: [
        {
          type: "paragraph",
          text: "Server Action はアプリの UI からだけでなく、直接 POST リクエストを送ることでも呼び出せます。`input` の `maxLength` などブラウザ側の制限は簡単に回避できるため、入力値の検証や、本番アプリでのログイン状態・権限の確認は Server Action の中で行います。",
        },
        {
          type: "callout",
          tone: "caution",
          title: "このデモではブラウザ側の検証をあえて付けていません",
          text: "空欄や21文字以上の名前もそのまま送信され、サーバー側の `validateName` で弾かれる様子を確認できます。エラーの詳細はサーバーのログにだけ出力し、ブラウザには利用者向けのメッセージを返しています。",
        },
      ],
    },
    {
      id: "pending-and-state",
      title: "useActionState で結果と送信中の状態を受け取る",
      blocks: [
        {
          type: "paragraph",
          text: "`useActionState(saveName, initialState)` は、Server Action の戻り値を state として保持し、送信中かどうかを示す `isPending` も返します。デモでは、戻り値にメッセージと処理の記録（Process Visualizer 用のデータ）を含めています。",
        },
        {
          type: "paragraph",
          text: "`<form action>` に Server Action を渡す構成はプログレッシブエンハンスメントに対応しており、JavaScript の読み込みが終わる前に送信されたフォームも処理されます。",
        },
      ],
    },
    {
      id: "revalidate",
      title: "データ更新後に画面を最新にする",
      blocks: [
        {
          type: "paragraph",
          text: '名前の一覧（`GuestbookList`）は `"use cache"` でキャッシュされ、`cacheTag("guestbook")` でタグが付いています。Server Action の中で `updateTag("guestbook")` を呼ぶと、このキャッシュがすぐに期限切れになり、同じ応答の中で新しいデータの一覧が描画されます。',
        },
        {
          type: "comparison",
          columns: [
            {
              runtime: "server",
              title: "updateTag",
              items: [
                "Server Action の中でだけ使える",
                "自分が行った変更をすぐ画面に反映したいとき（read-your-own-writes）",
                "次の描画は古いキャッシュを使わず、新しいデータを待つ",
              ],
            },
            {
              runtime: "server",
              title: "revalidateTag / revalidatePath",
              items: [
                "Route Handler などからも使える",
                '`revalidateTag(tag, "max")` は古いデータを返しつつ裏で更新する',
                "パス単位でまとめて無効化したいときは `revalidatePath`",
              ],
            },
          ],
        },
        {
          type: "callout",
          tone: "caution",
          title: "このデモの名前は一時保存",
          text: '名前は、データベースの代わりにサーバーのメモリ（`guestbook-store.ts`）へ一時的に保存しています。一覧は同じインスタンスにアクセスした利用者の間で共有されるため、他の人の名前も表示されることがあります。新しい順に8件まで残ります。保存した直後は、Server Action と同じ応答の中で一覧が描画されるため、名前が一覧に出ます。ただし Vercel などのサーバーレス環境では、ページを読み込み直すと別のサーバー（インスタンス）が応答し、名前が消えて見えることがあります。メモリの内容も、`"use cache"` の既定のキャッシュも、インスタンスごとに別々だからです。本番のアプリでは、どのインスタンスからも読み書きできるデータベースなどに保存します。',
        },
      ],
    },
  ],
  demo: {
    description:
      "フォームの送信は本物の Server Action（actions.ts）を呼び出します。右側には、Server Action がサーバーで計測して返した処理の記録が表示されます。",
    steps: [
      "名前を入力して「保存する」を押す",
      "保存した直後の画面で、一覧に名前が追加され、「キャッシュ生成」の時刻が更新されることを確認する",
      "空欄のまま送信したり「error」と入力したりして、エラー時のフローも比べる",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/actions.ts`,
      role: "Server Action",
      description: "バリデーション・データ更新・updateTag を行う Server Action",
    },
    {
      path: `${dir}/name-form.tsx`,
      role: "Client Component",
      description: "useActionState でフォームと Server Action をつなぐ",
    },
    {
      path: `${dir}/guestbook-list.tsx`,
      role: "Server Component",
      description: '"use cache" と cacheTag でキャッシュされた一覧',
    },
    {
      path: `${dir}/guestbook-store.ts`,
      role: "Data Source",
      description:
        "データベースの代わりにメモリへ一時保存するストア（インスタンスの間で共有されない）",
    },
    {
      path: `${dir}/page.tsx`,
      role: "Page",
      description:
        "Server Component の一覧を Client Component に渡して配置する",
    },
    {
      path: `${dir}/action-trace.ts`,
      role: "Visualizer データ",
      description: "Server Action の結果をフローに変換する",
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
        path: `${dir}/name-form.tsx`,
        role: "Client Component",
        description: "フォームの送信状態と結果メッセージを扱う",
      },
      {
        path: `${dir}/actions.ts`,
        role: "Server Action",
        description: "フォームから POST で呼び出される関数",
      },
      {
        path: `${dir}/action-state.ts`,
        role: "型と初期値",
        description: "Server Action とフォームで共有する state の型",
        runtime: "client",
        runtimeReason:
          '初期値が "use client" の name-form.tsx から import されるため Client（型は Server でも使用）',
      },
      {
        path: `${dir}/action-trace.ts`,
        role: "Visualizer データ",
        description: "Server Action の中で呼ばれ、処理の記録を組み立てる",
      },
      {
        path: `${dir}/guestbook-list.tsx`,
        role: "use cache",
        description: "キャッシュされる Server Component",
      },
      {
        path: `${dir}/guestbook-store.ts`,
        role: "Data Source",
        description: "server-only で保護されたメモリ上のストア",
      },
      {
        path: "src/lib/measure.ts",
        role: "計測",
        description: "データ更新にかかった時間をサーバーで計測する",
      },
      {
        path: "src/components/visualizer/process-visualizer.tsx",
        role: "Client Component",
        description: "Server Action の戻り値に含まれる記録を再生する",
      },
    ],
    features: [
      {
        name: '"use server"',
        description:
          "actions.ts のすべての export を Server Action として定義しています。",
      },
      {
        name: "useActionState",
        description:
          "Server Action の戻り値（メッセージと処理の記録）と、送信中の状態を受け取ります。",
      },
      {
        name: '"use cache" + cacheTag',
        description:
          '名前の一覧をキャッシュし、"guestbook" タグで更新対象を指定できるようにしています。',
      },
      {
        name: "updateTag",
        description:
          "保存後にタグ付きキャッシュを期限切れにし、更新後の一覧を同じ応答で返します。",
      },
      {
        name: "server-only",
        description:
          "ストアのモジュールが Client Component から import されないことをビルド時に保証します。",
      },
    ],
  },
  related: ["server-components", "client-components", "authentication-basics"],
}
