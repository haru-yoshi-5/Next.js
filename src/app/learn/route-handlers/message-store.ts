import "server-only"

export interface Message {
  id: string
  text: string
  createdAt: string
}

/** 保存しておく最大件数（デモのためメモリ使用量を抑える） */
const MAX_MESSAGES = 20

/**
 * データベースの代わりに、サーバープロセスのメモリに保存する。
 * - サーバーを再起動すると最初の状態に戻る
 * - 複数インスタンスで動かす本番環境ではインスタンス間で共有されない
 */
const messages: Message[] = [
  {
    id: "seed-2",
    text: "GET で一覧を読み取れます",
    createdAt: "2026-11-01T09:05:00.000Z",
  },
  {
    id: "seed-1",
    text: "POST でメッセージを追加できます",
    createdAt: "2026-11-01T09:00:00.000Z",
  },
]

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function listMessages(limit: number): Promise<Message[]> {
  // 実際のデータベース問い合わせを想定した待ち時間
  await wait(120)
  return messages.slice(0, limit)
}

export async function addMessage(text: string): Promise<Message> {
  await wait(200)
  const message: Message = {
    id: crypto.randomUUID(),
    text,
    createdAt: new Date().toISOString(),
  }
  messages.unshift(message)
  messages.splice(MAX_MESSAGES)
  return message
}
