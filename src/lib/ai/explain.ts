import "server-only"

import { createHash } from "node:crypto"

import { readMappedCode } from "@/lib/learning/code-map"

import { AI_NOTICE } from "./client"
import type { AiConfigResult } from "./config"
import {
  buildLessonContext,
  buildLessonReferences,
  type LessonReference,
} from "./context"
import type { AnswerGenerator } from "./gemini"
import {
  buildSessionSetCookie,
  createSession,
  hashIdentifier,
  readClientIp,
  readSessionCookie,
  verifySessionCookie,
} from "./identity"
import { findSensitiveContent } from "./inspect"
import {
  buildContextTutorPrompt,
  buildRuntimeExplainPrompt,
  CODE_PROMPT_VERSION,
  CODE_SYSTEM_INSTRUCTION,
  formatTraceForPrompt,
  PROMPT_VERSION,
  RUNTIME_PROMPT_VERSION,
  RUNTIME_SYSTEM_INSTRUCTION,
  type RuntimeSections,
  splitRuntimeAnswer,
  SYSTEM_INSTRUCTION,
} from "./prompts"
import { isAllowedRegion } from "./region"
import {
  BODY_MAX_BYTES,
  INVALID_TRACE_MESSAGE,
  parseExplainRequest,
  readBodyWithLimit,
} from "./request"
import type { AiStore, QuotaEntry } from "./store"
import { TRACE_TOKEN_TTL_MINUTES, verifyTraceToken } from "./trace-token"
import {
  jstDateKey,
  nextJstMidnightSeconds,
  secondsUntilNextJstMidnight,
} from "./time"

/** キャッシュの保存期間（秒） */
const CACHE_TTL_SECONDS = 60 * 60
/** Gemini のタイムアウト（20 秒）と、前後の Redis 操作（各最大 3 秒）を含む猶予 */
const GENERATION_LOCK_TTL_SECONDS = 40
/** 利用制限のキーを、日付が変わってから消すまでの猶予（秒） */
const QUOTA_EXPIRE_GRACE_SECONDS = 60 * 60
/** 回答として返す最大文字数 */
const ANSWER_MAX_LENGTH = 4000
const KEY_PREFIX = "nextscope:ai"

export type ExplainErrorCode =
  | "disabled"
  | "region_not_supported"
  | "payload_too_large"
  | "invalid_request"
  | "sensitive_content"
  | "invalid_trace"
  | "rate_limited"
  | "generation_in_progress"
  | "store_unavailable"
  | "timeout"
  | "upstream_rate_limited"
  | "model_unavailable"
  | "no_answer"
  | "upstream_error"

export type ExplainResponseBody =
  | {
      status: "ok"
      answer: string
      references: LessonReference[]
      cached: boolean
      notice: string
      /** runtime_explain のときだけ。見出しで分けられなかったときは null */
      sections?: RuntimeSections | null
    }
  | {
      status: "error"
      code: ExplainErrorCode
      message: string
      retryAfterSeconds?: number
    }

export interface ExplainLogEntry {
  lessonId?: string
  mode?: string
  outcome: "ok" | ExplainErrorCode
  cached?: boolean
  /** Gemini の呼び出しに失敗したときの HTTP ステータス（原因の切り分け用） */
  upstreamStatus?: number
  durationMs: number
}

export interface ExplainDeps {
  config: AiConfigResult
  isProduction: boolean
  /** config が ready のときに使う保存先 */
  getStore: () => AiStore
  /** config が ready のときに使う、回答を作る処理 */
  getGenerator: () => AnswerGenerator
  now: () => Date
  /** 質問の本文・IP アドレス・キーは渡さない */
  log: (entry: ExplainLogEntry) => void
}

const UNAVAILABLE_MESSAGE =
  "AI 機能は現在利用できません。教材とデモはそのままお使いいただけます。"

const SESSION_MISSING_MESSAGE =
  "実行の記録を、この利用者のものとして確認できませんでした。ページを読み込み直してから、もう一度デモを実行してください。"
const TRACE_EXPIRED_MESSAGE = `実行の記録の有効期限（${TRACE_TOKEN_TTL_MINUTES} 分）が切れました。もう一度デモを実行してから、解説を依頼してください。`

const GENERATE_ERRORS = {
  timeout: {
    status: 504,
    code: "timeout",
    message:
      "AI の応答に時間がかかったため中断しました。時間をおいて、もう一度お試しください。",
  },
  rate_limited: {
    status: 429,
    code: "upstream_rate_limited",
    message:
      "AI の利用が集中しています。時間をおいて、もう一度お試しください。",
  },
  model_unavailable: {
    status: 503,
    code: "model_unavailable",
    message: UNAVAILABLE_MESSAGE,
  },
  no_answer: {
    status: 502,
    code: "no_answer",
    message:
      "AI から回答を得られませんでした。質問の言い方を変えて、もう一度お試しください。",
  },
  upstream_error: {
    status: 502,
    code: "upstream_error",
    message:
      "AI の呼び出しでエラーが発生しました。時間をおいて、もう一度お試しください。",
  },
} as const

/**
 * キャッシュのキーに使う質問の形。前後の空白を除くだけにする。
 * 大文字・小文字や空白の数を変えると、意味の違うコードの質問（GET() と get() など）が同じキーになるため
 */
function normalizeQuestion(question: string) {
  return question.trim()
}

/** キャッシュのキー。parts の要素と順序がすべて同じときだけ一致する */
function cacheKeyOf(parts: unknown[]) {
  const digest = createHash("sha256")
    .update(JSON.stringify(parts))
    .digest("base64url")
  return `${KEY_PREFIX}:cache:${digest}`
}

/** 同じ教材・同じ質問・同じ指示・同じモデルのときだけ一致するキャッシュのキー */
export function buildCacheKey(input: {
  model: string
  mode: string
  lessonId: string
  question: string
}) {
  return cacheKeyOf([
    PROMPT_VERSION,
    input.model,
    input.mode,
    input.lessonId,
    normalizeQuestion(input.question),
  ])
}

/**
 * 実行記録の解説のキャッシュのキー。
 * 同じ利用者（匿名のセッション ID）・同じ実行記録（要約のハッシュ）・同じ申告・同じ指示・同じモデルのときだけ一致する
 */
function buildRuntimeCacheKey(input: {
  model: string
  lessonId: string
  sessionId: string
  summaryHash: string
  browserRoundTripMs: number | null
}) {
  return cacheKeyOf([
    RUNTIME_PROMPT_VERSION,
    input.model,
    "runtime_explain",
    input.lessonId,
    input.sessionId,
    input.summaryHash,
    input.browserRoundTripMs,
  ])
}

/**
 * POST /api/ai/explain の処理（docs/AI_IMPLEMENTATION_PLAN.md §6.1）。
 * どの失敗も、説明できるエラーの形で返し、例外を教材ページへ伝えない。
 */
export async function handleExplain(
  request: Request,
  deps: ExplainDeps,
): Promise<Response> {
  const startedAt = performance.now()
  const headers = new Headers({ "Cache-Control": "private, no-store" })
  /** ログに残す教材 ID と mode（検証を通った後に入れる） */
  const logContext: { lessonId?: string; mode?: string } = {}

  const finish = (
    status: number,
    body: ExplainResponseBody,
    extra?: { cached?: boolean; upstreamStatus?: number },
  ) => {
    deps.log({
      ...logContext,
      outcome: body.status === "ok" ? "ok" : body.code,
      cached: extra?.cached,
      ...(extra?.upstreamStatus !== undefined
        ? { upstreamStatus: extra.upstreamStatus }
        : {}),
      durationMs: performance.now() - startedAt,
    })
    return Response.json(body, { status, headers })
  }
  const fail = (
    status: number,
    code: ExplainErrorCode,
    message: string,
    retryAfterSeconds?: number,
    upstreamStatus?: number,
  ) => {
    if (retryAfterSeconds !== undefined) {
      headers.set("Retry-After", String(retryAfterSeconds))
    }
    return finish(
      status,
      {
        status: "error",
        code,
        message,
        ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
      },
      { upstreamStatus },
    )
  }

  // 1. 機能フラグ・キー・保存先の設定
  if (deps.config.status !== "ready") {
    return fail(503, "disabled", UNAVAILABLE_MESSAGE)
  }
  const { config } = deps.config

  // 2. 提供地域（日本だけ）
  if (
    !isAllowedRegion(
      request.headers.get("x-vercel-ip-country"),
      deps.isProduction,
    )
  ) {
    return fail(
      403,
      "region_not_supported",
      "AI 機能は日本国内からのみ利用できます。教材とデモはそのままお使いいただけます。",
    )
  }

  // 3. 本文のサイズ・JSON・入力値
  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (contentLength > BODY_MAX_BYTES) {
    return fail(413, "payload_too_large", "リクエストの本文が大きすぎます。")
  }
  let raw: string | null
  try {
    raw = await readBodyWithLimit(request, BODY_MAX_BYTES)
  } catch {
    return fail(
      400,
      "invalid_request",
      "リクエストの本文を読み取れませんでした。",
    )
  }
  if (raw === null) {
    return fail(413, "payload_too_large", "リクエストの本文が大きすぎます。")
  }
  const parsed = parseExplainRequest(raw)
  if (!parsed.ok) {
    return fail(
      parsed.status,
      parsed.code ??
        (parsed.status === 413 ? "payload_too_large" : "invalid_request"),
      parsed.message,
    )
  }
  const { lesson } = parsed.value
  logContext.lessonId = lesson.slug
  logContext.mode = parsed.value.mode

  const now = deps.now()
  const references = buildLessonReferences(lesson)
  let sessionId = verifySessionCookie(
    config.hashSecret,
    readSessionCookie(request.headers),
  )
  let cacheKey: string
  let systemInstruction: string
  let prompt: string

  if (parsed.value.mode === "context_tutor") {
    const { question } = parsed.value
    // 4. 送る内容の検査
    if (findSensitiveContent(question).length > 0) {
      return fail(
        400,
        "sensitive_content",
        "個人情報や秘密情報（メールアドレス・電話番号・API キーなど）らしい内容が含まれているため、送信しませんでした。該当する部分を削除してから、もう一度お試しください。",
      )
    }

    // 5. 教材の内容と参照先は、サーバーで教材 ID から組み立てる
    cacheKey = buildCacheKey({
      model: config.model,
      mode: parsed.value.mode,
      lessonId: lesson.slug,
      question,
    })
    systemInstruction = SYSTEM_INSTRUCTION
    prompt = buildContextTutorPrompt(buildLessonContext(lesson), question)
  } else if (parsed.value.mode === "what_if_compare") {
    prompt =
      "独立した2つの固定データ取得を、逐次 await と Promise.all で比較する。取得には待ち時間を模した処理を使う。"
    systemInstruction =
      "あなたはデータ取得の学習を支援します。日本語で一般論を説明してください。独立した取得では並列実行によって待ち時間が重なることと、逐次実行との違いを主題にしてください。依存関係がある場合、同時実行数の制限がある場合、Promise.all の一つが失敗した場合を条件付きで説明してください。今回の実測値、倍率、結果を推測しないでください。回答は画面にそのまま文字として表示されるため、Markdown の記号（見出しの #、強調の **、区切り線の ---、コードのバッククォート）を使わず、字下げのない短い段落で、全体で600字程度にまとめてください。"
    cacheKey = cacheKeyOf([
      "what-if-v2",
      config.model,
      parsed.value.mode,
      lesson.slug,
      prompt,
      systemInstruction,
    ])
  } else if (parsed.value.mode === "code_explain") {
    const { entry } = parsed.value
    try {
      const { code, start, end } = await readMappedCode(entry)
      const lessonContext = buildLessonContext(lesson)
      if (
        findSensitiveContent(code).length ||
        findSensitiveContent(lessonContext).length
      ) {
        return fail(
          400,
          "sensitive_content",
          "秘密情報らしい内容が含まれているため、この実装を AI に送信できません。",
        )
      }
      prompt = JSON.stringify({
        lessonContext,
        selectedElement: entry.label,
        component: entry.component,
        path: entry.path,
        firstLine: start + 1,
        lastLine: end + 1,
        code,
      })
      cacheKey = cacheKeyOf([
        CODE_PROMPT_VERSION,
        config.model,
        parsed.value.mode,
        lesson.slug,
        entry.id,
        prompt,
      ])
      systemInstruction = CODE_SYSTEM_INSTRUCTION
    } catch {
      return fail(
        503,
        "upstream_error",
        "解説に使う公開コードを読み込めませんでした。",
      )
    }
  } else {
    const { summary, token, browserReport } = parsed.value
    // 4. 実行記録の検証。匿名 Cookie と署名で、この利用者の実行で改ざんがないことを確かめる
    if (!sessionId) {
      return fail(400, "invalid_trace", SESSION_MISSING_MESSAGE)
    }
    const check = await verifyTraceToken({
      secret: config.hashSecret,
      sessionId,
      summary,
      now,
      token,
      lessonId: lesson.slug,
    })
    if (!check.ok) {
      return fail(
        400,
        "invalid_trace",
        check.reason === "expired"
          ? TRACE_EXPIRED_MESSAGE
          : INVALID_TRACE_MESSAGE,
      )
    }

    // 5. 実行記録の回答は、その実行をした利用者にだけ返す（キーにセッション ID を含める）
    const browserRoundTripMs = browserReport?.roundTripMs ?? null
    cacheKey = buildRuntimeCacheKey({
      model: config.model,
      lessonId: lesson.slug,
      sessionId,
      summaryHash: check.summaryHash,
      browserRoundTripMs,
    })
    systemInstruction = RUNTIME_SYSTEM_INSTRUCTION
    prompt = buildRuntimeExplainPrompt(
      buildLessonContext(lesson),
      formatTraceForPrompt(summary),
      browserRoundTripMs,
    )
  }

  const okBody = (answer: string, cached: boolean): ExplainResponseBody => ({
    status: "ok",
    answer,
    references,
    cached,
    notice: AI_NOTICE,
    ...(parsed.value.mode === "runtime_explain"
      ? { sections: splitRuntimeAnswer(answer) }
      : {}),
  })

  let store: AiStore
  let lockToken: string | null

  // 6. キャッシュ（保存先が使えなければ AI を止める）
  try {
    store = deps.getStore()
    const cached = await store.getCachedAnswer(cacheKey)
    if (cached) {
      return finish(200, okBody(cached.answer, true), { cached: true })
    }
    lockToken = await store.acquireGenerationLock(
      cacheKey,
      GENERATION_LOCK_TTL_SECONDS,
    )
  } catch {
    return fail(503, "store_unavailable", UNAVAILABLE_MESSAGE)
  }

  if (lockToken === null) {
    return fail(
      409,
      "generation_in_progress",
      "同じ内容の解説を生成中です。少し時間をおいて、もう一度お試しください。",
    )
  }

  try {
    try {
      // 最初のキャッシュ確認からロック取得までの間に、別の要求が保存した可能性がある
      const cached = await store.getCachedAnswer(cacheKey)
      if (cached) {
        return finish(200, okBody(cached.answer, true), { cached: true })
      }
    } catch {
      return fail(503, "store_unavailable", UNAVAILABLE_MESSAGE)
    }

    // 7. 利用制限（サイト全体・IP アドレス・匿名 Cookie を別々に数える）
    const dateKey = jstDateKey(now)
    // context_tutor は Cookie がなくても使える。なければここで発行する
    if (!sessionId) {
      const session = createSession(config.hashSecret)
      sessionId = session.id
      headers.append(
        "Set-Cookie",
        buildSessionSetCookie(session.cookieValue, deps.isProduction),
      )
    }
    const ip = readClientIp(request.headers, deps.isProduction)
    const entries: QuotaEntry[] = [
      { key: `${KEY_PREFIX}:quota:${dateKey}:global`, limit: config.dailyCap },
      {
        key: `${KEY_PREFIX}:quota:${dateKey}:ip:${hashIdentifier(config.hashSecret, dateKey, "ip", ip)}`,
        limit: config.perSourceDailyCap,
      },
      {
        key: `${KEY_PREFIX}:quota:${dateKey}:session:${hashIdentifier(config.hashSecret, dateKey, "session", sessionId)}`,
        limit: config.perSourceDailyCap,
      },
    ]
    try {
      const quota = await store.consumeQuota(
        entries,
        nextJstMidnightSeconds(now) + QUOTA_EXPIRE_GRACE_SECONDS,
      )
      if (!quota.allowed) {
        const message =
          quota.index === 0
            ? "本日の AI の利用回数が、サイト全体の上限に達しました。明日（日本時間 0 時以降）にお試しください。"
            : "本日の AI の利用回数の上限に達しました。明日（日本時間 0 時以降）にお試しください。"
        return fail(
          429,
          "rate_limited",
          message,
          secondsUntilNextJstMidnight(now),
        )
      }
    } catch {
      return fail(503, "store_unavailable", UNAVAILABLE_MESSAGE)
    }

    // 8. Gemini を 1 回だけ呼ぶ（自動の再試行はしない。消費した枠は戻さない）
    let generator: AnswerGenerator
    try {
      generator = deps.getGenerator()
    } catch {
      return fail(503, "model_unavailable", UNAVAILABLE_MESSAGE)
    }
    const result = await generator.generate({ systemInstruction, prompt })
    if (!result.ok) {
      const error = GENERATE_ERRORS[result.reason]
      return fail(
        error.status,
        error.code,
        error.message,
        undefined,
        result.upstreamStatus,
      )
    }

    const answer = result.text.slice(0, ANSWER_MAX_LENGTH)
    try {
      await store.setCachedAnswer(
        cacheKey,
        { answer, references },
        CACHE_TTL_SECONDS,
      )
    } catch {
      // 回答はできているため、キャッシュに保存できなくても返す
    }

    // 9. 回答と、サーバーで決めた参照先だけを返す
    return finish(200, okBody(answer, false))
  } finally {
    try {
      await store.releaseGenerationLock(cacheKey, lockToken)
    } catch {
      // 解放できなくても、ロックは有効期限に達すると消える
    }
  }
}
