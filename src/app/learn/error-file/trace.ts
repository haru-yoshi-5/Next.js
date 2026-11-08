import type { FlowStep, FlowTrace } from "@/types/flow"

import type { DemoEvent } from "./demo-events"

/** 操作する前に表示する、error.tsx がエラーを受け止めて回復する流れの説明 */
export const errorModel: FlowTrace = {
  id: "error-model",
  title: "error.tsx がエラーを受け止める流れ",
  source: "model",
  steps: [
    {
      id: "throw",
      from: "server-component",
      to: "browser",
      label: "page の描画中に throw する",
      detail:
        "本番では元の message を伏せ、一般的な message と digest をブラウザへ送る",
      status: "error",
    },
    {
      id: "boundary",
      from: "browser",
      to: "client-component",
      label: "一番近い error.tsx が page の代わりに表示される",
      detail: "同じフォルダの layout は残る",
    },
    {
      id: "retry",
      from: "client-component",
      to: "server-component",
      label: "retry() で page を取り直して描画する",
    },
    {
      id: "recovered",
      from: "server-component",
      to: "browser",
      label: "描画に成功すれば page に戻る",
      status: "success",
    },
  ],
}

function toStep(event: DemoEvent, index: number, startedAt: number): FlowStep {
  const durationMs = event.atMs - startedAt
  const id = `${event.kind}-${index}`

  switch (event.kind) {
    case "outage":
      return {
        id,
        from: "browser",
        to: "server-action",
        label: "一時的な障害を起こす",
        detail:
          "Server Action が cookie に障害の終了時刻を保存し、page を描画し直す",
      }
    case "error":
      return {
        id,
        from: "server-component",
        to: "client-component",
        label: "page が throw し、error.tsx に切り替わる",
        detail: `受け取った digest: ${event.digest ?? "なし"}`,
        durationMs,
        status: "error",
      }
    case "retry":
      return {
        id,
        from: "client-component",
        to: "server-component",
        label: "retry()：page を取り直して描画する",
        durationMs,
      }
    case "reset":
      return {
        id,
        from: "client-component",
        to: "browser",
        label: "reset()：取り直さずに描画し直す",
        detail: "受け取り済みの内容をもう一度描画する",
        durationMs,
      }
    case "recovered":
      return {
        id,
        from: "server-component",
        to: "browser",
        label: "page の描画に成功し、error.tsx から戻る",
        durationMs,
        status: "success",
      }
  }
}

/**
 * 記録した出来事を Process Visualizer 用のデータにする。時間は障害を起こしてからの経過時間。
 * id は障害ごとに固定し、出来事が増えたときは追加されたステップだけが続けて再生されるようにする。
 */
export function buildErrorTrace(events: DemoEvent[]): FlowTrace {
  const startedAt = events[0]?.atMs ?? 0
  return {
    id: `outage-${startedAt}`,
    title: "障害から回復するまでの記録",
    source: "measured",
    hideTotal: true,
    steps: events.map((event, index) => toStep(event, index, startedAt)),
  }
}
