/**
 * 非同期処理の所要時間を計測する。
 * コンポーネントの描画処理を純粋に保つため、時刻の取得はこの関数の中に閉じ込める。
 */
export async function measure<T>(
  task: () => Promise<T>,
): Promise<{ result: T; durationMs: number }> {
  const start = performance.now()
  const result = await task()
  return { result, durationMs: performance.now() - start }
}
