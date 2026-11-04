import { ArticleFrame } from "../../article-frame"

// page.tsx の描画を待つ間に表示される。
// generateStaticParams にない値では、この表示がビルド時の App Shell に含まれ、最初に届く。
export default function ArticleLoading() {
  return (
    <ArticleFrame file="app/learn/dynamic-routes/articles/[id]/loading.tsx">
      {/* data-nsc-article-fallback は Live Demo が App Shell の到着を見つけるための目印 */}
      <div
        role="status"
        data-nsc-article-fallback=""
        className="flex flex-col gap-4"
      >
        <span className="sr-only">記事を読み込んでいます…</span>
        <div className="h-8 w-56 rounded bg-muted motion-safe:animate-pulse" />
        <div className="h-12 w-full max-w-md rounded-md bg-muted/50 motion-safe:animate-pulse" />
        <div className="h-4 w-full max-w-xl rounded bg-muted motion-safe:animate-pulse" />
      </div>
    </ArticleFrame>
  )
}
