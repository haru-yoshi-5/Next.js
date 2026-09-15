import { Suspense } from "react"

import { ActivitySection } from "./activity-section"
import { ProfileSection } from "./profile-section"
import { SectionFallback } from "./section-fallback"
import { getRequestStart } from "./slow-data"
import { StreamTimeline } from "./stream-timeline"

interface StreamingDemoProps {
  searchParams: PageProps<"/learn/streaming">["searchParams"]
}

export async function StreamingDemo({ searchParams }: StreamingDemoProps) {
  const { run } = await searchParams
  const runNumber = Math.max(1, Number.parseInt(String(run ?? "1"), 10) || 1)

  // このリクエストの開始時刻を記録する（Profile / Activity で同じ値を共有する）
  getRequestStart()

  return (
    // run が変わると key が変わり、Suspense 境界が新しく作り直される
    <StreamTimeline key={runNumber} run={runNumber}>
      <section
        aria-label="Header"
        className="rounded-lg border bg-muted/30 px-3 py-2.5"
      >
        <p className="text-sm font-medium">Dashboard</p>
        <p className="text-xs text-muted-foreground">
          Suspense の外側にあるため、データ取得を待たずに表示されます。
        </p>
      </section>

      {/* 2つの Suspense 境界は互いを待たず、準備ができた順に届く */}
      <Suspense
        fallback={<SectionFallback label="Profile" waitLabel="約1秒" />}
      >
        <ProfileSection />
      </Suspense>
      <Suspense
        fallback={<SectionFallback label="Activity" waitLabel="約2秒" />}
      >
        <ActivitySection />
      </Suspense>
    </StreamTimeline>
  )
}
