import { RouteView } from "./route-view"

// /learn/app-router にアクセスしたときに、layout.tsx の children として表示される。
export default function AppRouterIndexPage() {
  return (
    <RouteView file="app/learn/app-router/page.tsx" title="デモの入口">
      <p className="text-sm leading-relaxed text-muted-foreground">
        上のリンクを押すと、この枠の中だけが
        <code className="mx-1 font-mono">[slug]/page.tsx</code>
        の内容に切り替わります。枠の外側（メモ欄やリンク）は layout.tsx
        に属しているため、そのまま残ります。
      </p>
    </RouteView>
  )
}
