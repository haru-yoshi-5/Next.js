import { ArrivalReporter } from "./arrival-reporter"
import { elapsedSince, getActivities, getRequestStart } from "./slow-data"

/** 約2秒かかるデータ取得を行う Server Component */
export async function ActivitySection() {
  const requestStart = getRequestStart()
  const activities = await getActivities()
  const serverMs = elapsedSince(requestStart)

  return (
    <section aria-label="Activity" className="rounded-lg border">
      <header className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="text-sm font-medium">Activity</h3>
        <p className="font-mono text-xs text-muted-foreground tabular-nums">
          +{Math.round(serverMs)} ms
        </p>
      </header>
      <ul className="divide-y">
        {activities.map((activity) => (
          <li
            key={activity.id}
            className="flex justify-between gap-3 px-3 py-2 text-sm"
          >
            <span className="truncate">{activity.text}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {activity.when}
            </span>
          </li>
        ))}
      </ul>
      <ArrivalReporter id="activity" label="Activity" serverMs={serverMs} />
    </section>
  )
}
