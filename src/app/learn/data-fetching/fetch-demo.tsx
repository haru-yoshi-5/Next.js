import { io } from "next/cache"

import { FetchPanel } from "./fetch-panel"
import { fetchInParallel, fetchSequentially } from "./fetch-strategies"
import { FetchTimeline } from "./fetch-timeline"
import { buildFetchTrace } from "./trace"

/**
 * async な Server Component。
 * 同じ2つのデータ取得を直列と並列で実行し、かかった時間を比べる。
 */
export async function FetchDemo() {
  // ここから先はリクエストのたびに実行する（ビルド時のプリレンダーには含めない）
  await io()

  const requestId = crypto.randomUUID()
  // 計測が重ならないように、比較する2つの取得方法は順番に実行する
  const sequential = await fetchSequentially()
  const parallel = await fetchInParallel()

  const scaleMs = Math.max(sequential.totalMs, parallel.totalMs)
  const differenceMs = Math.round(sequential.totalMs - parallel.totalMs)

  return (
    // FetchPanel は Client Component。
    // 下の結果はサーバーで描画済みの children として渡され、取得処理はブラウザへ送られない。
    <FetchPanel trace={buildFetchTrace({ requestId, sequential, parallel })}>
      <div className="flex flex-col gap-3">
        <FetchTimeline
          title="直列"
          description="await を順番に書くと、前の取得が終わるまで次の取得が始まりません。"
          run={sequential}
          scaleMs={scaleMs}
        />
        <FetchTimeline
          title="並列"
          description="先に2つとも開始してから、Promise.all でまとめて待ちます。"
          run={parallel}
          scaleMs={scaleMs}
        />
        <p className="text-sm">
          合計時間の差:{" "}
          <span className="font-mono tabular-nums">
            {differenceMs.toLocaleString("ja-JP")} ms
          </span>
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          取得結果はどちらも同じです（{parallel.author.name} /{" "}
          {parallel.posts.length} 件の記事）。
        </p>
      </div>
    </FetchPanel>
  )
}
