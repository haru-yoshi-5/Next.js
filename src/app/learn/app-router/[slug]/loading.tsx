import { LoaderIcon } from "lucide-react"

// [slug]/page.tsx を自動で Suspense に包み、描画を待つ間に表示される。
export default function DemoRouteLoading() {
  return (
    <p
      role="status"
      className="flex items-center gap-2 text-sm text-muted-foreground"
    >
      <LoaderIcon aria-hidden className="size-4 motion-safe:animate-spin" />
      ページを読み込み中…（loading.tsx）
    </p>
  )
}
