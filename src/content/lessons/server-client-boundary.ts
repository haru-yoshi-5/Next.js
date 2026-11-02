import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/server-client-boundary"

export const serverClientBoundaryLesson: LessonContent = {
  slug: "server-client-boundary",
  title: "Server / Client Boundary",
  lead: '`"use client"` は、サーバーとブラウザの間に境界を引きます。境界を越える方法は2つだけで、コードは import で、データは props で越えます。',
  keyPoints: [
    "コードが境界を越える条件と、データが境界を越える条件",
    "props で渡せる値と渡せない値",
    "Client Component の中に Server Component の出力を置く方法",
    "サーバーの秘密を境界の外に出さない考え方",
  ],
  sections: [
    {
      id: "two-rules",
      title: "境界を越える方法は2つ",
      blocks: [
        {
          type: "comparison",
          columns: [
            {
              runtime: "client",
              title: "コードは import で越える",
              items: [
                '`"use client"` のファイルが import したコードは、クライアント用の JavaScript に入る',
                "境界の内側の子コンポーネントに、毎回書く必要はない",
                "Client Component のコードはサーバーとブラウザの両方で実行される",
              ],
            },
            {
              runtime: "server",
              title: "データは props で越える",
              items: [
                "サーバーで実行した結果と props が、RSC Payload に入って届く",
                "props はシリアライズできる値に限られる",
                "Server Component のコード自体はブラウザに届かない",
              ],
            },
          ],
        },
        {
          type: "paragraph",
          text: "Client Component の名前は「ブラウザでも実行される」という意味です。Client Component も初回表示の HTML を作るためにサーバーで実行されます。一方、Server Component がブラウザで実行されることはありません。",
        },
      ],
    },
    {
      id: "props",
      title: "props で渡せる値",
      blocks: [
        {
          type: "paragraph",
          text: "props はシリアライズされて送られます。文字列や数値のほか、`Date`、`Map`、`Set` も型を保ったまま届きます。デモの表は、ブラウザが実際に受け取った値の型を表示しています。",
        },
        {
          type: "callout",
          tone: "caution",
          title: "関数はそのまま渡せない",
          text: '`onClick` のような関数を Server Component から Client Component へ渡すとエラーになります。例外は `"use server"` を付けた Server Function で、関数そのものではなく参照として渡されます。',
        },
      ],
    },
    {
      id: "children",
      title: "Client Component の中にサーバーの出力を置く",
      blocks: [
        {
          type: "paragraph",
          text: "描画済みの React 要素はシリアライズできるので、`children` として Client Component に渡せます。Client Component は受け取った出力を置くだけで、Server Component のコードは import しません。",
        },
        {
          type: "list",
          items: [
            "親（`page.tsx` など）が Server Component で、両方のコンポーネントを JSX に書く",
            "Server Component はサーバーで実行され、その出力が `children` になる",
            "Client Component は表示する場所だけを決める",
          ],
        },
        {
          type: "paragraph",
          text: "この形にすると、Client Component の state が変わっても Server Component は再実行されません。逆にサーバーを再実行しても、Client Component の state は保たれます。",
        },
      ],
    },
    {
      id: "secrets",
      title: "何を渡すかはサーバー側で決める",
      blocks: [
        {
          type: "paragraph",
          text: "Server Component はデータベースや秘密の値を直接読めますが、props に入れた値はブラウザに届きます。Client Component で使わなくても、渡した時点で応答の中に含まれます。オブジェクトをそのまま渡さず、必要な値だけを選んで渡します。",
        },
        {
          type: "paragraph",
          text: '`"server-only"` を import したファイルは、Client Component から import するとビルドエラーになります。誤ってサーバーのコードを境界の外へ出さないための仕組みです。ただし、防げるのはコードの import で、props で渡す値までは検査しません。',
        },
        {
          type: "callout",
          tone: "note",
          title: "デモの検査で確かめていること",
          text: "検査ボタンは、このページの応答と読み込んだ JavaScript を取得し直して検索します。デモの内部メモは本物の秘密ではなく、リクエストごとに作るランダムな値です。",
        },
      ],
    },
  ],
  demo: {
    description:
      "外枠は Client Component で、その中に Server Component の出力が入っています。state の更新、サーバーの再実行、境界を越えた内容の検査を実際に行います。",
    steps: [
      "+1 と「children を隠す」を押し、生成IDが変わらないことを確認する",
      "「サーバーを再実行」を押し、カウントが残ったまま生成IDだけが変わることを確認する",
      "表で、`Date` / `Map` / `Set` が型を保って届いていることを確認する",
      "「検査する」を押し、渡した値と渡していない値、Client と Server の目印の件数を比べる",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/boundary-demo.tsx`,
      role: "Server Component",
      description:
        "渡す値を選び、Client Component と Server Component を組み合わせる",
    },
    {
      path: `${dir}/boundary-panel.tsx`,
      role: "Client Component",
      description: "children の出力を置き、state と操作を扱う",
    },
    {
      path: `${dir}/boundary-data.ts`,
      role: "サーバー専用",
      description: "server-only で保護された読み取り関数と目印",
    },
    {
      path: `${dir}/inspect-boundary.ts`,
      role: "ブラウザの処理",
      description: "応答と JavaScript ファイルを取得して検索する",
      runtime: "client",
      runtimeReason:
        '"use client" の boundary-panel.tsx から import されるため Client',
    },
    {
      path: `${dir}/trace.ts`,
      role: "Visualizer データ",
      description: "操作の結果とモデル図をフローとして定義する",
      runtime: "client",
      runtimeReason:
        '"use client" の boundary-panel.tsx から import されるため Client',
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
        path: `${dir}/boundary-demo.tsx`,
        role: "Server Component",
        description: "リクエストごとに実行され、境界へ渡す値を決める",
      },
      {
        path: `${dir}/boundary-data.ts`,
        role: "サーバー専用",
        description: "server-only で Client からの import を防ぐ",
      },
      {
        path: `${dir}/boundary-panel.tsx`,
        role: "Client Component",
        description: "props と children を受け取って操作を扱う",
      },
      {
        path: `${dir}/inspect-boundary.ts`,
        role: "ブラウザの処理",
        description: "ブラウザに届いた内容を検索する",
        runtime: "client",
        runtimeReason:
          '"use client" の boundary-panel.tsx から import されるため Client',
      },
      {
        path: `${dir}/trace.ts`,
        role: "Visualizer データ",
        description: "操作の結果から処理の記録を組み立てる",
        runtime: "client",
        runtimeReason:
          '"use client" の boundary-panel.tsx から import されるため Client',
      },
      {
        path: "src/components/visualizer/process-visualizer.tsx",
        role: "Client Component",
        description: "操作の記録とモデル図を再生する",
      },
    ],
    features: [
      {
        name: '"use client"',
        description:
          "boundary-panel.tsx に書き、ここから先をクライアント用のモジュールにしています。",
      },
      {
        name: "children",
        description:
          "Server Component の出力を、import せずに Client Component の中へ置いています。",
      },
      {
        name: "server-only",
        description:
          "boundary-data.ts が Client Component から import されないことをビルド時に保証します。",
      },
      {
        name: "io() + <Suspense>",
        description:
          "デモだけをリクエスト時に実行し、解説部分は静的シェルとして配信します。",
      },
    ],
  },
  related: ["server-components", "client-components", "server-actions"],
}
