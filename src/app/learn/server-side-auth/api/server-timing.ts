/** サーバーで計測した時間を、ブラウザから読める Server-Timing ヘッダーの値にする */
export function serverTiming(timings: Record<string, number>): string {
  return Object.entries(timings)
    .map(([name, ms]) => `${name};dur=${ms.toFixed(1)}`)
    .join(", ")
}
