import "server-only"

import { getAvailableLessons } from "@/content/curriculum"
import { getLessonContent } from "@/content/lessons"
import { getCodeMap, type CodeMapEntry } from "@/lib/learning/code-map"
import {
  type BrowserReport,
  parseBrowserReport,
  parseTraceSummary,
  type TraceSummary,
} from "@/lib/tracing/adapter"
import type { LessonContent } from "@/types/lesson-content"

import { validateQuestion } from "./client"
import { isRuntimeExplainLesson } from "./runtime-lessons"

/** 受け付ける本文の最大サイズ（バイト） */
export const BODY_MAX_BYTES = 4096

/** 許可する mode */
const ALLOWED_MODES = [
  "context_tutor",
  "runtime_explain",
  "code_explain",
  "what_if_compare",
] as const
export type ExplainMode = (typeof ALLOWED_MODES)[number]

/** 署名付きトークンとして受け付ける最大の長さ */
const TRACE_TOKEN_MAX_LENGTH = 1024
/** JWT（ヘッダー.本文.署名）の形 */
const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/

export type ExplainRequest =
  | { lesson: LessonContent; mode: "what_if_compare" }
  | {
      lesson: LessonContent
      mode: "context_tutor"
      question: string
    }
  | {
      lesson: LessonContent
      mode: "code_explain"
      entry: CodeMapEntry
    }
  | {
      lesson: LessonContent
      mode: "runtime_explain"
      /** 形だけを確かめた要約。改ざんがないかは、このあと署名で確かめる */
      summary: TraceSummary
      token: string
      /** ブラウザからの申告。署名の対象外で、信頼しない */
      browserReport: BrowserReport | null
    }

export type ParseResult =
  | { ok: true; value: ExplainRequest }
  | {
      ok: false
      status: 400 | 413
      message: string
      /** 実行記録やトークンの形式が不正なときだけ付ける（それ以外は status から決める） */
      code?: "invalid_trace"
    }

/**
 * 本文をストリームで読み、上限を超えた時点で読むのをやめる。
 * 上限を超えた場合は null を返す。
 */
export async function readBodyWithLimit(request: Request, maxBytes: number) {
  if (!request.body) return ""

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    totalBytes += value.byteLength
    if (totalBytes > maxBytes) {
      await reader.cancel().catch(() => undefined)
      return null
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(bytes)
}

function isAvailableLesson(slug: string) {
  return getAvailableLessons().some((lesson) => lesson.slug === slug)
}

function isAllowedMode(value: unknown): value is ExplainMode {
  return (
    typeof value === "string" &&
    (ALLOWED_MODES as readonly string[]).includes(value)
  )
}

/** 改行とタブ以外の制御文字 */
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/

/**
 * 本文の JSON を検証する。クライアントから送られた値は信頼せず、
 * 教材の本文はサーバー側で教材 ID から引く。
 */
export function parseExplainRequest(raw: string): ParseResult {
  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch {
    return {
      ok: false,
      status: 400,
      message: "リクエストの本文を JSON として読み取れませんでした。",
    }
  }

  if (typeof payload !== "object" || payload === null) {
    return {
      ok: false,
      status: 400,
      message: "リクエストの形式が正しくありません。",
    }
  }

  const fields = payload as Record<string, unknown>
  const { lessonId, mode, question, trace, traceToken, browserReport } = fields

  if (!isAllowedMode(mode)) {
    return {
      ok: false,
      status: 400,
      message: "この種類の質問には対応していません。",
    }
  }

  const lesson =
    typeof lessonId === "string" && isAvailableLesson(lessonId)
      ? getLessonContent(lessonId)
      : undefined
  if (!lesson) {
    return { ok: false, status: 400, message: "教材が見つかりませんでした。" }
  }

  if (mode === "what_if_compare") {
    if (
      lesson.slug !== "data-fetching" ||
      Object.keys(fields).some((key) => !["lessonId", "mode"].includes(key))
    ) {
      return {
        ok: false,
        status: 400,
        message: "この比較には対応していません。",
      }
    }
    return { ok: true, value: { lesson, mode } }
  }

  if (mode === "runtime_explain") {
    return parseRuntimeExplain(lesson, trace, traceToken, browserReport)
  }

  if (mode === "code_explain") {
    const entry = getCodeMap(lesson.slug).find(
      (entry) => entry.id === fields.selectedComponentId,
    )
    if (
      !entry ||
      !lesson.sourceFiles.some((file) => file.path === entry.path) ||
      Object.keys(fields).some(
        (key) => !["lessonId", "mode", "selectedComponentId"].includes(key),
      )
    ) {
      return {
        ok: false,
        status: 400,
        message: "解説できる登録済みの実装が見つかりませんでした。",
      }
    }
    return { ok: true, value: { lesson, mode, entry } }
  }

  // 空・文字数の検証は画面と同じ関数を使う（文字列でない値は空として扱う）
  const text = typeof question === "string" ? question : ""
  const problem = validateQuestion(text)
  if (problem) return { ok: false, status: 400, message: problem }
  const trimmed = text.trim()
  if (CONTROL_CHARACTERS.test(trimmed)) {
    return {
      ok: false,
      status: 400,
      message: "質問に使用できない文字が含まれています。",
    }
  }

  return { ok: true, value: { lesson, mode, question: trimmed } }
}

export const INVALID_TRACE_MESSAGE =
  "実行の記録を確認できませんでした。もう一度デモを実行してから、解説を依頼してください。"

/** runtime_explain の本文を確かめる（署名の検証は explain.ts で行う） */
function parseRuntimeExplain(
  lesson: LessonContent,
  trace: unknown,
  traceToken: unknown,
  browserReport: unknown,
): ParseResult {
  if (!isRuntimeExplainLesson(lesson.slug)) {
    return {
      ok: false,
      status: 400,
      message: "この教材では、実行の解説に対応していません。",
    }
  }
  const summary = parseTraceSummary(trace)
  if (
    !summary ||
    summary.lessonId !== lesson.slug ||
    typeof traceToken !== "string" ||
    traceToken.length > TRACE_TOKEN_MAX_LENGTH ||
    !JWT_SHAPE.test(traceToken)
  ) {
    return {
      ok: false,
      status: 400,
      message: INVALID_TRACE_MESSAGE,
      code: "invalid_trace",
    }
  }
  return {
    ok: true,
    value: {
      lesson,
      mode: "runtime_explain",
      summary,
      token: traceToken,
      browserReport: parseBrowserReport(browserReport),
    },
  }
}
