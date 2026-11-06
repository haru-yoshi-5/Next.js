import type { SalesReportDTO } from "./report"

const formatYen = (amount: number) => `${amount.toLocaleString("ja-JP")} 円`

/** 売上レポートの表。Server Component の描画と、Server Action の結果の表示で共通に使う */
export function ReportTable({ report }: { report: SalesReportDTO }) {
  return (
    <table className="w-full text-sm">
      <caption className="pb-1.5 text-left text-xs text-muted-foreground">
        {report.title}
      </caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">月</th>
          <th scope="col">売上</th>
        </tr>
      </thead>
      <tbody className="tabular-nums">
        {report.rows.map((row) => (
          <tr key={row.month} className="border-t">
            <th scope="row" className="py-1 text-left font-normal">
              {row.month}
            </th>
            <td className="py-1 text-right">{formatYen(row.amount)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot className="tabular-nums">
        <tr className="border-t font-medium">
          <th scope="row" className="py-1 text-left">
            合計
          </th>
          <td className="py-1 text-right">{formatYen(report.total)}</td>
        </tr>
      </tfoot>
    </table>
  )
}
