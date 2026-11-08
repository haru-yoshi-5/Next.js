import {
  ArchiveIcon,
  ComponentIcon,
  DatabaseIcon,
  GlobeIcon,
  LayersIcon,
  type LucideIcon,
  ServerIcon,
  ShieldCheckIcon,
  WaypointsIcon,
  ZapIcon,
} from "lucide-react"

import type { FlowNodeId } from "@/types/flow"
import type { Runtime } from "@/types/lesson"

export interface FlowNodeDefinition {
  label: string
  runtime: Runtime
  description: string
  Icon: LucideIcon
}

export const flowNodes: Record<FlowNodeId, FlowNodeDefinition> = {
  browser: {
    label: "Browser",
    runtime: "client",
    description: "ユーザーのブラウザ。HTML の表示とイベント処理を行う",
    Icon: GlobeIcon,
  },
  "client-component": {
    label: "Client Component",
    runtime: "client",
    description: "ブラウザで state やイベントを扱うコンポーネント",
    Icon: ComponentIcon,
  },
  "next-server": {
    label: "Next.js Server",
    runtime: "server",
    description: "リクエストを受け取りルーティングとレンダリングを行う",
    Icon: ServerIcon,
  },
  proxy: {
    label: "Proxy",
    runtime: "server",
    description:
      "proxy.ts。ページを描画する前に、リクエストを通すか振り分けるかを決める",
    Icon: ShieldCheckIcon,
  },
  "server-component": {
    label: "Server Component",
    runtime: "server",
    description: "サーバーでのみ実行され、結果だけを送るコンポーネント",
    Icon: LayersIcon,
  },
  "server-action": {
    label: "Server Action",
    runtime: "server",
    description: '"use server" で定義され、POST で呼び出される関数',
    Icon: ZapIcon,
  },
  "route-handler": {
    label: "Route Handler",
    runtime: "server",
    description: "route.ts で定義する HTTP エンドポイント",
    Icon: WaypointsIcon,
  },
  cache: {
    label: "Cache",
    runtime: "server",
    description: '"use cache" で保存された結果',
    Icon: ArchiveIcon,
  },
  "data-source": {
    label: "Data Source",
    runtime: "server",
    description: "データベースや外部 API などのデータ取得元",
    Icon: DatabaseIcon,
  },
}
