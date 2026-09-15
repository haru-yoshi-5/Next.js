// 教材ページへの遷移中に、サイドバーを残したまま表示されるローディング UI。
// learn/ 以下の page を Suspense で包み、この内容を fallback として使う。
export default function LearnLoading() {
  return (
    <div
      role="status"
      className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 lg:px-10"
    >
      <span className="sr-only">教材を読み込んでいます…</span>
      <div className="h-4 w-40 rounded bg-muted motion-safe:animate-pulse" />
      <div className="h-8 w-72 rounded bg-muted motion-safe:animate-pulse" />
      <div className="h-4 w-full max-w-2xl rounded bg-muted motion-safe:animate-pulse" />
      <div className="h-4 w-2/3 max-w-xl rounded bg-muted motion-safe:animate-pulse" />
      <div className="mt-6 h-64 rounded-xl border bg-muted/40 motion-safe:animate-pulse" />
    </div>
  )
}
