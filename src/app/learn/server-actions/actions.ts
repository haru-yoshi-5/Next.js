"use server"

import { updateTag } from "next/cache"

import { measure } from "@/lib/measure"

import type { SaveNameState } from "./action-state"
import { buildActionTrace } from "./action-trace"
import { addEntry } from "./guestbook-store"

const NAME_MAX_LENGTH = 20

/** クライアントの入力は信頼せず、必ずサーバー側で検証する */
function validateName(name: string): string | null {
  if (name.length === 0) return "名前を入力してください。"
  if ([...name].length > NAME_MAX_LENGTH) {
    return `名前は${NAME_MAX_LENGTH}文字以内で入力してください。`
  }
  if (/[\u0000-\u001F\u007F]/.test(name)) {
    return "名前に使用できない文字が含まれています。"
  }
  return null
}

/**
 * フォームから呼び出される Server Action。
 * ブラウザからは POST リクエストとして呼ばれ、この関数本体はサーバーでのみ実行される。
 */
export async function saveName(
  _previousState: SaveNameState,
  formData: FormData,
): Promise<SaveNameState> {
  const startedAt = performance.now()
  const requestId = crypto.randomUUID()
  const elapsed = () => performance.now() - startedAt

  const rawName = formData.get("name")
  const submittedName = typeof rawName === "string" ? rawName : ""
  const name = submittedName.trim()

  // 1. バリデーション
  const validationError = validateName(name)
  if (validationError) {
    return {
      status: "error",
      message: validationError,
      submittedName,
      trace: buildActionTrace({
        requestId,
        totalMs: elapsed(),
        outcome: { type: "invalid", message: validationError },
      }),
    }
  }

  try {
    // 2. データ更新
    const { result: entry, durationMs: writeMs } = await measure(() =>
      addEntry(name),
    )

    // 3. 名前一覧のキャッシュを期限切れにする（この Action の応答に更新後の UI が含まれる）
    updateTag("guestbook")

    return {
      status: "success",
      message: `「${entry.name}」を一時保存しました。`,
      submittedName: "",
      trace: buildActionTrace({
        requestId,
        totalMs: elapsed(),
        outcome: { type: "saved", name: entry.name, writeMs },
      }),
    }
  } catch (error) {
    // 詳細はサーバーのログにだけ残し、ブラウザには一般的なメッセージを返す
    console.error("[saveName] データ更新に失敗しました", error)
    return {
      status: "error",
      message: "保存中にエラーが発生しました。時間をおいて再度お試しください。",
      submittedName,
      trace: buildActionTrace({
        requestId,
        totalMs: elapsed(),
        outcome: { type: "failed" },
      }),
    }
  }
}
