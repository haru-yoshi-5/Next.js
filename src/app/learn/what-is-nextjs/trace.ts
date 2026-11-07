import type { FlowTrace } from "@/types/flow"

import { formatKilobytes, type PageInspection } from "./inspect-page"

/**
 * このページが最初に届くまでの流れ（モデル図）。
 * サーバー内部の組み立てとハイドレーションはブラウザから観測できないため、
 * 「このページを調べる」の実測とは分けて表示する。
 */
export const pageModel: FlowTrace = {
  id: "page-model",
  title: "このページが最初に届くまで",
  source: "model",
  steps: [
    {
      id: "request",
      from: "browser",
      to: "next-server",
      label: "URL にリクエストを送る",
    },
    {
      id: "route",
      from: "next-server",
      to: "server-component",
      label: "URL に合うファイルを選び、外側の layout から組み立てる",
      detail: "ルーティングは Next.js が担当する",
    },
    {
      id: "html",
      from: "server-component",
      to: "browser",
      label: "本文入りの HTML と RSC Payload を返す",
      detail:
        "Server Components の結果に、Client Components の初回の HTML も含めて返す",
    },
    {
      id: "hydrate",
      from: "browser",
      to: "client-component",
      label: "JavaScript を実行し、ボタンを動かせるようにする",
      detail: "ハイドレーション",
    },
  ],
}

/**
 * 「このページを調べる」で実際に行った処理だけを Process Visualizer 用のデータにする。
 * 取得した HTML と JavaScript は文字列として数えるだけで、実行しない。
 */
export function buildInspectionTrace(
  id: string,
  result: PageInspection,
): FlowTrace {
  return {
    id,
    title: "このページの HTML を取得し直した結果",
    source: "measured",
    steps: [
      {
        id: "request",
        from: "browser",
        to: "next-server",
        label: `GET ${result.pathname}`,
        detail: `ステータス ${result.status}（HTML を読み終えるまでの時間）`,
        durationMs: result.responseMs,
      },
      {
        id: "html",
        from: "next-server",
        to: "browser",
        label: "HTML を受け取る",
        detail: `${formatKilobytes(result.htmlBytes)}`,
      },
      {
        id: "parse",
        from: "browser",
        to: "browser",
        label: "script を実行せずに HTML を解析",
        detail: `article 内のテキスト ${result.articleTextLength.toLocaleString()} 文字・RSC Payload を運ぶ script ${result.rscScriptCount} 個（${formatKilobytes(result.rscScriptBytes)}）`,
      },
      {
        id: "scripts",
        from: "browser",
        to: "next-server",
        label: `HTML が参照する JavaScript ${result.scriptCount} ファイルを取得`,
        detail: `合計 ${formatKilobytes(result.scriptBytes)}（展開後）。このデモでは実行しない`,
      },
    ],
  }
}
