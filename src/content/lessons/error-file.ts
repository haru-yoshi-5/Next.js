import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/error-file"

const clientReason =
  '"use client" の error-demo-panel.tsx から import されるため Client'

export const errorFileLesson: LessonContent = {
  slug: "error-file",
  title: "error.tsx",
  lead: "フォルダに `error.tsx` を置くと、そのフォルダの page が React のエラー境界で包まれます。描画中にエラーが起きても画面全体は壊れず、page の部分だけが `error.tsx` の表示に差し替わり、そこから再試行できます。",
  keyPoints: [
    "`error.tsx` が包む範囲と、Client Component でなければならない理由",
    "本番では元の `error.message` が伏せられ、一般的な message と `digest` が届く仕組み",
    "`retry()` と `reset()` の違いと、使い分け",
  ],
  sections: [
    {
      id: "boundary",
      title: "error.tsx はエラー境界になる",
      blocks: [
        {
          type: "paragraph",
          text: '`error.tsx` は、同じフォルダの page と、その下のフォルダを React のエラー境界で包みます。境界の内側で予期しないエラーが throw されると、壊れた部分の代わりに `error.tsx` が表示されます。エラー境界はブラウザでエラーを受け止めて表示を切り替えるため、`error.tsx` には `"use client"` が必要です。',
        },
        {
          type: "list",
          items: [
            "包むもの: 同じフォルダの `page.tsx`・`loading.tsx`・`not-found.tsx` と、その下のフォルダの layout と page",
            "包まないもの: 同じフォルダの `layout.tsx`・`template.tsx`",
            "root layout のエラーは `global-error.tsx` で受け止める",
          ],
        },
        {
          type: "paragraph",
          text: "この教材は本体を `layout.tsx` に置いています。デモの page がエラーになっても解説や Live Demo の枠が残るのは、同じフォルダの `error.tsx` が layout を包まないからです。",
        },
      ],
    },
    {
      id: "digest",
      title: "本番では message が伏せられる",
      blocks: [
        {
          type: "paragraph",
          text: "Server Component で起きたエラーのメッセージには、内部のホスト名や SQL など、外に見せたくない情報が含まれることがあります。そのため本番では、ブラウザに届く `error.message` は一般的な文に置き換えられ、元のメッセージはサーバーのログにだけ残ります。このデモを `next start` で動かすと、届く message は「Minified React error #441」でした。これは「Server Components の描画でエラーが起き、詳細は伏せた」ことを表す React のエラーです。",
        },
        {
          type: "paragraph",
          text: "代わりに届く `error.digest` は、エラーから作られる識別子です。サーバーのログにも同じ digest が元のメッセージと一緒に出力されるため、利用者にエラーIDとして見せたり、エラー監視に送ったりすると照合できます。このデモでも、ブラウザに届いた digest と同じ値が、内部のホスト名を含むメッセージと一緒にサーバーのログに残っていました。開発中（`next dev`）は調べやすいように、元のメッセージがそのまま届きます。",
        },
      ],
    },
    {
      id: "retry-reset",
      title: "retry() と reset() の違い",
      blocks: [
        {
          type: "comparison",
          columns: [
            {
              runtime: "client",
              title: "retry()",
              items: [
                "エラー境界の中身をサーバーから取り直して、描画し直す",
                "一時的な障害なら、これで回復できる",
                "多くの場合はこちらを使う（Next.js 16.3 で正式な API）",
              ],
            },
            {
              runtime: "client",
              title: "reset()",
              items: [
                "取り直さずに、エラーの状態だけを消して描画し直す",
                "受け取り済みの内容がエラーなら、同じエラーがまた表示される",
                "ブラウザ側の一時的な状態が原因のときなど、特別な場合に使う",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "expected",
      title: "予期できるエラーは throw しない",
      blocks: [
        {
          type: "paragraph",
          text: "`error.tsx` は、バグや障害のような予期しないエラーのためのものです。フォームの入力ミスや、データが見つからない場合のように予期できるエラーは、throw せずに戻り値として扱い、画面に理由を表示します。データが見つからない場合は `notFound()` を使います。",
        },
      ],
    },
  ],
  demo: {
    description:
      "「障害を起こす」を押すと、Server Action が5秒間の障害を設定し、在庫レポートの page が描画中に throw します。error.tsx が受け取った message と digest、押したボタンと回復までの出来事を記録します。",
    steps: [
      "「5秒間の障害を起こす」を押し、枠の中だけが error.tsx に切り替わることを確認する",
      "error.message が伏せられ、digest が届いていることを確認する",
      "障害中に retry() を押し、まだ回復しないことを確認する",
      "障害が終わった後に reset() を押し、取り直さないため回復しないことを確認する",
      "最後に retry() を押し、page の表示に戻ることを確認する",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/error.tsx`,
      role: "error",
      description: "page のエラーを受け止め、retry() / reset() を提供する",
    },
    {
      path: `${dir}/inventory-report.tsx`,
      role: "Server Component",
      description: "障害中は描画中に throw する",
    },
    {
      path: `${dir}/page.tsx`,
      role: "Page",
      description: "レポートを <Suspense> で囲んで表示する",
    },
    {
      path: `${dir}/actions.ts`,
      role: "Server Action",
      description: "cookie に障害の終了時刻を保存する",
    },
    {
      path: `${dir}/error-demo-panel.tsx`,
      role: "Client Component",
      description: "障害のボタンと出来事の記録",
    },
  ],
  inside: {
    files: [
      {
        path: `${dir}/layout.tsx`,
        role: "Layout",
        description: "教材本体。error.tsx に包まれないため、エラー時も残る",
      },
      {
        path: `${dir}/error-demo-panel.tsx`,
        role: "Client Component",
        description: "出来事を受け取る Context を children に提供する",
      },
      {
        path: `${dir}/error.tsx`,
        role: "error",
        description: "page.tsx を React のエラー境界で包む",
      },
      {
        path: `${dir}/page.tsx`,
        role: "Page",
        description: "/learn/error-file",
      },
      {
        path: `${dir}/inventory-report.tsx`,
        role: "Server Component",
        description: "cookie を読み、障害中は throw する",
      },
      {
        path: `${dir}/recovered-reporter.tsx`,
        role: "Client Component",
        description: "描画に成功したことを記録に伝える",
      },
      {
        path: `${dir}/actions.ts`,
        role: "Server Action",
        description: "障害を起こす",
      },
      {
        path: `${dir}/demo-view.tsx`,
        role: "共通の枠",
        description: "表示しているファイル名を示す",
        runtime: "server",
        runtimeReason:
          "page.tsx から使われるが、error.tsx からも import されるため Client バンドルにも含まれる",
      },
      {
        path: `${dir}/demo-events.ts`,
        role: "Context",
        description: "error.tsx と page から layout のパネルへ出来事を伝える",
      },
      {
        path: `${dir}/demo-config.ts`,
        role: "設定",
        description: "cookie の名前と障害の長さ",
        runtime: "server",
        runtimeReason:
          "Server Action から使われるが、error-demo-panel.tsx からも import されるため Client バンドルにも含まれる",
      },
      {
        path: `${dir}/trace.ts`,
        role: "Visualizer データ",
        description: "出来事の記録をフローに変換する",
        runtime: "client",
        runtimeReason: clientReason,
      },
    ],
    features: [
      {
        name: "error.tsx",
        description:
          "page.tsx をエラー境界で包み、エラー時の表示と retry() / reset() を担当しています。",
      },
      {
        name: "Nested Layouts",
        description:
          "教材本体を layout.tsx に置き、エラーの影響を受けないようにしています。",
      },
      {
        name: "Server Actions / cookies()",
        description:
          "閲覧者ごとの障害の終了時刻を cookie に保存し、page の描画で読み取っています。",
      },
      {
        name: "<Suspense>",
        description:
          "cookie を読む部分を囲み、教材本体をビルド時の静的な部分に残しています。",
      },
      {
        name: "Context",
        description:
          "layout のパネルが Context を提供し、error.tsx と page から出来事を受け取っています。",
      },
    ],
  },
  related: ["not-found-file", "loading-file", "server-actions"],
}
