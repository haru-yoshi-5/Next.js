import "server-only"

import { createHash } from "node:crypto"

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
  PROMPT_VERSION,
  SYSTEM_INSTRUCTION,
} from "./prompts"
import { isAllowedRegion } from "./region"
import {
  BODY_MAX_BYTES,
  parseExplainRequest,
  readBodyWithLimit,
} from "./request"
import type { AiStore, QuotaEntry } from "./store"
import {
  jstDateKey,
  nextJstMidnightSeconds,
  secondsUntilNextJstMidnight,
} from "./time"

/** キャッシュの保存期間（秒） */
const CACHE_TTL_SECONDS = 60 * 60
/** 利用制限のキーを、日付が変わってから消すまでの猶予（秒） */
const QUOTA_EXPIRE_GRACE_SECONDS = 60 * 60
/** 回答として返す最大文字数 */
const ANSWER_MAX_LENGTH = 4000
const KEY_PREFIX = "nextscope:ai"

export const AI_NOTICE =
  "AI が生成した解説です。誤りを含むことがあります。教材の本文とあわせて確認してください。"

export type ExplainErrorCode =
  | "disabled"
  | "region_not_supported"
  | "payload_too_large"
  | "invalid_request"
  | "sensitive_content"
  | "rate_limited"
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

/** 同じ教材・同じ質問・同じ指示・同じモデルのときだけ一致するキャッシュのキー */
export function buildCacheKey(input: {
  model: string
  mode: string
  lessonId: string
  question: string
}) {
  const digest = createHash("sha256")
    .update(
      JSON.stringify([
        PROMPT_VERSION,
        input.model,
        input.mode,
        input.lessonId,
        normalizeQuestion(input.question),
      ]),
    )
    .digest("base64url")
  return `${KEY_PREFIX}:cache:${digest}`
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
      parsed.status === 413 ? "payload_too_large" : "invalid_request",
      parsed.message,
    )
  }
  const { lesson, question } = parsed.value
  logContext.lessonId = lesson.slug
  logContext.mode = parsed.value.mode

  // 4. 送る内容の検査
  if (findSensitiveContent(question).length > 0) {
    return fail(
      400,
      "sensitive_content",
      "個人情報や秘密情報（メールアドレス・電話番号・API キーなど）らしい内容が含まれているため、送信しませんでした。該当する部分を削除してから、もう一度お試しください。",
    )
  }

  // 5. 教材の内容と参照先は、サーバーで教材 ID から組み立てる
  const references = buildLessonReferences(lesson)
  const cacheKey = buildCacheKey({
    model: config.model,
    mode: parsed.value.mode,
    lessonId: lesson.slug,
    question,
  })

  const now = deps.now()
  let store: AiStore

  // 6. キャッシュ（保存先が使えなければ AI を止める）
  try {
    store = deps.getStore()
    const cached = await store.getCachedAnswer(cacheKey)
    if (cached) {
      return finish(
        200,
        {
          status: "ok",
          answer: cached.answer,
          references,
          cached: true,
          notice: AI_NOTICE,
        },
        { cached: true },
      )
    }
  } catch {
    return fail(503, "store_unavailable", UNAVAILABLE_MESSAGE)
  }

  // 7. 利用制限（サイト全体・IP アドレス・匿名 Cookie を別々に数える）
  const dateKey = jstDateKey(now)
  let sessionId = verifySessionCookie(
    config.hashSecret,
    readSessionCookie(request.headers),
  )
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
  const result = await generator.generate({
    systemInstruction: SYSTEM_INSTRUCTION,
    prompt: buildContextTutorPrompt(buildLessonContext(lesson), question),
  })
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
  return finish(200, {
    status: "ok",
    answer,
    references,
    cached: false,
    notice: AI_NOTICE,
  })
}
