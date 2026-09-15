import type { FlowTrace } from "@/types/flow"

export type CounterAction = "increment" | "decrement" | "reset"

const actionLabels: Record<CounterAction, string> = {
  increment: "+1",
  decrement: "-1",
  reset: "リセット",
}

interface CounterTraceInput {
  id: string
  action: CounterAction
  previous: number
  next: number
}

/** 実際に発生したクリック（押したボタンと state の変化）を Process Visualizer 用のデータにする */
export function buildCounterTrace({
  id,
  action,
  previous,
  next,
}: CounterTraceInput): FlowTrace {
  return {
    id,
    title: `「${actionLabels[action]}」のクリック`,
    source: "measured",
    steps: [
      {
        id: "event",
        from: "browser",
        to: "client-component",
        label: "click イベント → onClick を実行",
        detail: "イベントハンドラはブラウザで実行される",
      },
      {
        id: "set-state",
        from: "client-component",
        to: "client-component",
        label: `setCount(${next})`,
        detail: `state: ${previous} → ${next}`,
      },
      {
        id: "re-render",
        from: "client-component",
        to: "browser",
        label: "再レンダリングして DOM を更新",
        detail:
          previous === next
            ? "値が変わらないため、画面の表示は同じまま"
            : "変化した数字の部分だけが書き換わる。サーバーとの通信は発生しない",
      },
    ],
  }
}
