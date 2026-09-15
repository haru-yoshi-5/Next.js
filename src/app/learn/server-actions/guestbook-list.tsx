import { cacheLife, cacheTag } from "next/cache"

import { readEntries } from "./guestbook-store"

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

/**
 * 保存された名前の一覧。
 * "use cache" で描画結果をキャッシュし、"guestbook" タグを付けておく。
 * Server Action で updateTag("guestbook") が呼ばれると、次の描画で作り直される。
 */
export async function GuestbookList() {
  "use cache"
  cacheLife("max")
  cacheTag("guestbook")

  const { entries, readAt } = await readEntries()

  return (
    <section aria-labelledby="guestbook-title" className="rounded-lg border">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <h3 id="guestbook-title" className="text-sm font-medium">
          保存された名前
        </h3>
        <p className="font-mono text-[0.7rem] text-muted-foreground">
          キャッシュ生成 {timeFormatter.format(readAt)}
        </p>
      </header>
      {entries.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-muted-foreground">
          まだ保存された名前はありません。
        </p>
      ) : (
        <ul className="divide-y">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <span className="truncate">{entry.name}</span>
              <time
                dateTime={entry.createdAt}
                className="shrink-0 font-mono text-xs text-muted-foreground"
              >
                {timeFormatter.format(new Date(entry.createdAt))}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
