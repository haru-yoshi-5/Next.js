import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ArticleFrame } from "../../article-frame"
import { ARTICLE_COUNT, findArticle, PRERENDERED_IDS } from "../../articles"

// generateMetadata も params を受け取れる。page と同じく値に応じたタイトルにする
export async function generateMetadata({
  params,
}: PageProps<"/learn/dynamic-routes/articles/[id]">): Promise<Metadata> {
  const { id } = await params
  const article = findArticle(id)
  return {
    title: `${article?.title ?? "記事が見つかりません"} | Dynamic Routes`,
  }
}

// ビルド時に 1〜3 だけをプリレンダーする。
// それ以外の値は、ビルド時に作った App Shell を先に返し、記事はリクエスト時に描画する。
export function generateStaticParams() {
  return PRERENDERED_IDS.map((id) => ({ id }))
}

// /learn/dynamic-routes/articles/[id] にマッチする Dynamic Route。
export default async function ArticlePage({
  params,
}: PageProps<"/learn/dynamic-routes/articles/[id]">) {
  // params は Promise。generateStaticParams にない値では、ここで描画が止まり
  // 同じフォルダの loading.tsx が App Shell に入る
  const { id } = await params
  const article = findArticle(id)

  // 該当する記事がなければ、同じフォルダの not-found.tsx を表示する
  if (!article) notFound()

  return (
    <ArticleFrame file="app/learn/dynamic-routes/articles/[id]/page.tsx">
      {/* data-nsc-article-id は Live Demo が HTML から到着を見つけるための目印 */}
      <article data-nsc-article-id={article.id} className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {article.title}
        </h1>
        <dl className="grid gap-1 rounded-md bg-muted/50 px-3 py-2 font-mono text-xs">
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted-foreground">params</dt>
            <dd className="break-all">{JSON.stringify({ id })}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted-foreground">generateStaticParams</dt>
            <dd>{article.prerendered ? "含まれる" : "含まれない"}</dd>
          </div>
        </dl>
        <p className="leading-relaxed text-muted-foreground">
          {article.prerendered
            ? "この番号は generateStaticParams が返す値に含まれるため、ビルド時に完成した HTML として保存されています。"
            : `この番号は generateStaticParams が返す値に含まれません。1〜${ARTICLE_COUNT} の有効な番号なので、リクエスト時に記事を描画しています。`}
        </p>
      </article>
    </ArticleFrame>
  )
}
