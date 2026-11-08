import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/loading-file"

const clientReason =
  '"use client" の loading-demo-panel.tsx から import されるため Client'

export const loadingFileLesson: LessonContent = {
  slug: "loading-file",
  title: "loading.tsx",
  lead: "フォルダに `loading.tsx` を置くと、そのフォルダの `page.tsx` が自動で `<Suspense>` に包まれます。ページの描画を待つ間は `loading.tsx` の内容が表示され、遷移したことがすぐに伝わります。",
  keyPoints: [
    "`loading.tsx` が `<Suspense>` で包む範囲と、包まない範囲",
    "遷移した直後に `loading.tsx` を表示できる理由",
    "`loading.tsx` がないページ、page 内の `<Suspense>` との違い",
  ],
  sections: [
    {
      id: "boundary",
      title: "loading.tsx は page を Suspense で包む",
      blocks: [
        {
          type: "paragraph",
          text: "`loading.tsx` を置くと、同じフォルダの `layout.tsx` の内側に `<Suspense>` が作られ、`loading.tsx` の内容がその fallback になります。`<Suspense>` を自分で書かなくても、ページ全体の待ちの表示を用意できます。",
        },
        {
          type: "list",
          items: [
            "包むもの: 同じフォルダの `page.tsx`・`not-found.tsx` と、その下のフォルダの layout と page",
            "包まないもの: 同じフォルダの `layout.tsx`・`template.tsx`・`error.tsx`",
          ],
        },
        {
          type: "callout",
          tone: "note",
          title: "layout の待ち時間には使えない",
          text: "同じフォルダの layout は `<Suspense>` の外側にあるため、layout がデータを待つ間は `loading.tsx` が表示されません。Cache Components では、layout でリクエスト時のデータを読む部分を、自分で `<Suspense>` に入れる必要があります。",
        },
      ],
    },
    {
      id: "instant",
      title: "遷移した直後に表示できる理由",
      blocks: [
        {
          type: "paragraph",
          text: "`<Link>` が画面に入ると、Next.js は遷移先をプリフェッチします。`loading.tsx` の内容はビルド時に作られた静的な部分なので、このときに一緒に受け取ります。そのため、クリックした時点で page の描画を待たずに `loading.tsx` を表示できます。",
        },
        {
          type: "paragraph",
          text: "プリフェッチが終わる前にクリックすると、`loading.tsx` が表示されるまでに少し時間がかかります。また、このデモで計測したところ、ページを開いて最初の遷移だけ、表の「待ちの表示まで」が2回目以降より長くなることがありました。",
        },
        {
          type: "paragraph",
          text: "待っている間も、共通の layout はそのまま操作できます。別のリンクを押せば、前の遷移の完了を待たずに次の遷移へ移れます。",
        },
      ],
    },
    {
      id: "without",
      title: "loading.tsx がないとき",
      blocks: [
        {
          type: "paragraph",
          text: "遷移先に `loading.tsx` も `<Suspense>` もないと、切り替える先の待ちの表示がありません。そのため、page の描画が終わるまで前の画面が表示されたままになり、クリックが効いたのか分かりにくくなります。",
        },
        {
          type: "paragraph",
          text: "このデモの外側には `learn/loading.tsx` があり、教材ページ全体を包んでいます。URL を直接開いたときは、これが最初の待ちの表示になります。一方、デモのページ間の遷移では表示されません。遷移しても残る layout より外側にあるため、切り替える対象にならないからです。",
        },
      ],
    },
    {
      id: "vs-suspense",
      title: "page 内の Suspense との使い分け",
      blocks: [
        {
          type: "comparison",
          columns: [
            {
              runtime: "server",
              title: "loading.tsx",
              items: [
                "page 全体を1つの待ちの表示に置き換える",
                "ファイルを置くだけで、フォルダ単位で用意できる",
                "page のほとんどがデータに依存する場合に向く",
              ],
            },
            {
              runtime: "server",
              title: "page 内の <Suspense>",
              items: [
                "見出しなど、すぐに出せる部分は先に表示する",
                "遅い部分だけを待ちの表示にできる",
                "境界を複数置き、届いた順に表示できる（Streaming 教材）",
              ],
            },
          ],
        },
      ],
    },
  ],
  demo: {
    description:
      "3つのページは、どれも描画に約1.5秒かかる Server Component を含みます。リンクを押した時刻と、枠の中に待ちの表示・内容が現れた時刻をブラウザで記録しています。",
    steps: [
      "「loading.tsx あり」を押し、すぐに loading.tsx の表示に切り替わることを確認する",
      "「loading.tsx なし」を押し、内容が届くまで前の画面が残ることを確認する",
      "「page 内の <Suspense>」を押し、見出しが先に出て、下の部分だけが後から届くことを確認する",
      "表の「待ちの表示まで」と「内容の表示まで」を比べる",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/with-loading/loading.tsx`,
      role: "loading",
      description: "with-loading/page.tsx を待つ間に表示される",
    },
    {
      path: `${dir}/with-loading/page.tsx`,
      role: "Page",
      description: "loading.tsx に包まれるページ",
    },
    {
      path: `${dir}/without-loading/page.tsx`,
      role: "Page",
      description: "loading.tsx も <Suspense> もないページ",
    },
    {
      path: `${dir}/with-suspense/page.tsx`,
      role: "Page",
      description: "遅い部分だけを <Suspense> で囲むページ",
    },
    {
      path: `${dir}/slow-content.tsx`,
      role: "Server Component",
      description: "描画に約1.5秒かかる部分",
    },
    {
      path: `${dir}/loading-demo-panel.tsx`,
      role: "Client Component",
      description: "リンクと、表示の変化の計測",
    },
  ],
  inside: {
    files: [
      {
        path: `${dir}/layout.tsx`,
        role: "Layout",
        description: "教材本体。Live Demo の中に children を渡している",
      },
      {
        path: `${dir}/loading-demo-panel.tsx`,
        role: "Client Component",
        description: "MutationObserver で枠の中の変化を記録する",
      },
      {
        path: `${dir}/page.tsx`,
        role: "Page",
        description: "/learn/loading-file（デモの入口）",
      },
      {
        path: `${dir}/with-loading/loading.tsx`,
        role: "loading",
        description: "with-loading/page.tsx を Suspense で包む",
      },
      {
        path: `${dir}/with-loading/page.tsx`,
        role: "Page",
        description: "/learn/loading-file/with-loading",
      },
      {
        path: `${dir}/without-loading/page.tsx`,
        role: "Page",
        description: "/learn/loading-file/without-loading",
      },
      {
        path: `${dir}/with-suspense/page.tsx`,
        role: "Page",
        description: "/learn/loading-file/with-suspense",
      },
      {
        path: `${dir}/slow-content.tsx`,
        role: "Server Component",
        description: "io() の後に約1.5秒待ってから描画する",
      },
      {
        path: `${dir}/demo-view.tsx`,
        role: "Server Component",
        description: "表示しているファイル名を示す枠",
      },
      {
        path: `${dir}/demo-pages.ts`,
        role: "データ",
        description: "デモのページの一覧と待ち時間",
        runtime: "server",
        runtimeReason:
          "Server Component から使われるが、loading-demo-panel.tsx からも import されるため Client バンドルにも含まれる",
      },
      {
        path: `${dir}/trace.ts`,
        role: "Visualizer データ",
        description: "計測した遷移をフローに変換する",
        runtime: "client",
        runtimeReason: clientReason,
      },
      {
        path: "src/app/learn/loading.tsx",
        role: "loading",
        description: "教材ページ全体を包む上位の loading.tsx",
      },
    ],
    features: [
      {
        name: "loading.tsx",
        description:
          "with-loading/page.tsx を自動で <Suspense> に包み、待つ間の表示を担当しています。",
      },
      {
        name: "<Suspense>",
        description:
          "with-suspense/page.tsx の中で、遅い部分だけを囲んでいます。",
      },
      {
        name: "<Link> のプリフェッチ",
        description:
          "loading.tsx の表示や page の静的な部分を、クリックする前に受け取っています。",
      },
      {
        name: "Nested Layouts",
        description:
          "教材本体を layout.tsx に置き、遷移しても解説や Live Demo の枠を残しています。",
      },
      {
        name: "io()",
        description:
          "遅い部分をリクエストのたびに描画させ、ビルド時のプリレンダーから外しています。",
      },
    ],
  },
  related: ["streaming", "app-router", "dynamic-routes"],
}
