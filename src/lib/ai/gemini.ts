import "server-only"

import { ApiError, GoogleGenAI } from "@google/genai"

/** Gemini の応答を待つ最大の時間（ミリ秒）。中断しても Gemini 側の処理と利用枠は止まらない */
const GEMINI_TIMEOUT_MS = 20_000
/** 回答の最大トークン数（無料枠の使用量を抑える） */
const MAX_OUTPUT_TOKENS = 1024

export type GenerateResult =
  | { ok: true; text: string }
  | {
      ok: false
      reason:
        | "timeout"
        | "rate_limited"
        | "model_unavailable"
        | "no_answer"
        | "upstream_error"
      /** Gemini が返した HTTP ステータス（ログで原因を見分けるため。本文やメッセージは持たない） */
      upstreamStatus?: number
    }

export interface GenerateInput {
  systemInstruction: string
  prompt: string
}

/** 回答を作る処理。テストでは偽物に差し替える */
export interface AnswerGenerator {
  generate(input: GenerateInput): Promise<GenerateResult>
}

/** SDK のエラーを、画面で説明できる理由に分類する */
export function classifyGeminiError(
  error: unknown,
  signal: AbortSignal,
): GenerateResult {
  if (signal.aborted) return { ok: false, reason: "timeout" }
  if (error instanceof ApiError) {
    const upstreamStatus = error.status
    if (upstreamStatus === 429) {
      return { ok: false, reason: "rate_limited", upstreamStatus }
    }
    // 設定の誤りで、送り直しても直らないもの。
    // モデル名の誤り（400。例: 表示名の「Gemini 2.5 Flash」を指定した）・廃止（404）、キーの権限（401 / 403）
    if ([400, 401, 403, 404].includes(upstreamStatus)) {
      return { ok: false, reason: "model_unavailable", upstreamStatus }
    }
    return { ok: false, reason: "upstream_error", upstreamStatus }
  }
  return { ok: false, reason: "upstream_error" }
}

/**
 * Gemini API を呼ぶ処理を 1 か所にまとめる。サーバーでだけ使う（server-only）。
 * - SDK の自動の再試行は使わない（retryOptions を渡さない。利用枠の二重消費を防ぐ）
 * - API キーはここでだけ使い、ログやエラーに出さない
 */
export function createGeminiGenerator(options: {
  apiKey: string
  model: string
}): AnswerGenerator {
  const ai = new GoogleGenAI({ apiKey: options.apiKey })

  return {
    async generate({ systemInstruction, prompt }) {
      const signal = AbortSignal.timeout(GEMINI_TIMEOUT_MS)
      try {
        const response = await ai.models.generateContent({
          model: options.model,
          contents: prompt,
          config: {
            systemInstruction,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            abortSignal: signal,
          },
        })
        const text = response.text?.trim()
        return text ? { ok: true, text } : { ok: false, reason: "no_answer" }
      } catch (error) {
        return classifyGeminiError(error, signal)
      }
    },
  }
}
