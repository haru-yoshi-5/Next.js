import type { Chapter, CurriculumLesson } from "@/types/lesson"

/**
 * サイドバー・教材一覧で使うカリキュラム全体。
 * status: "available" の教材だけが /learn/[slug] として実装されている。
 */
export const curriculum: Chapter[] = [
  {
    id: "introduction",
    number: "01",
    title: "Introduction",
    lessons: [
      { slug: "what-is-nextjs", title: "Next.jsとは", status: "planned" },
      { slug: "react-and-nextjs", title: "Reactとの関係", status: "planned" },
      { slug: "why-nextjs", title: "Next.jsを使う理由", status: "planned" },
    ],
  },
  {
    id: "routing",
    number: "02",
    title: "Routing",
    lessons: [
      {
        slug: "app-router",
        title: "App Router",
        status: "available",
        summary:
          "フォルダ構成がURLになる仕組みと、layout を保ったまま page だけが切り替わる様子を確認します。",
        runtimes: ["server", "client"],
      },
      {
        slug: "dynamic-routes",
        title: "Dynamic Routes",
        status: "available",
        summary:
          "generateStaticParams に含まれる値・含まれない値・存在しない値で、ページの届き方が変わる様子を実測で比べます。",
        runtimes: ["server", "client"],
      },
    ],
  },
  {
    id: "server-and-client",
    number: "03",
    title: "Server & Client",
    lessons: [
      {
        slug: "server-components",
        title: "Server Components",
        status: "available",
        summary:
          "サーバーでデータを取得してレンダリングし、結果だけがブラウザへ届く流れを実測で確認します。",
        runtimes: ["server"],
      },
      {
        slug: "client-components",
        title: "Client Components",
        status: "available",
        summary:
          '"use client" が必要になる理由と、state 更新がブラウザ内だけで完結する様子を確認します。',
        runtimes: ["client"],
      },
      {
        slug: "server-client-boundary",
        title: "Server / Client Boundary",
        status: "available",
        summary:
          "コードは import で、データは props で境界を越えることを、届いた内容の検査で確認します。",
        runtimes: ["server", "client"],
      },
    ],
  },
  {
    id: "data",
    number: "04",
    title: "Data",
    lessons: [
      {
        slug: "data-fetching",
        title: "Data Fetching",
        status: "available",
        summary:
          "同じデータ取得を直列と並列で実行し、await の書き方で待ち時間が変わる様子を実測で確認します。",
        runtimes: ["server"],
      },
      {
        slug: "server-actions",
        title: "Server Actions",
        status: "available",
        summary:
          "フォーム送信から本物の Server Action が実行され、キャッシュ更新を経て画面に戻るまでを追います。",
        runtimes: ["client", "server"],
      },
      {
        slug: "route-handlers",
        title: "Route Handlers",
        status: "available",
        summary:
          "教材ページから本物の route.ts へ GET / POST / PUT を送り、ステータスコードとレスポンスを確認します。",
        runtimes: ["client", "server"],
      },
    ],
  },
  {
    id: "rendering",
    number: "05",
    title: "Rendering",
    lessons: [
      {
        slug: "streaming",
        title: "Streaming",
        status: "available",
        summary:
          "Suspense の境界ごとに、準備ができた部分から順番に HTML が届く様子を確認します。",
        runtimes: ["server"],
      },
      {
        slug: "static-and-dynamic",
        title: "Static / Dynamic",
        status: "available",
        summary:
          "1つのページの中で、静的シェルとリクエスト時の部分が別々に届く様子を実測で確認します。",
        runtimes: ["server", "client"],
      },
    ],
  },
  {
    id: "cache",
    number: "06",
    title: "Cache",
    lessons: [
      {
        slug: "nextjs-cache",
        title: "Next.js Cache",
        status: "available",
        summary:
          "同じ処理をキャッシュあり / なしで並べ、関数の結果が再利用される様子を実測で確認します。",
        runtimes: ["server"],
      },
      {
        slug: "revalidation",
        title: "Revalidation",
        status: "available",
        summary:
          "updateTag / revalidateTag / revalidatePath でキャッシュを失効させ、値の変わり方を比べます。",
        runtimes: ["client", "server"],
      },
    ],
  },
  {
    id: "error-handling",
    number: "07",
    title: "Error Handling",
    lessons: [
      {
        slug: "error-file",
        title: "error.tsx",
        status: "available",
        summary:
          "デモの中で障害を起こし、error.tsx が page の部分だけを差し替えて、retry() で回復する様子を確かめます。",
        runtimes: ["server", "client"],
      },
      {
        slug: "not-found-file",
        title: "not-found.tsx",
        status: "available",
        summary:
          "notFound() からどの not-found.tsx が選ばれるか、ステータスが 200 と 404 のどちらになるかを、実際に URL を取得して確かめます。",
        runtimes: ["server", "client"],
      },
      {
        slug: "loading-file",
        title: "loading.tsx",
        status: "available",
        summary:
          "loading.tsx がページを Suspense で包み、遷移した直後に待ちの表示を出す様子を、実際の遷移で計測します。",
        runtimes: ["server", "client"],
      },
    ],
  },
  {
    id: "authentication",
    number: "08",
    title: "Authentication",
    lessons: [
      {
        slug: "authentication-basics",
        title: "Authenticationの考え方",
        status: "available",
        summary:
          "デモのログインと Server Action で、認証（誰か）と認可（何をしてよいか）の違いと、確認をサーバーで行う理由を確かめます。",
        runtimes: ["server", "client"],
      },
      { slug: "protected-pages", title: "保護されたページ", status: "planned" },
    ],
  },
]

export type AvailableLesson = CurriculumLesson & { chapter: Chapter }

export function lessonHref(slug: string) {
  return `/learn/${slug}`
}

/** 公開済みの教材をカリキュラム順に返す */
export function getAvailableLessons(): AvailableLesson[] {
  return curriculum.flatMap((chapter) =>
    chapter.lessons
      .filter((lesson) => lesson.status === "available")
      .map((lesson) => ({ ...lesson, chapter })),
  )
}

/** 公開済み教材の中での前後の教材を返す */
export function getLessonNeighbors(slug: string) {
  const lessons = getAvailableLessons()
  const index = lessons.findIndex((lesson) => lesson.slug === slug)
  return {
    current: lessons[index],
    previous: index > 0 ? lessons[index - 1] : undefined,
    next: index >= 0 ? lessons[index + 1] : undefined,
  }
}
