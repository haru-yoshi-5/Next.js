import { MessageCircleOffIcon } from "lucide-react"

/**
 * AI 機能が無効・未設定のときに、「AI に質問する」の代わりに表示する案内。
 * 書き方は AuthDemoUnconfiguredNotice にそろえる。足りない環境変数の名前は、開発中だけ表示する。
 */
export function AiUnavailableNotice({
  reason,
}: {
  reason: "disabled" | "unconfigured"
}) {
  const showSetupHint = process.env.NODE_ENV !== "production"

  return (
    <div className="flex flex-col gap-1 text-sm">
      <p className="flex items-center gap-2 font-medium">
        <MessageCircleOffIcon aria-hidden className="size-4 shrink-0" />
        AI に質問する機能は、現在使えません
      </p>
      <p className="leading-relaxed text-muted-foreground">
        教材の本文とデモは、そのままお使いいただけます。
      </p>
      {showSetupHint ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {reason === "disabled" ? (
            <>
              手元で使う場合は、<code className="font-mono">.env.local</code> の{" "}
              <code className="font-mono">NEXTSCOPE_AI_ENABLED</code> を{" "}
              <code className="font-mono">true</code> にし、README の「AI
              機能」の手順で設定してから、サーバーを起動し直してください。
            </>
          ) : (
            <>
              AI
              機能は有効ですが、必要な環境変数が足りないか、形式が正しくありません。
              <code className="font-mono">.env.example</code> の「AI
              機能」を見て設定し、サーバーを起動し直してください。
            </>
          )}
        </p>
      ) : null}
    </div>
  )
}
