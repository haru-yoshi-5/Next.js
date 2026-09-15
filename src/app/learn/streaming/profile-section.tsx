import { ArrivalReporter } from "./arrival-reporter"
import { elapsedSince, getProfile, getRequestStart } from "./slow-data"

/** 約1秒かかるデータ取得を行う Server Component */
export async function ProfileSection() {
  const requestStart = getRequestStart()
  const profile = await getProfile()
  const serverMs = elapsedSince(requestStart)

  return (
    <section
      aria-label="Profile"
      className="flex items-center gap-3 rounded-lg border p-3"
    >
      <div
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-sm"
      >
        AT
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{profile.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {profile.role} · {profile.location}
        </p>
      </div>
      <p className="font-mono text-xs text-muted-foreground tabular-nums">
        +{Math.round(serverMs)} ms
      </p>
      <ArrivalReporter id="profile" label="Profile" serverMs={serverMs} />
    </section>
  )
}
