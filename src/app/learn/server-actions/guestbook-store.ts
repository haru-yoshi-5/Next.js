import "server-only"

export interface GuestbookEntry {
  id: string
  name: string
  createdAt: string
}

/** 一覧に残す最大件数（デモのためメモリ使用量を抑える） */
const MAX_ENTRIES = 8

/**
 * データベースの代わりに、サーバープロセスのメモリに保存する。
 * - サーバーを再起動すると消える
 * - 複数インスタンスで動かす本番環境ではインスタンス間で共有されない
 * 教材としてデータベースの導入は必須ではないため、あえて最小構成にしている。
 */
const entries: GuestbookEntry[] = []

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function readEntries() {
  await wait(150)
  return { entries: entries.slice(), readAt: new Date() }
}

export async function addEntry(name: string): Promise<GuestbookEntry> {
  await wait(250)

  // デモ用: 「error」という名前でデータ更新の失敗を再現する
  if (name.toLowerCase() === "error") {
    throw new Error("デモ用に意図的に発生させたデータ更新エラー")
  }

  const entry: GuestbookEntry = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
  }
  entries.unshift(entry)
  entries.splice(MAX_ENTRIES)
  return entry
}
