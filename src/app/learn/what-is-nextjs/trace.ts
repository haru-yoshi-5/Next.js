import type { FlowTrace } from "@/types/flow"

import { formatKilobytes, type PageInspection } from "./inspect-page"

/**
 * このページが作られ、ブラウザに届くまでの流れ（モデル図）。
 * このページは静的に生成される（ビルド結果の ○）ため、描画はビルド時に行い、
 * リクエスト時は生成済みの HTML を返す。
 * サーバー内部の組み立てとハイドレーションはブラウザから観測できないため、
 * 「このページを調べる」の実測とは分けて表示する。
 */
export const pageModel: FlowTrace = {
  id: "page-model",
  title: "このページが作られ、届くまで",
  source: "model",
  steps: [
    {
      id: "build-render",
      from: "next-server",
      to: "server-component",
      label:
        "ビルド時: URL に合うファイルを選び、外側の layout から組み立てて描画",
      detail: "ルーティングとプリレンダーは Next.js が担当する",
    },
    {
      id: "build-output",
      from: "server-component",
      to: "next-server",
      label: "ビルド時: 本文入りの HTML と RSC Payload を生成して保存",
      detail:
        "Server Components の結果に、Client Components の初回の HTML も含めて生成する",
    },
    {
      id: "request",
      from: "browser",
      to: "next-server",
      label: "リクエスト時: URL にリクエストを送る",
    },
    {
      id: "response",
      from: "next-server",
      to: "browser",
      label: "リクエスト時: 生成済みの HTML（RSC Payload を含む）を返す",
      detail: "アクセスのたびに描画し直すわけではない",
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
