"use server"

import { revalidatePath, revalidateTag, updateTag } from "next/cache"

import { type InvalidateState, isInvalidateMethod } from "./action-state"
import { getSharedValue, REVALIDATION_TAG } from "./shared-data"

/** 値を生成してから次の失効を受け付けるまでの時間 */
const COOLDOWN_MS = 5_000

/** クライアントから届く値は信頼せず、許可した方法だけを実行する */
export async function invalidate(
  _previousState: InvalidateState,
  formData: FormData,
): Promise<InvalidateState> {
  const method = formData.get("method")
  if (!isInvalidateMethod(method)) {
    return { status: "error", message: "不明な操作です。" }
  }

  try {
    const { id: actionReadId, generatedAt } = await getSharedValue()

    // 生成時刻は共有キャッシュの値なので、インスタンスをまたいで再生成の頻度を抑えられる
    if (Date.now() - generatedAt < COOLDOWN_MS) {
      return {
        status: "error",
        message:
          "値が作られた直後のため実行しませんでした。5秒ほど待って再度お試しください。",
      }
    }

    if (method === "updateTag") {
      updateTag(REVALIDATION_TAG)
    } else if (method === "revalidateTag") {
      revalidateTag(REVALIDATION_TAG, "max")
    } else {
      revalidatePath("/learn/revalidation")
    }

    return {
      status: "success",
      message: `${method} を実行しました。`,
      operationId: crypto.randomUUID(),
      method,
      actionReadId,
    }
  } catch (error) {
    // 詳細はサーバーのログにだけ残し、ブラウザには一般的なメッセージを返す
    console.error("[invalidate] キャッシュの失効に失敗しました", error)
    return {
      status: "error",
      message: "処理に失敗しました。時間をおいて再度お試しください。",
    }
  }
}
