import "server-only"

/** AI 機能を提供する国（Gemini API 規約の地域条件と、利用者の想定から日本だけにする） */
const ALLOWED_COUNTRY = "JP"

/**
 * 国コード（Vercel が付ける x-vercel-ip-country）から、AI を使ってよい地域かを判定する。
 * 本番では JP のときだけ許可し、ヘッダーがない・不正などで判定できないときも断る。
 * 開発中は判定を省く。
 * 国は IP アドレスからの推定のため、VPN などで外れることがある。
 */
export function isAllowedRegion(country: string | null, isProduction: boolean) {
  if (!isProduction) return true
  return country === ALLOWED_COUNTRY
}
