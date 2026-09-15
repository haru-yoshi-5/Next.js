import { RouteView } from "../route-view"

// [slug]/page.tsx の中で notFound() が呼ばれたときに、page の代わりに表示される。
export default function DemoRouteNotFound() {
  return (
    <RouteView
      file="app/learn/app-router/[slug]/not-found.tsx"
      title="ページが見つかりません"
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        この slug に対応するデータがないため、page.tsx が
        <code className="mx-1 font-mono">notFound()</code>
        を呼び、同じフォルダの not-found.tsx が表示されました。layout.tsx
        はそのまま残っています。
      </p>
    </RouteView>
  )
}
