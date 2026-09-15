"use client"

import { ErrorView } from "@/components/layout/error-view"

// ルート直下のページで発生したエラーを受け止める Error Boundary
export default function RootError(props: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <main id="main-content" className="flex-1">
      <ErrorView {...props} />
    </main>
  )
}
