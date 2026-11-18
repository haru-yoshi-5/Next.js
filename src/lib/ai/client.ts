// ブラウザ（AI パネル）とサーバーの両方から使う。秘密の値や server-only のモジュールは読み込まない。
import type { BrowserReport, RuntimeExplainTicket } from "@/lib/tracing/adapter"

import type { LessonReference } from "./context"
import type { ExplainErrorCode } from "./explain"
import type { RuntimeSections } from "./prompts"

/** AI の API の場所 */
export const EXPLAIN_ENDPOINT = "/api/ai/explain"
/** 質問の最大文字数（サーバーの検証と同じ値を使う） */
export const QUESTION_MAX_LENGTH = 300
/** ブラウザで応答を待つ上限（ミリ秒）。外部通信の待ち時間の合計（最大 38 秒）に余裕を持たせる */
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
      /** 実行の解説（runtime_explain）を 3 つの見出しで分けたもの。分けられなければ null */
      sections?: RuntimeSections | null
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
  "generation_in_progress",
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
  "invalid_trace",
  "rate_limited",
  "generation_in_progress",
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

function parseSections(value: unknown): RuntimeSections | null {
  if (
    isRecord(value) &&
    typeof value.observed === "string" &&
    typeof value.lessonExplanation === "string" &&
    typeof value.unobservable === "string"
  ) {
    return {
      observed: value.observed,
      lessonExplanation: value.lessonExplanation,
      unobservable: value.unobservable,
    }
  }
  return null
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
      // 実行の解説（runtime_explain）の応答にだけ含まれる
      ...("sections" in body ? { sections: parseSections(body.sections) } : {}),
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

interface FetchOptions {
  /** テストで差し替えるためのもの。省略時はブラウザの fetch を使う */
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

interface RequestExplanationOptions extends FetchOptions {
  lessonId: string
  /** 前後の空白を除いた質問 */
  question: string
}

/**
 * AI の API に本文を送り、結果を画面で扱う形で返す。例外は投げない。
 * - 通信の失敗・タイムアウトは network_error
 * - 本文が JSON でない、または想定外の形なら invalid_response
 */
async function postExplain(
  payload: Record<string, unknown>,
  { fetchImpl = fetch, timeoutMs = CLIENT_TIMEOUT_MS }: FetchOptions,
): Promise<TutorResult> {
  let response: Response
  try {
    response = await fetchImpl(EXPLAIN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "same-origin",
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch {
    return NETWORK_ERROR_RESULT
  }

  let body: unknown
  try {
    body = await response.json()
  } catch (error) {
    // 本文の読み取り中に時間切れ・切断したときは、通信の失敗として扱う
    if (error instanceof DOMException) return NETWORK_ERROR_RESULT
    return INVALID_RESPONSE_RESULT
  }
  return parseExplainResponse(body)
}

export function requestWhatIfCompare(
  options: FetchOptions = {},
): Promise<TutorResult> {
  return postExplain(
    { lessonId: "data-fetching", mode: "what_if_compare" },
    options,
  )
}

/** AI の API に質問を送る（AI Context Tutor） */
export function requestExplanation({
  lessonId,
  question,
  ...options
}: RequestExplanationOptions): Promise<TutorResult> {
  return postExplain({ lessonId, mode: "context_tutor", question }, options)
}

interface RequestRuntimeExplanationOptions extends FetchOptions {
  lessonId: string
  /** Server Action が返した、署名付きの要約 */
  ticket: RuntimeExplainTicket
  /** ブラウザで計測した値（申告）。なければ null */
  browserReport: BrowserReport | null
}

export function requestCodeExplanation({
  lessonId,
  selectedComponentId,
  ...options
}: FetchOptions & { lessonId: string; selectedComponentId: string }) {
  return postExplain(
    { lessonId, mode: "code_explain", selectedComponentId },
    options,
  )
}

/**
 * 実行の記録を AI の API に送る（AI Runtime Detective）。
 * 送るのは、サーバーが作った要約と署名、ブラウザからの申告だけ。入力した値は送らない
 */
export function requestRuntimeExplanation({
  lessonId,
  ticket,
  browserReport,
  ...options
}: RequestRuntimeExplanationOptions): Promise<TutorResult> {
  return postExplain(
    {
      lessonId,
      mode: "runtime_explain",
      trace: ticket.summary,
      traceToken: ticket.token,
      browserReport,
    },
    options,
  )
}

/**
 * 回答の本文を、プレーンテキストとして読みやすくする。
 * HTML としては描画しないため、Markdown の記号のうち、文字のまま見えると読みにくいものだけを直す。
 * - 強調（**）は取り除く
 * - 行頭の見出し（#）は取り除く
 * - 行頭の箇条書き（* / -）は「・」にする
 * コードの中身は変えない。例: `2 ** 3` や `app/**\/page.tsx` の ** を消すと、コードの意味が変わるため
 *
 * コードの範囲を自前で正確に判定するのは難しい（リストや引用の中のフェンス、タブの字下げ、
 * 改行をまたぐインラインコードなど）。そのため、コードの範囲がはっきりしない回答は、
 * まったく整形せずにそのまま返す（安全側に倒す）。
 * - ``` か ~~~ をどこかに含む
 * - タブ、または 4 つ以上の空白で字下げした行がある（引用 > やリスト記号の後ろも含む）
 * - その行のうちに閉じないインラインコードがある（次の行へまたがる可能性）
 * - エスケープしたバッククォート（\`）を含む（コードの区切りかどうかの判定がずれるため）
 * 最悪の場合でも、記号が見えたままになるだけで、コードの意味は変わらない。
 *
 * それ以外の回答では、インラインコード（`…`）の中を除いて整形する。
 */
export function formatAnswer(answer: string) {
  // 判定は trim する前に行う（trim すると 1 行目の字下げが消え、コードを見落とすため）
  if (UNCLEAR_CODE_RANGE.test(answer)) return keepAsIs(answer)

  const formatted: string[] = []
  for (const line of answer.trim().split(/\r?\n/)) {
    const body = stripEmphasisOutsideCode(
      line.replace(/^[ ]*#{1,6}[ ]+/, "").replace(/^([ ]*)[*-][ ]+/, "$1・"),
    )
    if (body === null) return keepAsIs(answer)
    formatted.push(body)
  }
  return formatted.join("\n")
}

/**
 * コードの範囲がはっきりしない回答。
 * フェンスの記号、行頭（引用 > ・リスト記号・番号の後ろも含む）のタブ・4 つ以上の空白での字下げ、
 * またはエスケープしたバッククォート
 */
const UNCLEAR_CODE_RANGE = /```|~~~|\\`|^[ \t>*+\-\d.)]*(?:\t| {4})/m

/** 整形せずに返す。字下げを残すため、先頭の空行と末尾の空白だけを除く */
function keepAsIs(answer: string) {
  return answer.replace(/^(?:[ \t]*\r?\n)+/, "").trimEnd()
}

/** バッククォートが連続する長さ */
function backtickRunLength(text: string, start: number) {
  let end = start
  while (text[end] === "`") end++
  return end - start
}

/**
 * 1 行のうち、インラインコードの外側だけから強調記号（**）を取り除く。
 * 行のうちに閉じないインラインコードがあるときは null を返す（次の行へまたがる可能性があるため）
 */
function stripEmphasisOutsideCode(line: string): string | null {
  let result = ""
  let index = 0

  while (index < line.length) {
    const open = line.indexOf("`", index)
    if (open === -1) {
      result += line.slice(index).replaceAll("**", "")
      break
    }
    result += line.slice(index, open).replaceAll("**", "")

    // 同じ個数のバッククォートが続く場所を、閉じる記号として探す
    const runLength = backtickRunLength(line, open)
    let search = open + runLength
    let closeEnd = -1
    while (search < line.length) {
      const next = line.indexOf("`", search)
      if (next === -1) break
      const length = backtickRunLength(line, next)
      if (length === runLength) {
        closeEnd = next + length
        break
      }
      search = next + length
    }

    if (closeEnd === -1) return null
    result += line.slice(open, closeEnd)
    index = closeEnd
  }

  return result
}
