// ブラウザ（AI パネル）とサーバーの両方から使う。秘密の値や server-only のモジュールは読み込まない。
import type { LessonReference } from "./context"
import type { ExplainErrorCode } from "./explain"

/** AI の API の場所 */
export const EXPLAIN_ENDPOINT = "/api/ai/explain"
/** 質問の最大文字数（サーバーの検証と同じ値を使う） */
export const QUESTION_MAX_LENGTH = 300
/** ブラウザで応答を待つ上限（ミリ秒）。サーバーの上限（30 秒）より少し長くする */
export const CLIENT_TIMEOUT_MS = 40_000

/** 文字数を数える（絵文字などのサロゲートペアも 1 文字として数える） */
export function countCharacters(text: string) {
  return [...text].length
}

/** 送信前の入力チェック。問題がなければ null を返す。最終的な検証はサーバーで行う */
export function validateQuestion(question: string): string | null {
  const trimmed = question.trim()
  if (trimmed.length === 0) return "質問を入力してください。"
  if (countCharacters(trimmed) > QUESTION_MAX_LENGTH) {
    return `質問は${QUESTION_MAX_LENGTH}文字以内で入力してください。`
  }
  return null
}

export type TutorErrorCode =
  ExplainErrorCode | "network_error" | "invalid_response"

export type TutorResult =
  | {
      status: "ok"
      answer: string
      references: LessonReference[]
      cached: boolean
      notice: string
    }
  | {
      status: "error"
      code: TutorErrorCode
      message: string
      /** 同じ質問をそのまま送り直して、うまくいく見込みがあるか */
      retryable: boolean
    }

/** 時間をおけば同じ質問で成功する見込みがある失敗 */
const RETRYABLE_CODES: ReadonlySet<TutorErrorCode> = new Set([
  "timeout",
  "upstream_rate_limited",
  "upstream_error",
  "store_unavailable",
  "network_error",
  "invalid_response",
])

const DEFAULT_NOTICE =
  "AI が生成した解説です。誤りを含むことがあります。教材の本文とあわせて確認してください。"

export const NETWORK_ERROR_RESULT: TutorResult = {
  status: "error",
  code: "network_error",
  message:
    "AI の応答を受け取れませんでした。通信状況を確認して、もう一度お試しください。",
  retryable: true,
}

const INVALID_RESPONSE_RESULT: TutorResult = {
  status: "error",
  code: "invalid_response",
  message:
    "AI の応答を読み取れませんでした。時間をおいて、もう一度お試しください。",
  retryable: true,
}

const KNOWN_ERROR_CODES: ReadonlySet<string> = new Set<ExplainErrorCode>([
  "disabled",
  "region_not_supported",
  "payload_too_large",
  "invalid_request",
  "sensitive_content",
  "rate_limited",
  "store_unavailable",
  "timeout",
  "upstream_rate_limited",
  "model_unavailable",
  "no_answer",
  "upstream_error",
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

/** 教材ページへのリンクだけを受け付ける（外部の URL や javascript: を表示しない） */
function isLessonReference(value: unknown): value is LessonReference {
  return (
    isRecord(value) &&
    typeof value.slug === "string" &&
    typeof value.title === "string" &&
    typeof value.href === "string" &&
    /^\/learn\/[a-z0-9-]+$/.test(value.href)
  )
}

/**
 * API の応答本文を、画面で扱う形に直す。
 * 想定外の形なら、読み取れなかった失敗として扱う（例外にしない）。
 */
export function parseExplainResponse(body: unknown): TutorResult {
  if (!isRecord(body)) return INVALID_RESPONSE_RESULT

  if (body.status === "ok") {
    if (typeof body.answer !== "string" || body.answer.trim() === "") {
      return INVALID_RESPONSE_RESULT
    }
    return {
      status: "ok",
      answer: body.answer,
      references: Array.isArray(body.references)
        ? body.references.filter(isLessonReference)
        : [],
      cached: body.cached === true,
      notice: typeof body.notice === "string" ? body.notice : DEFAULT_NOTICE,
    }
  }

  if (
    body.status === "error" &&
    typeof body.code === "string" &&
    KNOWN_ERROR_CODES.has(body.code) &&
    typeof body.message === "string"
  ) {
    const code = body.code as ExplainErrorCode
    return {
      status: "error",
      code,
      message: body.message,
      retryable: RETRYABLE_CODES.has(code),
    }
  }

  return INVALID_RESPONSE_RESULT
}

/**
 * 回答の本文を、プレーンテキストとして読みやすくする。
 * HTML としては描画しないため、Markdown の記号のうち、文字のまま見えると読みにくいものだけを直す。
 * - 強調（**）は取り除く
 * - 行頭の見出し（#）は取り除く
 * - 行頭の箇条書き（* / -）は「・」にする
 * コードを表すバッククォート（`）は、意味が伝わるため残す。
 */
export function formatAnswer(answer: string) {
  return answer
    .replaceAll("**", "")
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, "")
    .replace(/^([ \t]*)[*-][ \t]+/gm, "$1・")
    .trim()
}
