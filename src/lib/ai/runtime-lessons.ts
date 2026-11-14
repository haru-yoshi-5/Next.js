/**
 * AI Runtime Detective（実行記録の解説）に対応している教材。
 * Phase 2 では、サーバーで計測した記録を返せる Server Actions の教材だけを対象にする
 */
const RUNTIME_EXPLAIN_LESSONS: ReadonlySet<string> = new Set(["server-actions"])

export function isRuntimeExplainLesson(lessonId: string) {
  return RUNTIME_EXPLAIN_LESSONS.has(lessonId)
}
