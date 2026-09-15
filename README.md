# NextScope

**Next.jsで作られた、Next.jsの動きを実際に確認しながら学べるWeb教材**

NextScope は、実際に動作する Next.js と処理フローの可視化を通して、Server Components や Server Actions など Next.js 特有の仕組みを理解するためのインタラクティブ教材です。

「解説を読む → 本物の機能を操作する → 裏側で起きたことを見る → 動いているコードを読む」という流れで学べます。

---

## 解決したい問題

App Router の Server Components・Server Actions・Streaming・Cache などは、ブラウザで画面を見ているだけでは次のことが分かりません。

- その処理が **どこで**（ブラウザ / サーバー）実行されているのか
- **いつ**（ビルド時 / リクエスト時 / 操作時）実行されたのか
- なぜそこに `"use client"` が必要なのか

一般的な教材はコードと文章で説明しますが、初学者にとっては「コードを読んでも実行場所が想像できない」ことが一番の壁です。NextScope はこの見えない部分を、**今操作しているアプリ自身の処理**として可視化します。

## コンセプト

### 教材ページ自体が、その技術で動いている

サンプルコードを表示するだけの教材にはしていません。各教材は、解説している機能を教材ページそのものに使っています。

| 教材              | このページ自体の作り                                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| App Router        | 教材本体を `layout.tsx` に置き、Live Demo の `children` だけが `page.tsx` / `[slug]/page.tsx` / `not-found.tsx` に切り替わる |
| Server Components | `io()` + `<Suspense>` でリクエストごとにサーバーで実行される async Server Component                                          |
| Client Components | ページは Server Component のまま、`"use client"` のカウンターだけを境界として切り出す                                        |
| Server Actions    | 本物の `"use server"` 関数でサーバー側バリデーション → データ更新 → `updateTag`                                              |
| Streaming         | 1秒 / 2秒かかる Server Component を別々の `<Suspense>` 境界で配信                                                            |

### クイズや課題は作らない

問題を解かせるのではなく、「読む・触る・見る」ことで理解する教材にしています。

## 主な機能

### Process Visualizer

操作によって発生した処理を、Browser / Next.js Server / Server Component / Server Action / Cache / Data Source などのノード間のステップとして再生します。

- **ブラウザ側 / サーバー側のゾーン**に分けてノードを表示し、ネットワークをまたぐステップを明示
- 表示する値は**実際の処理から取得**（サーバーで計測したデータ取得時間、Server Action が返した処理経路、ストリーミングの到着順など）
- ブラウザから観測できない内部処理は「**モデル図**」と明示し、実データと区別
- `prefers-reduced-motion` 対応、`aria-live` による現在ステップの読み上げ

### Inside This Page

今見ている教材ページを構成するファイルをツリーで表示し、それぞれが SERVER / CLIENT のどちらで実行されるかを示します。

**バッジは手書きではなく、各ファイルを実際に読み込み、先頭の `"use client"` / `"use server"` から判定しています。** ディレクティブのないファイルが Client Component から import される場合など、判定の根拠も表示します。

### Source Code

Live Demo を動かしている**実装ファイルそのもの**を、ビルド時に読み込んでシンタックスハイライトして表示します。表示用のコードを別に持たないため、実装と教材の内容がズレません。

### SERVER / CLIENT の表示

色だけに頼らず、**色・アイコン・文字（SERVER / CLIENT）** の3つで区別しています。

## 公開中の教材（MVP）

1. App Router（02 Routing）
2. Server Components（03 Server & Client）
3. Client Components（03 Server & Client）
4. Server Actions（04 Data）
5. Streaming（05 Rendering）

---

## 技術スタック

| 分類                   | 採用技術                                                               |
| ---------------------- | ---------------------------------------------------------------------- |
| フレームワーク         | Next.js 16（App Router / Turbopack / Cache Components）                |
| UI                     | React 19 / TypeScript（strict）                                        |
| スタイル               | Tailwind CSS v4 / shadcn/ui（Base UI） / Lucide Icons                  |
| シンタックスハイライト | shiki                                                                  |
| テーマ                 | next-themes                                                            |
| 品質管理               | ESLint（eslint-config-next） / Prettier（prettier-plugin-tailwindcss） |
| パッケージ管理         | pnpm                                                                   |

### なぜこの技術を採用したのか

- **Next.js 16 + Cache Components**
  教材の題材そのものであり、`use cache` / `io()` / Partial Prerendering という最新のレンダリングモデルを教材ページで実際に使うためです。ビルド結果でも、解説部分は静的シェル、デモ部分だけがリクエスト時にストリーミングされる構成（◐ Partial Prerender）になっています。
- **shiki をサーバーだけで使う**
  ハイライト処理は Server Component 内で完結させ、トークンをデータとして JSX で描画しています。ハイライト用の JavaScript をブラウザに送らず、`dangerouslySetInnerHTML` も使いません。
- **shadcn/ui**
  コンポーネントのソースをリポジトリに持つため、アクセシビリティの基盤（Base UI）を活かしつつ、開発者ツール風のデザインに合わせて調整できます。
- **Prettier**
  create-next-app の ESLint 構成をそのまま活かしつつ、Tailwind のクラス順を自動で揃えられる公式プラグインがあるためです。
- **データベースは導入していない**
  MVP の教材では永続化が学習目的に必要ないため、Server Actions のデモはサーバーのメモリ上のストアで動かしています（「技術を使いたいから DB を入れる」ことはしない方針）。
- **MDX ではなく TypeScript で教材データを管理**
  教材本文を段落・リスト・注意書き・比較表などの型付きブロックとして定義し、UI 側で一貫した表示にしています。HTML を解釈しないため、表示の安全性も保てます。

---

## アーキテクチャ

### ページの構成

すべての教材ページは共通の `LessonPage` で次の順に構成されます。

1. タイトル・簡潔な説明・この教材でわかること
2. 詳細解説
3. Live Demo と Process Visualizer
4. Source Code
5. Inside This Page
6. 関連教材・前後の教材

### レンダリング

`pnpm build` の結果（抜粋）:

```
┌ ○ /
├ ○ /learn
├ ○ /learn/app-router
│ ├ ◐ /learn/app-router/[slug]          ← generateStaticParams にない slug
│ ├ ○ /learn/app-router/page-file
│ ├ ○ /learn/app-router/layout-file
│ └ ○ /learn/app-router/link-component
├ ○ /learn/client-components
├ ○ /learn/server-actions
├ ◐ /learn/server-components            ← デモだけがリクエスト時に実行
└ ◐ /learn/streaming                    ← デモだけがストリーミング
```

### データの流れ（Process Visualizer）

```
Server Component / Server Action
   │  処理を実行し、計測値と処理経路を FlowTrace として組み立てる
   ▼
Client Component（props / useActionState の戻り値 / Context）
   │
   ▼
ProcessVisualizer（再生位置だけを state で持つ）
```

Visualizer に渡すデータは `FlowTrace` 型で統一しており、`source: "measured" | "model"` で実データかモデル図かを区別します。

## Server / Client 設計

基本はすべて Server Component とし、次のようにブラウザの機能が必要な場所だけを Client Component にしています。

| Client Component                      | 必要な理由                                                           |
| ------------------------------------- | -------------------------------------------------------------------- |
| `sidebar-nav.tsx`                     | `usePathname` で現在の教材をハイライト                               |
| `mobile-nav.tsx` / `theme-toggle.tsx` | 開閉状態・テーマ切り替え（イベント）                                 |
| `code-tabs.tsx`                       | タブの選択状態（コード自体はサーバーで描画済み）                     |
| `process-visualizer.tsx`              | 再生位置の state とタイマー                                          |
| 各教材のデモパネル                    | `useState` / `useActionState` / `router.refresh()` / `<Link>` の操作 |

工夫している点:

- Client Component には **Server Component の描画結果を `children` や props として渡す**構成を多用しています（例: `RefreshPanel` の中身は Server Component の結果）。
- データ取得関数は `import "server-only"` で保護し、誤って Client Component から import するとビルドエラーになります。
- Cache Components で `usePathname` が prerender を止めるルートでは、`<Suspense>` とフックを持たない fallback（`SidebarLinks`）を組み合わせています。

## ディレクトリ構成

```
src/
├ app/
│  ├ layout.tsx / page.tsx / not-found.tsx / error.tsx / global-error.tsx
│  ├ sitemap.ts / robots.ts
│  └ learn/
│     ├ layout.tsx / page.tsx / loading.tsx / error.tsx
│     ├ app-router/          # layout.tsx が教材本体、[slug] が Dynamic Route
│     ├ server-components/   # page.tsx + デモ用 Server / Client Components
│     ├ client-components/
│     ├ server-actions/      # actions.ts ("use server") / ストア / キャッシュされる一覧
│     └ streaming/           # Suspense 境界ごとの Server Components
├ components/
│  ├ layout/       # ヘッダー・サイドバー・テーマ・エラー表示
│  ├ learning/     # LessonPage / SourceCode / InsideThisPage / DemoLayout など
│  ├ visualizer/   # ProcessVisualizer / ProcessNode / ProcessEdge / RuntimeBadge
│  ├ home/         # トップページ用
│  └ ui/           # shadcn/ui
├ content/
│  ├ curriculum.ts # 章と教材の一覧
│  └ lessons/      # 教材ごとの本文・表示するファイル・Inside This Page の定義
├ hooks/
├ lib/             # source-code.ts（読み込み + ハイライト）/ measure.ts / metadata
└ types/           # lesson / lesson-content / flow
```

各教材のデモ用コンポーネントは、ルートのフォルダに**コロケーション**しています（`page.tsx` 以外のファイルは URL にならないため）。Inside This Page のツリーがそのまま実際のフォルダ構成になります。

### 教材を追加するには

1. `src/content/curriculum.ts` の対象教材を `status: "available"` にし、要約を追加
2. `src/content/lessons/<slug>.ts` に `LessonContent` を定義
3. `src/app/learn/<slug>/page.tsx` で `<LessonPage lesson={...} demo={...} />` を返す
4. デモを動かすファイルを同じフォルダに置き、`sourceFiles` / `inside.files` に登録

---

## セットアップ

必要環境: Node.js 20 以上 / pnpm 9

```bash
pnpm install
cp .env.example .env.local   # 必要に応じて NEXT_PUBLIC_SITE_URL を設定
pnpm dev
```

http://localhost:3000 を開きます。

## 開発コマンド

| コマンド                            | 内容                                        |
| ----------------------------------- | ------------------------------------------- |
| `pnpm dev`                          | 開発サーバーを起動                          |
| `pnpm build`                        | 本番ビルド（Cache Components の検証を含む） |
| `pnpm start`                        | 本番ビルドを起動                            |
| `pnpm lint`                         | ESLint                                      |
| `pnpm typecheck`                    | TypeScript の型チェック                     |
| `pnpm format` / `pnpm format:check` | Prettier による整形 / 確認                  |

## 設計上の制約と注意点

- **Server Actions のデモデータ**はサーバープロセスのメモリに保存しています。再起動で消え、複数インスタンスでは共有されません（最大8件）。
- Process Visualizer のステップ間隔（約0.65秒）は目で追うための演出です。実際の処理時間は各ステップの計測値で示しています。
- App Router 教材の遷移フローは、RSC Payload のやり取りをブラウザから直接観測できないため「モデル図」として表示しています（URL と `useSelectedLayoutSegment()` の値は実データ）。

## 今後追加する予定の教材

- 01 Introduction: Next.jsとは / Reactとの関係 / Next.jsを使う理由
- 02 Routing: Dynamic Routes
- 03 Server & Client: Server / Client Boundary
- 04 Data: Data Fetching / Route Handlers
- 05 Rendering: Static / Dynamic
- 06 Cache: Next.js Cache / Revalidation（revalidatePath / revalidateTag）
- 07 Error Handling: error.tsx / not-found.tsx / loading.tsx
- 08 Authentication: 認証の考え方 / サーバー側での認証 / 保護されたページ

将来的な学習履歴・お気に入り機能に備え、教材データ（`content/`）と表示（`components/learning/`）を分離し、認証を後から追加できる構成にしています。
