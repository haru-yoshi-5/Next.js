import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/authentication-basics"
const lib = "src/lib/auth-demo"

export const authenticationBasicsLesson: LessonContent = {
  slug: "authentication-basics",
  title: "Authenticationの考え方",
  lead: "「誰か」を確かめる認証と、「その人に許可されているか」を確かめる認可は、別の確認です。どちらもブラウザではなくサーバーで行う理由を、デモのログインと Server Action で確かめます。",
  keyPoints: [
    "認証（誰か）と認可（何をしてよいか）の違い",
    "画面の表示を変えても守れない理由と、サーバーで確かめる場所",
    "署名付きの cookie で「誰か」を覚えておくセッションの仕組みと、その限界",
  ],
  sections: [
    {
      id: "authn-authz",
      title: "認証と認可は別の確認",
      blocks: [
        {
          type: "paragraph",
          text: "認証（Authentication）は、リクエストを送ってきたのが誰かを確かめることです。認可（Authorization）は、確かめた相手にその操作が許可されているかを判定することです。認可は認証の結果を使うため、必ず認証の後に行います。",
        },
        {
          type: "comparison",
          columns: [
            {
              runtime: "server",
              title: "認証: 誰か",
              items: [
                "cookie のセッションを検証して、ユーザーを特定する",
                "分からなければ「未ログイン」として扱う",
                "デモでは「プロフィールを見る」を未ログインで押すと拒否される",
              ],
            },
            {
              runtime: "server",
              title: "認可: 何をしてよいか",
              items: [
                "特定したユーザーのロールから、操作が許可されているかを判定する",
                "誰かは分かっていても、権限がなければ拒否する",
                "デモでは一般ユーザーが「お知らせを公開する」を押すと拒否される",
              ],
            },
          ],
        },
        {
          type: "paragraph",
          text: "Route Handler で HTTP のステータスを返す場合は、認証の失敗を 401、認可の失敗を 403 で区別するのが一般的です。デモの認可のルールは `users.ts` の `can()` だけに書き、どの操作からも同じ関数で判定しています。",
        },
      ],
    },
    {
      id: "server-side",
      title: "確認はサーバーで行う",
      blocks: [
        {
          type: "paragraph",
          text: "ブラウザで動くコードや画面の表示は、利用者が自由に変えられます。管理者向けのボタンを隠しても、それは見た目を変えているだけです。デモの「画面の制限を外す」はブラウザ側の表示だけを変えますが、一般ユーザーが押した「お知らせを公開する」はサーバーで拒否されます。",
        },
        {
          type: "paragraph",
          text: "Server Action と Route Handler は、公開された API と同じように扱います。画面にボタンがなくても、リクエストを組み立てれば直接呼び出せるためです。そのためデモの `actions.ts` は、操作のたびに `getAuthState()` でセッションを検証し、`can()` で権限を確かめています。",
        },
        {
          type: "callout",
          tone: "caution",
          title: "layout で隠すだけでは守れない",
          text: "layout で未ログインなら `null` を返しても、その下のページや Server Action はそれぞれ単独で呼び出せます。layout は画面を移動しても描画し直されないこともあります。確認は、データを読む処理や操作の処理の近くで行います。",
        },
      ],
    },
    {
      id: "session",
      title: "セッション: 誰かを覚えておく仕組み",
      blocks: [
        {
          type: "paragraph",
          text: "HTTP のリクエストは1回ずつ独立しているため、ログインした事実をどこかに覚えておく必要があります。デモでは、ログインした時にユーザー ID と有効期限を JWT にし、サーバーだけが知る秘密鍵で署名して cookie に保存します。署名と JWT の扱いには、Next.js のドキュメントでも紹介されている `jose` を使っています。",
        },
        {
          type: "list",
          items: [
            "署名は改ざんを見つけるためのもの: 中身を書き換えると署名が一致しなくなる（デモの「中身を書き換える」）",
            "期限を中に入れる: 署名が正しくても、期限が過ぎていれば無効にする（デモの「期限切れにする」）",
            "署名は暗号化ではない: 中身は誰でも読めるため、ユーザー ID と期限以外は入れない",
            "cookie は `HttpOnly`（JavaScript から読めない）・`SameSite=Lax`・本番では `Secure` にし、保存と削除はサーバーで行う",
            "秘密鍵は環境変数（`AUTH_DEMO_SECRET`）に置き、サーバーだけで読む",
          ],
        },
        {
          type: "callout",
          tone: "note",
          title: "cookie だけのセッションの限界",
          text: "データベースを使わない方式では、発行したトークンを途中で無効にできません。ログアウトで cookie を消しても、コピーされたトークンは期限まで有効です。途中で無効にする必要がある場合は、セッションをデータベースに保存する方式を選びます。デモは期限を15分と短くしています。",
        },
      ],
    },
    {
      id: "dal",
      title: "確認を1か所にまとめる",
      blocks: [
        {
          type: "paragraph",
          text: "セッションの検証は、ページ・Server Action・Route Handler のそれぞれで必要になります。デモでは `dal.ts` の `getAuthState()` にまとめ、どこからでも同じ方法で「誰か」を確かめます。返すのは画面に必要な ID・名前・ロールだけで、セッションの中身そのものは渡しません。",
        },
        {
          type: "paragraph",
          text: "`getAuthState()` は React の `cache` で包んでいるため、1回の描画の中で何度呼んでも検証は1回だけです。cookie を読む処理はリクエストのたびに動くため、Cache Components を有効にしたこのサイトでは `<Suspense>` の中に置きます。教材の本文は静的なまま配信され、デモの部分だけがリクエストのたびに描画されます。",
        },
      ],
    },
    {
      id: "pitfalls",
      title: "注意すること",
      blocks: [
        {
          type: "list",
          items: [
            "デモのログインは本人確認を省いている。実際のアプリでは、パスワードや外部の認証サービスで本人であることを確かめてからセッションを発行する",
            "cookie の保存と削除は、Server Action か Route Handler の中でだけ行える。Server Component の描画中には変更できない",
            "セッションを読む処理は `use cache` の中に入れない。利用者ごとに結果が変わるため、共有のキャッシュに混ぜない",
            "同じブラウザでは、Authentication の章の教材どうしでログインの状態が共有される",
          ],
        },
      ],
    },
  ],
  demo: {
    description:
      "デモのユーザーでログインし、2つの操作を Server Action で実行します。サーバーが cookie を検証した結果と、認証・認可の判定の流れを確かめます。",
    steps: [
      "ログインしないまま「プロフィールを見る」を押し、未ログインとして拒否されることを確認する（認証の失敗）",
      "田中（一般ユーザー）でログインし、「プロフィールを見る」が成功することを確認する",
      "「画面の制限を外す」をオンにして「お知らせを公開する」を押し、権限がないため拒否されることを確認する（認可の失敗）",
      "佐藤（管理者）でログインし、「お知らせを公開する」が成功することを確認する",
      "「中身を書き換える」「期限切れにする」を押し、サーバーが未ログインとして扱うことを確認する",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/actions.ts`,
      role: "Server Action",
      description: "操作のたびに認証と認可を確かめる",
    },
    {
      path: `${lib}/dal.ts`,
      role: "DAL",
      description: "セッションを検証し、画面に必要なユーザー情報だけを返す",
    },
    {
      path: `${lib}/session.ts`,
      role: "セッション",
      description: "jose で署名・検証し、cookie に保存・削除する",
    },
    {
      path: `${lib}/users.ts`,
      role: "ユーザーと権限",
      description: "デモユーザーと、ロールごとに許可する操作",
    },
    {
      path: `${dir}/auth-demo.tsx`,
      role: "Server Component",
      description: "cookie を検証した結果を操作パネルへ渡す",
    },
    {
      path: `${dir}/auth-panel.tsx`,
      role: "Client Component",
      description: "ボタンの表示を切り替える。守るための判定はしない",
    },
  ],
  inside: {
    files: [
      {
        path: `${dir}/page.tsx`,
        role: "Page",
        description: "/learn/authentication-basics（本文は静的に配信）",
      },
      {
        path: `${dir}/auth-demo.tsx`,
        role: "Server Component",
        description: "<Suspense> の中で、リクエストのたびに cookie を検証する",
      },
      {
        path: `${dir}/auth-panel.tsx`,
        role: "Client Component",
        description: "ログインと操作のボタン、結果の表示",
      },
      {
        path: `${dir}/actions.ts`,
        role: "Server Action",
        description: "ログイン・ログアウトと、認証・認可が必要な操作",
      },
      {
        path: `${dir}/action-state.ts`,
        role: "型と初期値",
        description: "Server Action とパネルで共有する state の型",
        runtime: "client",
        runtimeReason:
          '初期値が "use client" の auth-panel.tsx から import されるため Client（型は Server でも使用）',
      },
      {
        path: `${dir}/broken-sessions.ts`,
        role: "デモ用",
        description: "中身を書き換えたセッションと、期限切れのセッションを作る",
      },
      {
        path: `${dir}/trace.ts`,
        role: "Visualizer データ",
        description: "Server Action の中で呼ばれ、処理の記録を組み立てる",
      },
      {
        path: `${lib}/dal.ts`,
        role: "DAL",
        description: "server-only。認証の確認をまとめる",
      },
      {
        path: `${lib}/session.ts`,
        role: "セッション",
        description: "server-only。秘密鍵は環境変数からサーバーでだけ読む",
      },
      {
        path: `${lib}/users.ts`,
        role: "ユーザーと権限",
        description: "server-only。データベースを使わない固定のデータ",
      },
    ],
    features: [
      {
        name: "Server Actions / cookies()",
        description:
          "ログイン・ログアウトで cookie を変更し、更新後の画面を同じ応答で受け取っています。",
      },
      {
        name: "jose",
        description:
          "セッションの JWT に署名し、署名・発行者・期限を検証しています。",
      },
      {
        name: "React cache",
        description: "1回の描画の中で、セッションの検証を1回にまとめています。",
      },
      {
        name: "Cache Components / Suspense",
        description:
          "cookie を読む部分だけを <Suspense> の中に置き、本文を静的に配信しています。",
      },
      {
        name: "server-only",
        description:
          "セッションと DAL を Client Component から import できないようにしています。",
      },
    ],
  },
  related: ["server-actions", "route-handlers", "server-client-boundary"],
}
