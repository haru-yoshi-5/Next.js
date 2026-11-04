import type { FlowStep, FlowTrace } from "@/types/flow"

import type { NotFoundMeasurement } from "./measure-not-found"

const ROOT_NOT_FOUND = "app/not-found.tsx"

/** 取得する前に表示する、notFound() と not-found.tsx の流れの説明 */
export const notFoundModel: FlowTrace = {
  id: "not-found-model",
  title: "見つからないときの2つの流れ",
  source: "model",
  steps: [
    {
      id: "request",
      from: "browser",
      to: "next-server",
      label: "ページをリクエストする",
    },
    {
      id: "render",
      from: "next-server",
      to: "server-component",
      label: "ルートが一致すれば、ステータス 200 で送信を始め page.tsx を実行",
    },
    {
      id: "not-found",
      from: "server-component",
      to: "browser",
      label: "notFound() を呼ぶと、一番近い not-found.tsx が表示される",
      detail: "ステータスは 200 のまま。noindex が加わる",
      status: "error",
    },
    {
      id: "unmatched",
      from: "next-server",
      to: "browser",
      label: "どのルートにも一致しなければ、app/not-found.tsx を 404 で返す",
      status: "error",
    },
  ],
}

/** 計測した結果を Process Visualizer 用のデータにする */
export function buildNotFoundTrace(
  id: string,
  measurement: NotFoundMeasurement,
): FlowTrace {
  const { path, status, noindex, proxy, totalMs, renderedFile } = measurement
  const noindexText = noindex ? "noindex あり" : "noindex なし"

  const steps: FlowStep[] = [
    {
      id: "request",
      from: "browser",
      to: "next-server",
      label: `GET ${path}`,
    },
  ]

  if (proxy) {
    steps.push({
      id: "proxy",
      from: "next-server",
      to: "next-server",
      label:
        proxy === "found"
          ? "proxy.ts: 商品があるので items/[id] に書き換える"
          : "proxy.ts: 商品がないので、どのルートにも一致しない URL に書き換える",
      detail: "描画の前に動くため、まだステータスを決められる",
    })
  }

  if (renderedFile === null) {
    steps.push({
      id: "response",
      from: "next-server",
      to: "browser",
      label: `${status}: 応答が届く`,
      detail: `表示されたファイルを確かめられなかった（${noindexText}）`,
      durationMs: totalMs,
      status: "error",
    })
  } else if (renderedFile === ROOT_NOT_FOUND) {
    steps.push({
      id: "root-not-found",
      from: "next-server",
      to: "browser",
      label: `${status}: ${ROOT_NOT_FOUND} が返る`,
      detail: `一致するルートがなく、page.tsx は実行されなかった（${noindexText}）`,
      durationMs: totalMs,
      status: "error",
    })
  } else {
    const isNotFound = renderedFile.endsWith("not-found.tsx")
    steps.push(
      {
        id: "render",
        from: "next-server",
        to: "server-component",
        label: `${status} で送信を始め、page.tsx を実行`,
      },
      {
        id: "result",
        from: "server-component",
        to: "browser",
        label: isNotFound
          ? `notFound() → ${renderedFile} が表示される`
          : `${renderedFile} が表示される`,
        detail: isNotFound
          ? `ステータスは ${status} のまま（${noindexText}）`
          : undefined,
        durationMs: totalMs,
        status: isNotFound ? "error" : "success",
      },
    )
  }

  return {
    id,
    title: `${path} の計測`,
    source: "measured",
    hideTotal: true,
    steps,
  }
}
