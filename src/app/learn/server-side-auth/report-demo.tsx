import { AuthDemoUnconfiguredNotice } from "@/components/learning/auth-demo-unconfigured-notice"
import { DemoLayout } from "@/components/learning/demo-layout"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"
import { describeAuth } from "@/lib/auth-demo/describe"
import { listDemoUsers, ROLE_LABEL } from "@/lib/auth-demo/users"

import { EntryPanel, type LoginOption } from "./entry-panel"
import { readSalesReportWithTrace } from "./report"
import { ReportTable } from "./report-table"

/**
 * 入口1: Server Component。ページを描画するたびに、readSalesReport() で認証と認可を確かめる。
 * Server Component はステータスコードを返せないため、拒否した場合は代わりの表示を描画する。
 * 数字は確認を通った場合にだけレポートの表示部分に渡し、拒否した場合はこの部分の描画結果に入れない。
 * （ページ下のソースコード欄は、教材として sales-data.ts の架空の数字をそのまま載せている）
 *
 * cookie を読むためリクエストのたびに描画する。page.tsx の <Suspense> の中に置く。
 */
export async function ReportDemo() {
  const { access, trace } = await readSalesReportWithTrace("server-component")

  if (access.status === "unconfigured") {
    return (
      <DemoLayout
        runtime="client"
        runtimeDetail="ユーザーの切り替えと、入口を呼ぶボタン"
        demo={<AuthDemoUnconfiguredNotice />}
        visualizer={
          <ProcessVisualizer
            nodes={["browser", "next-server", "server-component"]}
            trace={null}
            emptyMessage="秘密鍵を設定すると、認証と認可の処理がここに表示されます"
          />
        }
      />
    )
  }

  const { auth } = access
  const viewer =
    auth.status === "authenticated"
      ? {
          label: `${auth.viewer.name}（${auth.viewer.roleLabel}）`,
          note: `署名と期限を確かめました。セッションの残りは約${Math.ceil(auth.expiresInSeconds / 60)}分です。`,
          userId: auth.viewer.id,
        }
      : { label: "未ログイン", note: describeAuth(auth), userId: null }

  const loginOptions: LoginOption[] = [
    { id: "", label: "ログアウト", note: "未ログインにする" },
    ...listDemoUsers().map((user) => ({
      id: user.id,
      label: `${user.name}としてログイン`,
      note: ROLE_LABEL[user.role],
    })),
  ]

  return (
    <EntryPanel
      // ユーザーが変わったら、前のユーザーで呼んだ結果を残さないように作り直す
      key={viewer.userId ?? "anonymous"}
      viewer={viewer}
      loginOptions={loginOptions}
      serverTrace={trace}
      serverOutcome={
        access.status === "ok"
          ? { outcome: "ok", label: "レポートを描画した" }
          : { outcome: "denied", label: "代わりの表示を描画した" }
      }
      serverResult={
        access.status === "ok" ? (
          <ReportTable report={access.report} />
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {access.status === "unauthenticated"
              ? "ログインが必要です。"
              : `${viewer.label}には、売上レポートを見る権限がありません。`}
            この表示には、売上の数字を渡していません。
          </p>
        )
      }
    />
  )
}
