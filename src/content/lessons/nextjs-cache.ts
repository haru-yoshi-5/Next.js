import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/nextjs-cache"

export const nextjsCacheLesson: LessonContent = {
  slug: "nextjs-cache",
  title: "Next.js Cache",
  lead: '`"use cache"` を付けた関数やコンポーネントは、結果が保存され、同じ入力の呼び出しで再利用されます。時間のかかる処理を毎回実行せずに済みますが、結果が「どこに保存されるか」はデプロイ先によって変わります。',
  keyPoints: [
    "`use cache` が再利用する単位と、キャッシュキーの決まり方",
    "`cacheLife` の stale / revalidate / expire の違い",
    "ビルド時に静的シェルへ入るキャッシュと、実行時のキャッシュの違い",
    "Vercel で `use cache` と `use cache: remote` の結果が分かれる理由",
  ],
  sections: [
    {
      id: "what-is-cache",
      title: "use cache は関数の結果を再利用する",
      blocks: [
        {
          type: "paragraph",
          text: '`"use cache"` を async 関数やコンポーネントの先頭に書くと、最初の呼び出しで本体が実行され、その結果が保存されます。同じ入力で再び呼ばれると、保存が有効な間は本体を実行せずに結果を返します。',
        },
        {
          type: "paragraph",
          text: "このキャッシュキーは、次の値から自動で作られます。",
        },
        {
          type: "list",
          items: [
            "ビルド ID（デプロイするとキャッシュは引き継がれない）",
            "関数の場所とシグネチャから作られる ID",
            "引数、または props（外側から参照した変数も含む）",
          ],
        },
        {
          type: "callout",
          tone: "caution",
          title: "cookies() や headers() は中で読めない",
          text: "キャッシュは利用者をまたいで共有されるため、`use cache` の中では `cookies()` や `headers()` を呼べません。外側で読み取り、必要な値だけを引数で渡します。",
        },
      ],
    },
    {
      id: "cache-life",
      title: "cacheLife で有効期間を決める",
      blocks: [
        {
          type: "paragraph",
          text: '`cacheLife("hours")` のようなプロファイル名か、3つの値を持つオブジェクトで指定します。それぞれ効く場所が異なります。',
        },
        {
          type: "list",
          items: [
            "`stale`: ブラウザがサーバーに確認せず使える時間",
            "`revalidate`: これを過ぎると、古い結果を返しつつ裏側で作り直す",
            "`expire`: これを過ぎてアクセスがないと、次のリクエストは新しい結果を待つ",
          ],
        },
        {
          type: "paragraph",
          text: "デモの `getCachedReport` は `revalidate: 60` / `expire: 120` にしています。作り直しは時間の経過だけでは始まらず、60秒を過ぎた後のリクエストがきっかけになります。公式ドキュメントでは古い結果を返しながら裏側で作り直すと説明されていますが、実際に測定すると、ローカルの `next start` ではそのリクエストが約400ms待って新しい結果を受け取りました。Vercel では説明どおり、そのリクエストは古い結果をすぐに受け取り、数秒後のリクエストで新しい結果に変わりました。",
        },
      ],
    },
    {
      id: "build-and-runtime",
      title: "ビルド時のキャッシュと実行時のキャッシュ",
      blocks: [
        {
          type: "paragraph",
          text: "Cache Components では、ビルド時に実行できる部分が静的シェルとしてプリレンダーされ、`use cache` の結果もそこに含まれます。リクエストごとの処理は `<Suspense>` で囲み、静的シェルの後から届けます。",
        },
        {
          type: "comparison",
          columns: [
            {
              runtime: "server",
              title: "静的シェルに入るキャッシュ",
              items: [
                "ビルド時に実行され、結果が HTML に含まれる",
                "ホスティング環境を問わず再利用される",
                "NextScope の解説部分はこの形で配信している",
              ],
            },
            {
              runtime: "server",
              title: "実行時のキャッシュ",
              items: [
                "リクエストの中で呼ばれたときに保存・再利用する",
                "保存先の種類によって再利用できる範囲が変わる",
                "このページの Live Demo はこちら",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "where-is-cache",
      title: "実行時のキャッシュはどこに保存されるか",
      blocks: [
        {
          type: "paragraph",
          text: "`use cache` の実行時の保存先は、既定ではサーバーのメモリです。常駐する Node.js サーバーならリクエストをまたいで再利用できますが、サーバーレス環境ではインスタンスごとにメモリが分かれ、短時間で破棄されます。",
        },
        {
          type: "paragraph",
          text: '`"use cache: remote"` は、結果を `remote` 用のキャッシュハンドラーへ保存します。ホスティング先が共有の保存先を用意していれば、すべてのインスタンスで結果を共有できます。その代わりネットワーク越しの確認が必要になり、料金が発生する場合があります。',
        },
        {
          type: "callout",
          tone: "caution",
          title: "セルフホストでは保存先の設定が必要",
          text: "`cacheHandlers` を設定しないと、`remote` もメモリ上のキャッシュになり、インスタンスをまたいで共有されません。NextScope はこの設定を持たないので、Vercel 以外で複数台動かすと全員での共有にはなりません。",
        },
        {
          type: "callout",
          tone: "note",
          title: "Vercel で実測した結果",
          text: "検証用アプリで順次アクセスを25回行ったところ、`use cache` は25回すべて本体を実行しました。`use cache: remote` は本体の実行が1回だけで、3つのインスタンスで同じ結果を共有しました。ローカルの `next start` で再利用されていても、デプロイ先で同じ動きになるとは限りません。",
        },
      ],
    },
    {
      id: "react-cache",
      title: "React の cache() とは別のもの",
      blocks: [
        {
          type: "paragraph",
          text: "React の `cache()` は、1回のレンダリングの中で同じ呼び出しをまとめる仕組みで、リクエストをまたいで残りません。`use cache` はリクエストや利用者をまたいで結果を再利用します。また、`use cache` の内側から外側の `cache()` の値は見えないので、値は引数で渡します。",
        },
      ],
    },
  ],
  demo: {
    description:
      "同じ処理をキャッシュなしと `use cache: remote` で実行し、結果を並べています。判定には速さではなく、生成時刻が読み取りの開始より前かどうかを使っています。分かるのは受け取った結果がいつ作られたかまでで、裏側の再生成が動いているかは判定できません。",
    steps: [
      "2つの生成IDと読み取り時間を確認する",
      "「もう一度リクエスト」を押し、右側の生成IDだけが変わらないことを確認する",
      "1分以上待って押し、右側の生成IDが変わることを確認する（変わらないときは、数秒待ってもう一度押す）",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/report-data.ts`,
      role: "use cache: remote",
      description: "キャッシュあり / なしの読み取りと、再利用の判定",
    },
    {
      path: `${dir}/cache-demo.tsx`,
      role: "Server Component",
      description: "2つの読み取りを同じリクエストで実行して表示する",
    },
    {
      path: `${dir}/cache-panel.tsx`,
      role: "Client Component",
      description: "再リクエストのボタンと Process Visualizer を配置する",
    },
    {
      path: `${dir}/trace.ts`,
      role: "Visualizer データ",
      description: "読み取りの結果をフローに変換する",
    },
    {
      path: `${dir}/page.tsx`,
      role: "Page",
      description: "デモを Suspense で囲んで配置する",
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
        path: `${dir}/cache-demo.tsx`,
        role: "Server Component",
        description: "リクエストごとに実行され、読み取りの結果を描画する",
      },
      {
        path: `${dir}/report-data.ts`,
        role: "use cache: remote",
        description: "server-only で保護された読み取り関数",
      },
      {
        path: `${dir}/trace.ts`,
        role: "Visualizer データ",
        description: "Server Component の中で処理の記録を組み立てる",
      },
      {
        path: `${dir}/cache-panel.tsx`,
        role: "Client Component",
        description: "router.refresh() でサーバーへ再リクエストする",
      },
      {
        path: "src/lib/measure.ts",
        role: "計測",
        description: "読み取りにかかった時間をサーバーで計測する",
      },
      {
        path: "src/components/visualizer/process-visualizer.tsx",
        role: "Client Component",
        description: "サーバーで組み立てた記録を再生する",
      },
    ],
    features: [
      {
        name: '"use cache: remote"',
        description:
          "getCachedReport の結果を remote 用のキャッシュハンドラーへ保存します。Vercel では全インスタンスで共有されました。",
      },
      {
        name: "cacheLife",
        description:
          "60秒を過ぎたリクエストで再生成が始まる短い有効期間を指定し、変化を確認できるようにしています。",
      },
      {
        name: "io() + <Suspense>",
        description:
          "デモだけをリクエスト時に実行し、解説部分は静的シェルとして配信します。",
      },
      {
        name: "server-only",
        description:
          "読み取り関数が Client Component から import されないことをビルド時に保証します。",
      },
    ],
  },
  related: ["revalidation", "server-actions", "streaming"],
}
