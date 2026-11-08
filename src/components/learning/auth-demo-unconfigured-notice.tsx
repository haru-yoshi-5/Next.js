import { KeyRoundIcon } from "lucide-react"

/**
 * 認証デモの秘密鍵（AUTH_DEMO_SECRET）がないときに、デモの代わりに表示する案内。
 * Authentication 章の教材で共通して使う。
 */
export function AuthDemoUnconfiguredNotice() {
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-dashed px-4 py-4">
      <h4 className="flex items-center gap-2 text-sm font-medium">
        <KeyRoundIcon aria-hidden className="size-4 shrink-0" />
        このデモは現在使えません
      </h4>
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
