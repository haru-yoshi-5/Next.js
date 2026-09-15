"use client"

import { ErrorView } from "@/components/layout/error-view"

// 教材ページで発生したエラーを受け止める。learn/layout.tsx（サイドバー）は残ったまま表示される。
export default function LearnError(props: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return <ErrorView {...props} />
}
