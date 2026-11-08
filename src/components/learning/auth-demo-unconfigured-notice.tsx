import { KeyRoundIcon } from "lucide-react"

/**
 * 認証デモの秘密鍵（AUTH_DEMO_SECRET）がないときに、デモの代わりに表示する案内。
 * Authentication 章の教材で共通して使う。
 *
 * 見出しのレベルは置く場所で変わる。Live Demo（h2）の直下なら 3、
 * 枠の中のページ（h3）の下なら 4（既定）を指定する。
 */
export function AuthDemoUnconfiguredNotice({
  headingLevel = 4,
}: {
  headingLevel?: 3 | 4
}) {
  const Heading = headingLevel === 3 ? "h3" : "h4"
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-dashed px-4 py-4">
      <Heading className="flex items-center gap-2 text-sm font-medium">
        <KeyRoundIcon aria-hidden className="size-4 shrink-0" />
        このデモは現在使えません
      </Heading>
      <p className="text-sm leading-relaxed text-muted-foreground">
        セッションに署名するための秘密鍵（環境変数{" "}
        <code className="font-mono text-xs">AUTH_DEMO_SECRET</code>
        ）が、サーバーに設定されていないか、短すぎます。教材の本文はそのまま読めます。
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        手元で動かす場合は、32文字以上のランダムな文字列（例:{" "}
        <code className="font-mono">openssl rand -base64 32</code> の出力）を{" "}
        <code className="font-mono">.env.local</code>{" "}
        に設定し、サーバーを起動し直してください。
      </p>
    </section>
  )
}
