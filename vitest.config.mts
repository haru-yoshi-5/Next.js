import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: [
      // server-only は Next.js のビルドでサーバー境界を確かめるためのもの。
      // テストでは空のモジュールに置き換える（境界の確認は next build で行う）
      {
        find: /^server-only$/,
        replacement: fileURLToPath(
          new URL("./src/test/server-only-stub.ts", import.meta.url),
        ),
      },
      {
        find: /^@\//,
        replacement: fileURLToPath(new URL("./src/", import.meta.url)),
      },
    ],
  },
  test: {
    // 画面を描画するテスト（*.test.tsx）は、ファイルの先頭で jsdom 環境を指定する
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
})
