import { ArticleFrame } from "../../article-frame"
import { ARTICLE_COUNT } from "../../articles"

// [id]/page.tsx の中で notFound() が呼ばれたときに、page の代わりに表示される。
// App Shell を送った後に呼ばれるため、ステータスは 200 のままで、
// Next.js が <meta name="robots" content="noindex"> を加える。
export default function ArticleNotFound() {
  return (
    <ArticleFrame file="app/learn/dynamic-routes/articles/[id]/not-found.tsx">
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          記事が見つかりません
        </h1>
        <p className="leading-relaxed text-muted-foreground">
          記事の番号は 1〜{ARTICLE_COUNT}{" "}
          の整数です。この値に対応する記事がないため、page.tsx が notFound()
          を呼び、同じフォルダの not-found.tsx が表示されました。
        </p>
      </section>
    </ArticleFrame>
  )
}
