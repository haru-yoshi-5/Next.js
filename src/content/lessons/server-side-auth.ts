import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/server-side-auth"
const lib = "src/lib/auth-demo"

export const serverSideAuthLesson: LessonContent = {
  slug: "server-side-auth",
  title: "サーバー側での認証",
  lead: "Next.js のアプリには、ページ（Server Component）・Server Action・Route Handler という複数の入口があります。管理者だけが見られるレポートを3つの入口から読み、同じ確認を通したうえで、入口ごとに拒否の伝え方が変わる様子を確かめます。",
  keyPoints: [
    "Server Component・Server Action・Route Handler のそれぞれで、認証と認可を確かめる理由",
    "確認をデータを読む関数にまとめ、どの入口からも同じ確認を通す書き方",
    "代わりの表示・戻り値・401 / 403 という、入口ごとの拒否の伝え方",
  ],
  sections: [
    {
      id: "entry-points",
      title: "入口は1つではない",
      blocks: [
        {
          type: "paragraph",
          text: "画面から操作すると、処理はページの描画・Server Action・Route Handler のどれかとしてサーバーで実行されます。この3つは、どれも画面を通らずに直接呼び出せます。ページは URL を開けば描画され、Server Action と Route Handler はリクエストを組み立てれば実行できます。",
        },
        {
          type: "paragraph",
          text: "そのため、ある入口で確かめていても、別の入口が確かめていなければデータは守れません。デモの「確認を忘れた Route Handler」は、教材の画面ではレポートを隠していても、URL を直接呼べば誰にでも売上の数字を返してしまう例です。",
        },
        {
          type: "callout",
          tone: "caution",
          title: "Proxy だけに任せない",
          text: "`proxy.ts`（旧 Middleware）でも cookie を読んでリダイレクトできますが、Next.js のドキュメントでは、これは素早く振り分けるための確認と位置づけています。守りの中心は、データの近くで行う確認です。ページ全体を守る方法は、次の「保護されたページ」で扱います。",
        },
      ],
    },
    {
      id: "close-to-data",
      title: "確認はデータを読む関数にまとめる",
      blocks: [
        {
          type: "paragraph",
          text: "デモでは、売上を読む `report.ts` の `readSalesReport()` の中で、認証（`getAuthState()`）と認可（`can()`）を確かめてから、データソースを読みます。3つの入口はどれもこの関数を呼ぶだけなので、入口を増やしても確認を書き忘れにくくなります。",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "認証: cookie のセッションを検証して「誰か」を確かめる。分からなければ未ログインとして止める",
            "認可: 確かめた相手に「売上レポートを見る」権限があるかを判定する。なければ止める",
            "両方を通った場合だけ、データソースを読み、画面に必要な形（DTO）にして返す",
          ],
        },
        {
          type: "paragraph",
          text: "データソースを直接読む `sales-data.ts` の `loadSalesFigures()` は、確認をしません。確認を忘れた Route Handler は、`readSalesReport()` を通らずにこの関数を呼んでいることが原因です。実際のアプリでは、データソースを読む関数を確認済みの関数からだけ使えるように、置き場所や export を絞ります。",
        },
      ],
    },
    {
      id: "how-to-deny",
      title: "入口ごとの拒否の伝え方",
      blocks: [
        {
          type: "paragraph",
          text: "確認の中身は同じでも、結果の伝え方は入口ごとに違います。`readSalesReport()` は拒否の理由（未ログイン・権限なし）を返すだけにして、伝え方は呼び出した側が決めます。",
        },
        {
          type: "list",
          items: [
            "Server Component: ステータスコードを返す仕組みがないため、拒否したら代わりの表示を描画する。数字は描画結果（HTML / RSC Payload）に入らない。ページ全体を見せない場合は `redirect()` でログインページへ移動させる",
            "Server Action: 呼び出し元の画面に戻り値を返す。拒否した場合は、データを含めない戻り値で理由だけを伝える",
            "Route Handler: HTTP のステータスで伝える。認証の失敗は 401、認可の失敗は 403。利用者ごとに内容が変わるため、`Cache-Control: private, no-store` で途中に保存させない",
          ],
        },
        {
          type: "callout",
          tone: "note",
          title: "forbidden() と unauthorized()",
          text: "Next.js には、Server Component の中で 403 / 401 のページを表示する `forbidden()` と `unauthorized()` もあります。ただし Next.js 16 では実験的な機能（`authInterrupts`）で、このサイトでは使っていません。",
        },
      ],
    },
    {
      id: "same-check",
      title: "どの入口でも同じ基準で判定する",
      blocks: [
        {
          type: "paragraph",
          text: "確認の場所が1つなので、同じ認証状態・同じ権限であれば、3つの入口は同じ基準で判定します。デモでは、未ログインならどれも拒否し、一般ユーザーなら権限がないとして拒否し、管理者ならどれもレポートを返します。",
        },
        {
          type: "paragraph",
          text: "ただし、各入口は呼び出された時点でセッションを確かめます。たとえば管理者でページを表示したあとにセッションの期限（15分）が切れると、表示済みのレポートは残ったまま、後から押した Server Action や Route Handler は未ログインとして拒否されます。そろうのは判定の基準で、結果はそれぞれの呼び出し時点の状態で決まります。",
        },
        {
          type: "comparison",
          columns: [
            {
              runtime: "server",
              title: "確認を通る入口",
              items: [
                "ページの描画・Server Action・api/report",
                "どれも readSalesReport() を呼ぶ",
                "ユーザーによって、結果が「レポート」と「拒否」に分かれる",
              ],
            },
            {
              runtime: "server",
              title: "確認を忘れた入口",
              items: [
                "api/unguarded",
                "データソースを直接読む",
                "未ログインでも 200 OK で数字を返してしまう",
              ],
            },
          ],
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
            "画面のボタンを隠すのは見た目の工夫で、守りにはならない。守るための確認は、必ずサーバーで呼ばれる関数の中で行う",
            "セッションを読む処理は `use cache` の中に入れない。利用者ごとに結果が変わるため、共有のキャッシュに混ぜない",
            "Server Component で cookie を読む部分は、Cache Components を有効にしたこのサイトでは `<Suspense>` の中に置く。教材の本文は静的なまま配信される",
            "デモのログインは本人確認を省いている。ログインの状態は、Authentication の章の教材どうしで共有される",
          ],
        },
      ],
    },
  ],
  demo: {
    description:
      "デモのユーザーを切り替えながら、管理者だけが見られる売上レポートを3つの入口から読みます。比較として、確認を忘れた Route Handler も呼びます。",
    steps: [
      "ログアウトした状態で、3つの入口の結果を確かめる（Server Component は代わりの表示、Server Action は拒否の戻り値、Route Handler は 401）",
      "「確認を忘れた Route Handler」を GET で呼び、未ログインでも売上の数字が返ることを確かめる",
      "田中（一般ユーザー）でログインし、どの入口でも権限がないとして拒否されることを確かめる（Route Handler は 403）",
      "佐藤（管理者）でログインし、どの入口でもレポートが返ることを確かめる",
      "各入口の「処理の流れを見る」で、同じ readSalesReport() が認証と認可を行っていることを確かめる",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/report.ts`,
      role: "DAL",
      description: "認証と認可を確かめてから、売上を読む",
    },
    {
      path: `${dir}/report-demo.tsx`,
      role: "Server Component",
      description: "入口1: 拒否したら代わりの表示を描画する",
    },
    {
      path: `${dir}/actions.ts`,
      role: "Server Action",
      description: "入口2: 拒否したらデータを含めない戻り値を返す",
    },
    {
      path: `${dir}/api/report/route.ts`,
      role: "Route Handler",
      description: "入口3: 拒否したら 401 / 403 を返す",
    },
    {
      path: `${dir}/api/unguarded/route.ts`,
      role: "Route Handler（悪い例）",
      description: "確認をせずにデータソースを読んでしまう",
    },
    {
      path: `${dir}/sales-data.ts`,
      role: "データソース",
      description: "確認をしない。readSalesReport() から読む",
    },
    {
      path: `${lib}/dal.ts`,
      role: "DAL",
      description: "セッションを検証し、ユーザー情報だけを返す",
    },
  ],
  inside: {
    files: [
      {
        path: `${dir}/page.tsx`,
        role: "Page",
        description: "/learn/server-side-auth（本文は静的に配信）",
      },
      {
        path: `${dir}/report-demo.tsx`,
        role: "Server Component",
        description: "<Suspense> の中で、リクエストのたびにレポートを読む",
      },
      {
        path: `${dir}/entry-panel.tsx`,
        role: "Client Component",
        description: "ユーザーの切り替えと、入口を呼ぶボタン。判定はしない",
      },
      {
        path: `${dir}/report-table.tsx`,
        role: "表",
        description: "売上レポートの表",
        runtime: "client",
        runtimeReason:
          '"use client" の entry-panel.tsx からも import されるため Client（report-demo.tsx の描画ではサーバーで実行）',
      },
      {
        path: `${dir}/actions.ts`,
        role: "Server Action",
        description: "ユーザーの切り替えと、レポートを読む操作",
      },
      {
        path: `${dir}/action-state.ts`,
        role: "型と初期値",
        description: "Server Action とパネルで共有する state の型",
        runtime: "client",
        runtimeReason:
          '初期値が "use client" の entry-panel.tsx から import されるため Client（型は Server でも使用）',
      },
      {
        path: `${dir}/report.ts`,
        role: "DAL",
        description: "server-only。認証・認可の確認とデータの読み取り",
      },
      {
        path: `${dir}/sales-data.ts`,
        role: "データソース",
        description: "server-only。データベースを使わない固定のデータ",
      },
      {
        path: `${dir}/api/report/route.ts`,
        role: "Route Handler",
        description:
          "/learn/server-side-auth/api/report（cookie を読むため毎回実行）",
      },
      {
        path: `${dir}/api/unguarded/route.ts`,
        role: "Route Handler",
        description: "/learn/server-side-auth/api/unguarded（悪い例）",
      },
      {
        path: `${dir}/api/server-timing.ts`,
        role: "ユーティリティ",
        description: "計測した時間を Server-Timing ヘッダーにする",
      },
      {
        path: `${dir}/call-route.ts`,
        role: "fetch",
        description: "Route Handler を呼び、ステータスと本文を記録する",
        runtime: "client",
        runtimeReason:
          '"use client" の entry-panel.tsx から import されるため Client',
      },
      {
        path: `${dir}/trace.ts`,
        role: "Visualizer データ",
        description: "Server Component / Server Action の中の確認を記録にする",
      },
      {
        path: `${dir}/route-trace.ts`,
        role: "Visualizer データ",
        description: "Route Handler の応答から記録を組み立てる",
        runtime: "client",
        runtimeReason:
          '"use client" の entry-panel.tsx から import されるため Client',
      },
      {
        path: `${lib}/dal.ts`,
        role: "DAL",
        description: "server-only。セッションの検証をまとめる",
      },
      {
        path: `${lib}/users.ts`,
        role: "ユーザーと権限",
        description: "server-only。ロールごとに許可する操作",
      },
    ],
    features: [
      {
        name: "Data Access Layer",
        description:
          "認証と認可の確認を、データを読む関数の中にまとめています。",
      },
      {
        name: "Route Handlers",
        description:
          "認証の失敗を 401、認可の失敗を 403 で返し、Server-Timing で計測値を渡しています。",
      },
      {
        name: "Server Actions / useActionState",
        description: "拒否した場合も、理由だけを戻り値で画面に返しています。",
      },
      {
        name: "Cache Components / Suspense",
        description:
          "cookie を読む部分だけを <Suspense> の中に置き、本文を静的に配信しています。",
      },
      {
        name: "server-only",
        description:
          "確認とデータソースのファイルを、Client Component から import できないようにしています。",
      },
    ],
  },
  related: ["authentication-basics", "route-handlers", "server-actions"],
}
