import { LoaderIcon } from "lucide-react"

/** Live Demo がストリーミングされるまでの Suspense fallback */
export function DemoSkeleton({ label }: { label: string }) {
  return (
    <div role="status" className="grid items-start gap-4 xl:grid-cols-2">
      {[0, 1].map((panel) => (
        <div key={panel} className="flex h-80 flex-col rounded-xl border">
          <div className="border-b px-4 py-3">
            <div className="h-3 w-28 rounded bg-muted motion-safe:animate-pulse" />
          </div>
          <div className="flex flex-1 flex-col gap-3 p-5">
            {panel === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderIcon
                  aria-hidden
                  className="size-4 motion-safe:animate-spin"
                />
                {label}
              </p>
            ) : null}
            <div className="h-4 w-3/4 rounded bg-muted motion-safe:animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-muted motion-safe:animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-muted motion-safe:animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
