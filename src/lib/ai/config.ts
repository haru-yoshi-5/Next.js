import "server-only"

/** 秘密の値（IP アドレスのハッシュと Cookie の署名に使う）に求める最小の長さ */
const HASH_SECRET_MIN_LENGTH = 32
const DEFAULT_DAILY_CAP = 20
const DEFAULT_PER_SOURCE_DAILY_CAP = 3

export interface AiConfig {
  apiKey: string
  model: string
  /** サイト全体の 1 日（日本時間）の上限 */
  dailyCap: number
  /** 送信元（IP アドレス・匿名 Cookie）ごとの 1 日の上限 */
  perSourceDailyCap: number
  hashSecret: string
  /** 利用制限とキャッシュの保存先。開発中は未設定でもよい（メモリで代用する） */
  redis: { url: string; token: string } | null
}

export type AiConfigResult =
  | { status: "ready"; config: AiConfig }
  | { status: "disabled" }
  | { status: "unconfigured"; problems: string[] }

type Env = Record<string, string | undefined>

/** 正の整数として読む。未設定なら既定値、形式が正しくなければ null */
function readPositiveInt(value: string | undefined, fallback: number) {
  if (value === undefined || value.trim() === "") return fallback
  if (!/^\d+$/.test(value.trim())) return null
  const parsed = Number.parseInt(value, 10)
  return parsed > 0 ? parsed : null
}

/**
 * AI 機能の設定を環境変数から読む。
 * 値が欠けていても例外にはせず、AI 機能だけを使えない状態として返す（教材やデモには影響させない）。
 * problems には環境変数の名前だけを入れ、値は入れない。
 */
export function readAiConfig(
  env: Env = process.env,
  isProduction = env.NODE_ENV === "production",
): AiConfigResult {
  if (env.NEXTSCOPE_AI_ENABLED !== "true") return { status: "disabled" }

  const problems: string[] = []
  const apiKey = env.GEMINI_API_KEY?.trim() ?? ""
  const model = env.GEMINI_MODEL?.trim() ?? ""
  const hashSecret = env.NEXTSCOPE_AI_HASH_SECRET ?? ""
  const dailyCap = readPositiveInt(
    env.NEXTSCOPE_AI_DAILY_REQUEST_CAP,
    DEFAULT_DAILY_CAP,
  )
  const perSourceDailyCap = readPositiveInt(
    env.NEXTSCOPE_AI_PER_SOURCE_DAILY_CAP,
    DEFAULT_PER_SOURCE_DAILY_CAP,
  )
  const redisUrl = env.UPSTASH_REDIS_REST_URL?.trim() ?? ""
  const redisToken = env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? ""

  if (!apiKey) problems.push("GEMINI_API_KEY")
  if (!model) problems.push("GEMINI_MODEL")
  if (hashSecret.length < HASH_SECRET_MIN_LENGTH) {
    problems.push("NEXTSCOPE_AI_HASH_SECRET")
  }
  if (dailyCap === null) problems.push("NEXTSCOPE_AI_DAILY_REQUEST_CAP")
  if (perSourceDailyCap === null) {
    problems.push("NEXTSCOPE_AI_PER_SOURCE_DAILY_CAP")
  }

  const hasRedis = redisUrl !== "" && redisToken !== ""
  // 本番では、インスタンスをまたいで効く保存先がなければ AI を公開しない
  if (isProduction && !hasRedis) {
    problems.push("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN")
  }

  if (problems.length > 0 || dailyCap === null || perSourceDailyCap === null) {
    return { status: "unconfigured", problems }
  }

  return {
    status: "ready",
    config: {
      apiKey,
      model,
      dailyCap,
      perSourceDailyCap,
      hashSecret,
      redis: hasRedis ? { url: redisUrl, token: redisToken } : null,
    },
  }
}
