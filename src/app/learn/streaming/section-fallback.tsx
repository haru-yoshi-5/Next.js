import { LoaderIcon } from "lucide-react"

/** Suspense の fallback。静的シェルに含まれ、データを待たずに表示される */
export function SectionFallback({
  label,
  waitLabel,
}: {
  label: string
  waitLabel: string
}) {
  return (
    <div
      role="status"
      className="flex min-h-16 items-center gap-3 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground"
    >
      <LoaderIcon aria-hidden className="size-4 motion-safe:animate-spin" />
      <span>
        {label} を読み込み中…（{waitLabel}）
      </span>
    </div>
  )
}
