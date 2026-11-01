import type { FlowTrace } from "@/types/flow"

import type { InvalidateMethod } from "./action-state"

const methodSteps: Record<InvalidateMethod, { label: string; detail: string }> =
  {
    updateTag: {
      label: 'updateTag("revalidation-demo")',
      detail: "タグの付いたキャッシュをすぐに期限切れにする",
    },
    revalidateTag: {
      label: 'revalidateTag("revalidation-demo", "max")',
      detail: "タグの付いたキャッシュを古いものとして印を付ける",
    },
    revalidatePath: {
      label: 'revalidatePath("/learn/revalidation")',
      detail: "パスに結び付いたキャッシュを無効にする",
    },
  }

interface RevalidationTraceInput {
  operationId: string
  method: InvalidateMethod
  beforeId: string
  /** 応答後に画面へ表示されている生成ID */
  afterId: string
}

/** 失効の操作と、その前後の生成IDを Process Visualizer 用のデータにする */
export function buildRevalidationTrace({
  operationId,
  method,
  beforeId,
  afterId,
}: RevalidationTraceInput): FlowTrace {
  const changed = beforeId !== afterId

  return {
    // 再読み取りで表示中の値が変わったときも再生し直す
    id: `${operationId}-${afterId}`,
    title: `${method} の実行結果`,
    source: "measured",
    steps: [
      {
        id: "submit",
        from: "client-component",
        to: "next-server",
        label: "ボタンから Server Action を呼び出す（POST）",
      },
      {
        id: "invoke",
        from: "next-server",
        to: "server-action",
        label: "invalidate(prevState, formData) を実行",
      },
      {
        id: "before",
        from: "server-action",
        to: "cache",
        label: "失効前の値を読み取る",
        detail: `id: ${beforeId}`,
      },
      {
        id: "invalidate",
        from: "server-action",
        to: "cache",
        ...methodSteps[method],
      },
      {
        id: "result",
        from: "server-component",
        to: "client-component",
        label: changed ? "画面の値が新しくなった" : "画面の値は変わっていない",
        detail: changed
          ? `id: ${beforeId} → ${afterId}`
          : `id: ${beforeId} のまま。「もう一度読み取る」で確認できる`,
      },
    ],
  }
}

/** 操作前に表示する、古い値を返しながら更新する流れの説明 */
export const staleWhileRevalidateModel: FlowTrace = {
  id: "stale-while-revalidate-model",
  title: 'revalidateTag(tag, "max") の考え方',
  source: "model",
  steps: [
    {
      id: "mark",
      from: "server-action",
      to: "cache",
      label: "キャッシュに古い印を付ける",
      detail: "この時点では作り直さない",
    },
    {
      id: "request",
      from: "browser",
      to: "next-server",
      label: "次のリクエストが届く",
    },
    {
      id: "stale",
      from: "cache",
      to: "next-server",
      label: "古い値をすぐに返す",
      detail: "利用者を待たせない",
    },
    {
      id: "refill",
      from: "next-server",
      to: "data-source",
      label: "裏側で新しい値を作る",
    },
    {
      id: "save",
      from: "data-source",
      to: "cache",
      label: "以後のリクエストには新しい値を返す",
    },
  ],
}
