import "server-only"

import { createHash, createHmac } from "node:crypto"

import { errors, jwtVerify, SignJWT } from "jose"

import { serializeTraceSummary, type TraceSummary } from "@/lib/tracing/adapter"

/** 署名付きトークンの有効期間（秒） */
const TRACE_TOKEN_TTL_SECONDS = 10 * 60
const ISSUER = "nextscope"
const AUDIENCE = "runtime_explain"

/**
 * 署名の鍵。匿名 Cookie の署名と同じ秘密の値から、用途ごとに別の鍵を作る
 * （Cookie の署名をトークンとして、またはその逆に使い回せないようにする）
 */
function signingKey(secret: string) {
  return new Uint8Array(
    createHmac("sha256", secret)
      .update("nextscope:runtime-trace-token:v1")
      .digest(),
  )
}

/** 要約のハッシュ（キャッシュのキーとトークンに入れる） */
function hashTraceSummary(summary: TraceSummary) {
  return createHash("sha256")
    .update(serializeTraceSummary(summary))
    .digest("base64url")
}

interface IssueInput {
  secret: string
  sessionId: string
  summary: TraceSummary
  now: Date
}

/**
 * 実行記録の要約に署名する（Server Action で実行する）。
 * トークンに入れるのは、教材 ID・実行 ID（traceId）・匿名のセッション ID・発行時刻・要約のハッシュだけ
 */
export async function issueTraceToken({
  secret,
  sessionId,
  summary,
  now,
}: IssueInput) {
  const issuedAt = Math.floor(now.getTime() / 1000)
  return new SignJWT({
    lid: summary.lessonId,
    sid: sessionId,
    sh: hashTraceSummary(summary),
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setJti(summary.traceId)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + TRACE_TOKEN_TTL_SECONDS)
    .sign(signingKey(secret))
}

export type TraceTokenCheck =
  | { ok: true; summaryHash: string }
  | { ok: false; reason: "expired" | "invalid" }

interface VerifyInput extends IssueInput {
  token: string
  /** リクエストで指定された教材 ID */
  lessonId: string
}

/**
 * 送られてきた要約とトークンを確かめる（AI の API で実行する）。次のすべてが合うときだけ ok
 * - 署名が正しい（HS256 だけを受け付ける）・有効期限内
 * - 教材 ID が、リクエスト・要約と一致する
 * - セッション ID が、リクエストの匿名 Cookie と一致する
 * - 実行 ID（traceId）が、要約と一致する
 * - 送られてきた要約のハッシュが、トークンの中のハッシュと一致する
 */
export async function verifyTraceToken({
  secret,
  sessionId,
  summary,
  now,
  token,
  lessonId,
}: VerifyInput): Promise<TraceTokenCheck> {
  let payload: Record<string, unknown>
  try {
    const result = await jwtVerify(token, signingKey(secret), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
      currentDate: now,
      requiredClaims: ["jti", "iat", "exp"],
    })
    payload = result.payload
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      return { ok: false, reason: "expired" }
    }
    return { ok: false, reason: "invalid" }
  }

  const summaryHash = hashTraceSummary(summary)
  const matches =
    payload.lid === lessonId &&
    summary.lessonId === lessonId &&
    payload.sid === sessionId &&
    payload.jti === summary.traceId &&
    payload.sh === summaryHash
  return matches ? { ok: true, summaryHash } : { ok: false, reason: "invalid" }
}
