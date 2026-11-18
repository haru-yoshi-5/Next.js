import "server-only"

export type SensitiveKind =
  "email" | "phone" | "card-number" | "api-key" | "random-token"

/**
 * 電話番号の区切りとして取り除く文字。
 * ハイフン類（NFKC で半角にならない「−」「ー」なども含む）・空白・括弧
 */
const PHONE_SEPARATORS = /[-\s()‐-―−ーｰ]/g
/** 区切りを除いた後の日本の電話番号（0 または国番号 +81 で始まる 10〜11 桁） */
const COMPACT_PHONE = /(?<!\d)(?:\+81|0)\d{9,10}(?!\d)/

const PATTERNS: { kind: SensitiveKind; pattern: RegExp }[] = [
  { kind: "email", pattern: /[\w.+-]+@[\w-]+(\.[\w-]+)+/ },
  // クレジットカード番号らしい数字の並び（13〜19 桁。区切りあり・なし）
  { kind: "card-number", pattern: /(?<!\d)(\d[ -]?){12,18}\d(?!\d)/ },
  // よく使われる API キー・トークンの形式
  {
    kind: "api-key",
    pattern:
      /\b(sk-[\w-]{16,}|AIza[\w-]{30,}|gh[pousr]_\w{30,}|xox[abpr]-[\w-]{10,}|AKIA[0-9A-Z]{16})\b/,
  },
]

/** 英字と数字が混ざった、32 文字以上の区切りのない文字列（秘密の値らしいもの） */
const LONG_TOKEN = /[A-Za-z0-9_\-+/=]{32,}/g

function hasRandomToken(text: string) {
  for (const match of text.matchAll(LONG_TOKEN)) {
    const token = match[0]
    if (/[A-Za-z]/.test(token) && /\d/.test(token)) return true
  }
  return false
}

/**
 * 送る前に、個人情報や秘密情報らしい内容を検出する。
 * パターンによる検出のため、氏名や住所などの文章はすべては見つけられない（画面の注意と併用する）。
 */
export function findSensitiveContent(text: string): SensitiveKind[] {
  const normalized = text.normalize("NFKC")
  const kinds = PATTERNS.filter(({ pattern }) => pattern.test(normalized)).map(
    ({ kind }) => kind,
  )
  // 電話番号は、区切り・括弧を除いてから調べる。
  // 例: 03-1234-5678、090 1234 5678、090(1234)5678、+81-90-1234-5678
  if (COMPACT_PHONE.test(normalized.replace(PHONE_SEPARATORS, ""))) {
    kinds.push("phone")
  }
  if (!kinds.includes("api-key") && hasRandomToken(normalized)) {
    kinds.push("random-token")
  }
  return kinds
}
