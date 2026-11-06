import type { LessonContent } from "@/types/lesson-content"

const dir = "src/app/learn/protected-pages"
const lib = "src/lib/auth-demo"

export const protectedPagesLesson: LessonContent = {
  slug: "protected-pages",
  title: "保護されたページ",
  lead: "ログインした人だけが見られるページを作ります。未ログインの人を、ページの中の redirect() と Proxy のそれぞれでログインページへ送り、リダイレクトのされ方と、守る内容が届かないことを確かめます。",
  keyPoints: [
    "ページの中で確かめて redirect() する方法と、Proxy で描画の前に振り分ける方法の違い",
    "確認より前に守る内容を描画しない、ページの組み立て方",
    "ログイン後に元のページへ戻すときに、戻り先を許可リストで確かめる理由",
  ],
  sections: [
    {
      id: "page-check",
      title: "ページの中で確かめてリダイレクトする",
      blocks: [
        {
          type: "paragraph",
          text: "デモの「会員ページ（ページで確認）」は、お知らせを読む `member-notices.ts` の `readMemberArea()` の中で、`requireViewer()` がセッションを確かめます。未ログインなら `redirect()` でログインページへ送り、お知らせは読みません。前の教材と同じく、確認はデータを読む関数の中に置いています。",
        },
        {
          type: "paragraph",
          text: "このサイトは Cache Components を有効にしているため、cookie を読む部分は `<Suspense>` の中に置きます。ページの見出しと fallback は静的な部分として先に送られ、その後で確認が行われます。",
        },
        {
          type: "list",
          items: [
            'URL を直接開いた場合: 静的な部分を 200 で送り始めた後なので、ステータスは変えられない。`redirect()` は HTML に `<meta http-equiv="refresh">` を入れ、ブラウザに移動を伝える',
            "画面の中で `Link` から移動した場合: リダイレクトの情報を受け取った Next.js のルーターが、ログインページへ移動させる",
            "どちらの場合も、リダイレクトした部分の描画結果（HTML / RSC Payload）にお知らせは入らない",
          ],
        },
        {
          type: "callout",
          tone: "note",
          title: "ステータスが 307 になる場合もある",
          text: "`redirect()` が 200 のままになるのは、送信が始まった後に呼ばれたからです。送り始める前に呼ばれた場合（静的な部分を持たず、ページ全体をリクエストのたびに描画するアプリなど）は、307 のリダイレクトとして返ります。ステータスは、呼ばれた時点で送信が始まっているかで決まります。",
        },
      ],
    },
    {
      id: "build-order",
      title: "確認より前に、守る内容を描画しない",
      blocks: [
        {
          type: "paragraph",
          text: "`redirect()` で画面が移動しても、それまでに送った内容は取り消せません。そのため、守る内容は「確認 → データの取得 → 描画」の順に、1つのコンポーネントの中で作ります。デモの `member-area.tsx` は、`readMemberArea()` が戻ってきた後にだけ、お知らせを描画します。",
        },
        {
          type: "list",
          items: [
            "見出しや説明など静的な部分には、守る内容を書かない",
            "確認をするコンポーネントと、守る内容を描画するコンポーネントを兄弟に並べない。兄弟は確認の結果を待たずに描画される",
            "確認の前に、守るデータを Client Component の props に渡さない。props は RSC Payload に入ってブラウザへ届く",
          ],
        },
      ],
    },
    {
      id: "proxy",
      title: "Proxy で描画の前に振り分ける",
      blocks: [
        {
          type: "paragraph",
          text: "デモの「会員ページ（Proxy でも確認）」は、`proxy.ts` が描画の前に cookie の署名と期限を確かめます。通らなければ、ページを描画せずに 307 でログインページへリダイレクトします。静的な部分も送らないため、ステータスで移動を伝えられます。",
        },
        {
          type: "paragraph",
          text: "Next.js のドキュメントでは、Proxy での確認を cookie だけで判断する「楽観的な確認」と位置づけています。Proxy はリンクの prefetch でも動くため、データベースへの問い合わせなど重い処理には向きません。デモの Proxy も、ユーザーが存在するかまでは確かめません。",
        },
        {
          type: "comparison",
          columns: [
            {
              runtime: "server",
              title: "ページの中の確認",
              items: [
                "描画の途中で確かめる",
                "URL を直接開くと 200 + meta タグ",
                "ユーザーの存在まで確かめる（DAL）",
                "守りの中心。ページごとに必ず行う",
              ],
            },
            {
              runtime: "server",
              title: "Proxy の確認",
              items: [
                "描画の前に確かめる",
                "URL を直接開くと 307",
                "cookie の署名と期限だけを確かめる",
                "素早く振り分けるための補助",
              ],
            },
          ],
        },
        {
          type: "callout",
          tone: "caution",
          title: "Proxy だけに任せない",
          text: "署名が正しく、そのユーザーが存在しない cookie は、Proxy を通ってしまいます。デモでは、ページの中の `readMemberArea()` がもう一度確かめて止めます。また、ページを守っても、Server Action や Route Handler は別の入口として直接呼べます。それぞれの中でも確かめます（前の教材「サーバー側での認証」）。",
        },
      ],
    },
    {
      id: "layout",
      title: "レイアウトだけで確かめない",
      blocks: [
        {
          type: "paragraph",
          text: "複数のページをまとめて守りたいときに、`layout.tsx` で確かめたくなります。しかし Next.js のドキュメントでは、レイアウトだけで確かめることを勧めていません。",
        },
        {
          type: "list",
          items: [
            "レイアウトは、同じレイアウトの中でページを移動しても描画し直されない。移動のたびにセッションが確かめられるとは限らない",
            "レイアウトで代わりの表示を返しても、子のページは別に描画される。子のページの処理は止まらず、結果が RSC Payload に入ることもある",
          ],
        },
        {
          type: "paragraph",
          text: "この教材も `layout.tsx` に本文を置いていますが、そこでは確かめていません。確認は、守る内容を作るそれぞれのページの中で行います。",
        },
      ],
    },
    {
      id: "return-to",
      title: "ログイン後に元のページへ戻す",
      blocks: [
        {
          type: "paragraph",
          text: "リダイレクトするときは、ログインページの URL に戻り先を `?next=` で付けます。ログインした後、Server Action がこの値を見て元のページへ `redirect()` します。",
        },
        {
          type: "paragraph",
          text: "`?next=` は誰でも書き換えられます。そのまま `redirect()` に渡すと、外部のサイトへ移動させる「オープンリダイレクト」に使われるおそれがあります。`redirect()` は外部の URL も受け付けるためです。",
        },
        {
          type: "list",
          items: [
            "戻ってよいページを許可リストにし、完全に一致する値だけを受け付ける。`startsWith()` などの前方一致では、似た名前のパス・`..`・エンコードした文字を防ぎきれない",
            "許可されていない値なら、既定のページに戻す",
            "フォームの hidden の値もブラウザで書き換えられるため、ログインの Server Action の中でもう一度確かめる",
            "`redirect()` は例外を投げて移動させる。`try` / `catch` の外で呼び、`catch` で握りつぶさない",
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
            "このデモはデータベースを使わないため、ログアウトしても、コピーされたトークンは期限（15分）まで使える。ページの中の確認も、署名と期限とユーザーの存在を確かめるだけで、セッションを途中で無効にはできない",
            "Cache Components を有効にしたアプリでは、移動する前のページが `<Activity>` で隠れたまま残る。ログアウトしても、表示済みの守る内容が、そのタブの DOM に隠れて残ることがある。デモでは、枠の中をページが変わるたびに作り直して、前のページを残さない（未ログインで送られた後にログインしても、古いリダイレクトの状態でログインページに戻されないようにするため）",
            "デモのログインは本人確認を省いている。ログインの状態は、Authentication の章の教材どうしで共有される",
            "ページ下の「このデモを動かしているコード」には、教材として `member-notices.ts` の架空のお知らせをそのまま載せている。実際のアプリでは、守りたいデータをソースコードに書かず、データベースなどから読む",
          ],
        },
      ],
    },
  ],
  demo: {
    description:
      "枠の中のリンクで会員ページへ移動したり、会員ページの URL を直接取得したりして、ログインしていないときの止まり方を比べます。",
    steps: [
      "ログアウトした状態で「会員ページ（ページで確認）」のリンクを押し、ログインページへ送られることを確かめる（ブラウザの URL に ?next= が付く）",
      "ログインページで田中としてログインし、元の会員ページへ戻ることを確かめる",
      "ログアウトしてから、下の「〜を取得」で2つの会員ページを直接取得する。ページで確認する方は 200 + meta タグ、Proxy でも確認する方は描画の前に 3xx になることを比べる",
      "どちらの場合も、守る内容（お知らせ）が HTML に入っていないことを確かめる",
      "ログインしてからもう一度取得し、お知らせが届くことを確かめる",
    ],
  },
  sourceFiles: [
    {
      path: `${dir}/member-notices.ts`,
      role: "DAL",
      description: "確認を通ってから、会員向けのお知らせを読む",
    },
    {
      path: `${dir}/member-area.tsx`,
      role: "Server Component",
      description: "確認 → データの取得 → 描画を、この中で行う",
    },
    {
      path: `${dir}/members/page.tsx`,
      role: "Page",
      description: "ページの中だけで確かめて守る",
    },
    {
      path: `${dir}/proxy-guard.ts`,
      role: "Proxy",
      description: "描画の前に cookie の署名を確かめ、307 で振り分ける",
    },
    {
      path: "src/proxy.ts",
      role: "Proxy",
      description: "matcher の URL だけで動き、教材ごとの処理に振り分ける",
    },
    {
      path: `${dir}/return-to.ts`,
      role: "許可リスト",
      description: "ログイン後の戻り先を、完全一致で確かめる",
    },
    {
      path: `${dir}/actions.ts`,
      role: "Server Action",
      description: "ログインして、確かめた戻り先へ redirect() する",
    },
    {
      path: `${lib}/dal.ts`,
      role: "DAL",
      description:
        "requireViewer(): 未ログインならログインページへ redirect() する",
    },
  ],
  inside: {
    files: [
      {
        path: `${dir}/layout.tsx`,
        role: "Layout",
        description: "教材の本体。認証は確かめない",
      },
      {
        path: `${dir}/guard-demo-panel.tsx`,
        role: "Client Component",
        description: "枠の中の移動と、URL を直接取得するボタン。判定はしない",
      },
      {
        path: `${dir}/page.tsx`,
        role: "Page",
        description: "/learn/protected-pages（デモの入口。誰でも見られる）",
      },
      {
        path: `${dir}/viewer-card.tsx`,
        role: "Server Component",
        description: "<Suspense> の中で、現在のユーザーを確かめて表示する",
      },
      {
        path: `${dir}/logout-form.tsx`,
        role: "Client Component",
        description: "ログアウトのボタン",
      },
      {
        path: `${dir}/login/page.tsx`,
        role: "Page",
        description: "/learn/protected-pages/login（デモのログインページ）",
      },
      {
        path: `${dir}/login-area.tsx`,
        role: "Server Component",
        description: "<Suspense> の中で、?next= とセッションを確かめる",
      },
      {
        path: `${dir}/login-form.tsx`,
        role: "Client Component",
        description: "ユーザーを選んでログインするボタン",
      },
      {
        path: `${dir}/members/page.tsx`,
        role: "Page",
        description: "/learn/protected-pages/members（ページの中で確かめる）",
      },
      {
        path: `${dir}/proxied/page.tsx`,
        role: "Page",
        description:
          "/learn/protected-pages/proxied（Proxy とページの両方で確かめる）",
      },
      {
        path: `${dir}/demo-page-view.tsx`,
        role: "Server Component",
        description: "枠の中のページの見出しと <Suspense>",
      },
      {
        path: `${dir}/member-area.tsx`,
        role: "Server Component",
        description: "守る内容を、確認の後に描画する",
      },
      {
        path: `${dir}/member-notices.ts`,
        role: "DAL",
        description: "server-only。確認とお知らせの読み取り",
      },
      {
        path: `${dir}/actions.ts`,
        role: "Server Action",
        description: "ログインとログアウト",
      },
      {
        path: `${dir}/action-state.ts`,
        role: "型と初期値",
        description: "Server Action とフォームで共有する state の型",
        runtime: "client",
        runtimeReason:
          '初期値が "use client" の login-form.tsx と logout-form.tsx から import されるため Client',
      },
      {
        path: `${dir}/return-to.ts`,
        role: "許可リスト",
        description: "守られたページと、ログイン後の戻り先の確認",
        runtime: "client",
        runtimeReason:
          '"use client" の guard-demo-panel.tsx からも import されるため Client（Proxy と Server でも使用）',
      },
      {
        path: `${dir}/proxy-guard.ts`,
        role: "Proxy",
        description: "src/proxy.ts から呼ばれ、描画の前に振り分ける",
      },
      {
        path: `${dir}/probe.ts`,
        role: "fetch",
        description: "会員ページを直接取得し、応答を調べる",
        runtime: "client",
        runtimeReason:
          '"use client" の guard-demo-panel.tsx から import されるため Client',
      },
      {
        path: `${dir}/probe-trace.ts`,
        role: "Visualizer データ",
        description: "取得した応答から処理の流れを組み立てる",
        runtime: "client",
        runtimeReason:
          '"use client" の guard-demo-panel.tsx から import されるため Client',
      },
      {
        path: `${lib}/dal.ts`,
        role: "DAL",
        description: "server-only。セッションの検証と requireViewer()",
      },
    ],
    features: [
      {
        name: "redirect()",
        description:
          "未ログインなら、ページの中からログインページへ移動させています。",
      },
      {
        name: "Proxy",
        description:
          "描画の前に cookie の署名を確かめ、307 でリダイレクトしています。",
      },
      {
        name: "Data Access Layer",
        description: "認証の確認を、守る内容を読む関数の中にまとめています。",
      },
      {
        name: "Cache Components / Suspense",
        description:
          "cookie を読む部分だけを <Suspense> の中に置き、見出しを静的に配信しています。",
      },
      {
        name: "Layout",
        description:
          "教材の本文を layout.tsx に置き、Live Demo の枠の中だけをページで切り替えています。",
      },
    ],
  },
  related: ["server-side-auth", "authentication-basics", "loading-file"],
}
