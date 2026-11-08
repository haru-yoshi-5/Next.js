import "server-only"

import { measure } from "@/lib/measure"

import { type Author, getAuthor, getPosts, type Post } from "./data-source"

/** 1回のデータ取得の記録。時間はこの取得方法の開始からの経過時間 */
export interface FetchCall {
  name: string
  startMs: number
  durationMs: number
}

export interface FetchRun {
  author: Author
  posts: Post[]
  calls: FetchCall[]
  totalMs: number
}

/** 取得を実行し、開始した時間と所要時間を記録する */
async function record<T>(
  name: string,
  origin: number,
  task: () => Promise<T>,
): Promise<{ result: T; call: FetchCall }> {
  const startMs = performance.now() - origin
  const { result, durationMs } = await measure(task)
  return { result, call: { name, startMs, durationMs } }
}

/** 直列: 1つ目の await が終わるまで、2つ目は開始されない */
export async function fetchSequentially(): Promise<FetchRun> {
  const origin = performance.now()

  const author = await record("getAuthor()", origin, getAuthor)
  const posts = await record("getPosts()", origin, getPosts)

  return {
    author: author.result,
    posts: posts.result,
    calls: [author.call, posts.call],
    totalMs: performance.now() - origin,
  }
}

/** 並列: 2つを先に開始してから、Promise.all でまとめて待つ */
export async function fetchInParallel(): Promise<FetchRun> {
  const origin = performance.now()

  const [author, posts] = await Promise.all([
    record("getAuthor()", origin, getAuthor),
    record("getPosts()", origin, getPosts),
  ])

  return {
    author: author.result,
    posts: posts.result,
    calls: [author.call, posts.call],
    totalMs: performance.now() - origin,
  }
}
