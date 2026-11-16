import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Cache Components: `use cache` / `io()` / Partial Prerendering を有効化する。
  // 教材で解説している Next.js 16 のレンダリングモデルを、このサイト自体でも使うため。
  cacheComponents: true,
  // Source Code / Inside This Page は実ファイルを読み込んで表示するため、
  // デプロイ先のサーバーバンドルにもソースファイルを含める。
  outputFileTracingIncludes: {
    "/api/ai/explain": [
      "./src/app/learn/server-actions/actions.ts",
      "./src/app/learn/server-actions/guestbook-list.tsx",
      "./src/app/learn/server-actions/name-form.tsx",
    ],
    "/learn/**": [
      // Root Layout など src/app 直下のファイル（Inside This Page と「Next.jsとは」のデモで読む）
      "./src/app/*.tsx",
      "./src/app/learn/**/*",
      "./src/components/**/*",
      "./src/lib/auth-demo/**/*",
    ],
  },
}

export default nextConfig
