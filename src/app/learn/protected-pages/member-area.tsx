import { BadgeCheckIcon } from "lucide-react"

import { AuthDemoUnconfiguredNotice } from "@/components/learning/auth-demo-unconfigured-notice"

import { readMemberArea } from "./member-notices"
import { PROTECTED_PAGES, type ProtectedPageKey } from "./return-to"

/**
 * 守られたページの中身。page.tsx の <Suspense> の中で描画する。
 *
 * 確認 → データの取得 → 描画、の順に、すべてこのコンポーネントの中で行う。
 * 未ログインなら readMemberArea() の中でリダイレクトするため、お知らせはこの部分の描画結果
 * （HTML / RSC Payload）に入らない。確認の前に、守る内容を描画したり Client Component に渡したりしない。
 */
export async function MemberArea({ page }: { page: ProtectedPageKey }) {
  const area = await readMemberArea(PROTECTED_PAGES[page])

  if (area.status === "unconfigured") return <AuthDemoUnconfiguredNotice />

  return (
    // data-nsc-protected-content は、Live Demo が「守る内容が HTML に入っているか」を確かめるための目印
    <section
      aria-labelledby={`${page}-notices`}
      data-nsc-protected-content={page}
      data-nsc-data-ms={area.dataMs.toFixed(1)}
      className="flex flex-col gap-3 rounded-lg border border-server/30 bg-server-muted/40 px-4 py-3"
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        <BadgeCheckIcon aria-hidden className="size-4 shrink-0 text-server" />
        {area.viewer.name}（{area.viewer.roleLabel}）として確認を通りました
      </p>
      <h4
        id={`${page}-notices`}
        className="text-xs font-medium text-muted-foreground"
      >
        会員向けのお知らせ
      </h4>
      <ul className="flex flex-col gap-2">
        {area.notices.map((notice) => (
          <li key={notice.id} className="flex flex-col gap-0.5">
            <span className="text-sm">{notice.title}</span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              {notice.body}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
