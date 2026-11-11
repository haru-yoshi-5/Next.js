import { readAiConfig, type AiConfig } from "@/lib/ai/config"
import { handleExplain } from "@/lib/ai/explain"
import { type AnswerGenerator, createGeminiGenerator } from "@/lib/ai/gemini"
import {
  type AiStore,
  createMemoryStore,
  createRedisStore,
  createUpstashClient,
} from "@/lib/ai/store"

/** Gemini の待ち時間（20 秒）に余裕を持たせた、処理全体の上限（秒） */
export const maxDuration = 30

let store: { key: string; value: AiStore } | null = null
let generator: { key: string; value: AnswerGenerator } | null = null

/** 保存先は設定ごとに 1 つだけ作る。保存先が未設定（開発中だけ許可）ならメモリを使う */
function getStore(config: AiConfig) {
  const key = config.redis ? config.redis.url : "memory"
  if (store?.key !== key) {
    store = {
      key,
      value: config.redis
        ? createRedisStore(
            createUpstashClient(config.redis.url, config.redis.token),
          )
        : createMemoryStore(),
    }
  }
  return store.value
}

function getGenerator(config: AiConfig) {
  const key = config.model
  if (generator?.key !== key) {
    generator = {
      key,
      value: createGeminiGenerator({
        apiKey: config.apiKey,
        model: config.model,
      }),
    }
  }
  return generator.value
}

/**
 * POST /api/ai/explain
 * 利用者が AI パネルで送信したときだけ呼ばれる。GET などは定義せず、Next.js が 405 を返す。
 */
export async function POST(request: Request) {
  const config = readAiConfig()
  return handleExplain(request, {
    config,
    isProduction: process.env.NODE_ENV === "production",
    getStore: () => {
      if (config.status !== "ready") throw new Error("AI 機能が無効です")
      return getStore(config.config)
    },
    getGenerator: () => {
      if (config.status !== "ready") throw new Error("AI 機能が無効です")
      return getGenerator(config.config)
    },
    now: () => new Date(),
    log: (entry) => console.info("[ai/explain]", JSON.stringify(entry)),
  })
}
