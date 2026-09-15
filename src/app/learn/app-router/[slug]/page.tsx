import { notFound } from "next/navigation"

import { demoRoutes, findDemoRoute } from "../demo-routes"
import { RouteView } from "../route-view"

// ビルド時に3つの slug をプリレンダーする。一覧にない slug はリクエスト時に処理される。
export function generateStaticParams() {
  return demoRoutes.map((route) => ({ slug: route.slug }))
}

// /learn/app-router/[slug] にマッチする Dynamic Route。
export default async function DemoRoutePage({
  params,
}: PageProps<"/learn/app-router/[slug]">) {
  const { slug } = await params
  const route = findDemoRoute(slug)

  // 対応するデータがなければ、同じフォルダの not-found.tsx を表示する
  if (!route) notFound()

  return (
    <RouteView
      file="app/learn/app-router/[slug]/page.tsx"
      params={{ slug }}
      title={route.title}
    >
      <p className="text-sm leading-relaxed">{route.summary}</p>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground marker:text-muted-foreground">
        {route.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </RouteView>
  )
}
