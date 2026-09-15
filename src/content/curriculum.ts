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
      { slug: "dynamic-routes", title: "Dynamic Routes", status: "planned" },
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
        status: "planned",
      },
    ],
  },
  {
    id: "data",
    number: "04",
    title: "Data",
    lessons: [
      { slug: "data-fetching", title: "Data Fetching", status: "planned" },
      {
        slug: "server-actions",
        title: "Server Actions",
        status: "available",
        summary:
          "フォーム送信から本物の Server Action が実行され、キャッシュ更新を経て画面に戻るまでを追います。",
        runtimes: ["client", "server"],
      },
      { slug: "route-handlers", title: "Route Handlers", status: "planned" },
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
        status: "planned",
      },
    ],
  },
  {
    id: "cache",
    number: "06",
    title: "Cache",
    lessons: [
      { slug: "nextjs-cache", title: "Next.js Cache", status: "planned" },
      { slug: "revalidation", title: "Revalidation", status: "planned" },
    ],
  },
  {
    id: "error-handling",
    number: "07",
    title: "Error Handling",
    lessons: [
      { slug: "error-file", title: "error.tsx", status: "planned" },
      { slug: "not-found-file", title: "not-found.tsx", status: "planned" },
      { slug: "loading-file", title: "loading.tsx", status: "planned" },
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
        status: "planned",
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
