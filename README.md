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

| 教材                     | このページ自体の作り                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Next.jsとは              | URL の区切りごとに `src/app` の特別なファイルをサーバーで探し、このページの HTML・RSC Payload・JavaScript を取得し直して数える                   |
| Reactとの関係            | package.json の版と、サーバー・ブラウザの `React.version` を並べ、`router.refresh()` の後も state が残るかを確かめる                             |
| Next.jsを使う理由        | フォントの取得記録・`<head>` のメタデータ・`/sitemap.xml`・`/robots.txt` を調べ、出力した仕組みとファイルに結び付ける                            |
| App Router               | 教材本体を `layout.tsx` に置き、Live Demo の `children` だけが `page.tsx` / `[slug]/page.tsx` / `not-found.tsx` に切り替わる                     |
| Dynamic Routes           | `articles/[id]` を `generateStaticParams` で一部だけプリレンダーし、3種類の値でページの届き方を HTML から判定                                    |
| Server Components        | `io()` + `<Suspense>` でリクエストごとにサーバーで実行される async Server Component                                                              |
| Client Components        | ページは Server Component のまま、`"use client"` のカウンターだけを境界として切り出す                                                            |
| Server / Client Boundary | `children` で Server Component の出力を Client Component に置き、届いた応答と JavaScript を検索して確かめる                                      |
| Data Fetching            | async Server Component で同じ取得を直列と `Promise.all` で実行し、実測した開始時間と所要時間を表示                                               |
| Server Actions           | 本物の `"use server"` 関数でサーバー側バリデーション → データ更新 → `updateTag`                                                                  |
| Route Handlers           | 同じフォルダの `api/route.ts` へ `fetch()` し、GET / POST の応答と、未定義の PUT に返る 405 を表示                                               |
| Streaming                | 1秒 / 2秒かかる Server Component を別々の `<Suspense>` 境界で配信                                                                                |
| Static / Dynamic         | `"use cache"` の値を静的シェルに、`io()` 後の値を `<Suspense>` に置き、ページの応答から到着時間を計測                                            |
| error.tsx                | 教材本体を `layout.tsx` に置き、Server Action で起こした一時的な障害を `error.tsx` が受け止め、`retry()` / `reset()` で回復できるかを比べる      |
| not-found.tsx            | `items/[id]` / `orders/[id]` / `proxy.ts` / 一致しない URL を取得し、ステータスと、見えないフレームで実際に表示されたファイルを調べる            |
| loading.tsx              | 教材本体を `layout.tsx` に置き、`loading.tsx` あり / なし / page 内の `<Suspense>` の3ページへ遷移して、待ちの表示と内容が出るまでを計測         |
| Next.js Cache            | 同じ処理をキャッシュなしと `"use cache: remote"` で実行し、生成時刻から読み取り前の結果かを判定                                                  |
| Revalidation             | 本物の Server Action で `updateTag` / `revalidateTag` / `revalidatePath` を実行し、生成IDの変化を表示                                            |
| Authenticationの考え方   | `jose` で署名した cookie のセッションを Server Action のたびにサーバーで検証し、認証（誰か）と認可（権限）の判定を分けて表示                     |
| サーバー側での認証       | 認証・認可を確かめる `readSalesReport()` を Server Component・Server Action・`api/report/route.ts` から呼び、確認を忘れた Route Handler と比べる |
| 保護されたページ         | 教材本体を `layout.tsx` に置き、ページの中の `redirect()` と `proxy.ts` で守った会員ページを取得して、リダイレクトのされ方と HTML の中身を調べる |

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

1. Next.jsとは（01 Introduction）
2. Reactとの関係（01 Introduction）
3. Next.jsを使う理由（01 Introduction）
4. App Router（02 Routing）
5. Dynamic Routes（02 Routing）
6. Server Components（03 Server & Client）
7. Client Components（03 Server & Client）
8. Server / Client Boundary（03 Server & Client）
9. Data Fetching（04 Data）
10. Server Actions（04 Data）
11. Route Handlers（04 Data）
12. Streaming（05 Rendering）
13. Static / Dynamic（05 Rendering）
14. Next.js Cache（06 Cache）
15. Revalidation（06 Cache）
16. error.tsx（07 Error Handling）
17. not-found.tsx（07 Error Handling）
18. loading.tsx（07 Error Handling）
19. Authenticationの考え方（08 Authentication）
20. サーバー側での認証（08 Authentication）
21. 保護されたページ（08 Authentication）

---

## 技術スタック

| 分類                   | 採用技術                                                               |
| ---------------------- | ---------------------------------------------------------------------- |
| フレームワーク         | Next.js 16（App Router / Turbopack / Cache Components）                |
| UI                     | React 19 / TypeScript（strict）                                        |
| スタイル               | Tailwind CSS v4 / shadcn/ui（Base UI） / Lucide Icons                  |
| シンタックスハイライト | shiki                                                                  |
| セッションの署名       | jose（Authentication 章の認証デモだけで使用）                          |
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
  MVP の教材では永続化が学習目的に必要ないため、Server Actions のデモはサーバーのメモリ上のストアで動かしています（「技術を使いたいから DB を入れる」ことはしない方針）。認証デモのユーザーもコード内の固定データで、ログインの状態は署名付きの cookie だけで持ちます。
- **認証デモは jose で署名し、認証ライブラリは入れていない**
  教材の主題は「サーバーで認証・認可を確かめること」なので、セッションの署名と検証だけを Next.js のドキュメントでも紹介されている `jose` に任せています。署名の処理を自作するより実装ミスの余地が小さく、OAuth などを含む認証ライブラリほど大きくありません。サイト全体のログインはまだ作らず、デモの中だけで完結させています。
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
├ ◐ /learn/authentication-basics        ← cookie を検証するデモだけがリクエスト時に実行
├ ○ /learn/client-components
├ ◐ /learn/data-fetching                ← デモだけがリクエスト時に実行
├ ○ /learn/dynamic-routes               ← デモはブラウザから記事ページを取得
│ ├ ◐ /learn/dynamic-routes/articles/[id] ← App Shell（generateStaticParams にない値）
│ ├ ○ /learn/dynamic-routes/articles/1
│ ├ ○ /learn/dynamic-routes/articles/2
│ └ ○ /learn/dynamic-routes/articles/3
├ ◐ /learn/error-file                   ← layout.tsx が教材本体、レポートだけがリクエスト時に実行
├ ○ /learn/loading-file                 ← layout.tsx が教材本体
│ ├ ◐ /learn/loading-file/with-loading    ← 遅い部分だけがリクエスト時に実行
│ ├ ◐ /learn/loading-file/without-loading
│ └ ◐ /learn/loading-file/with-suspense
├ ◐ /learn/nextjs-cache                 ← デモだけがリクエスト時に実行
├ ◐ /learn/protected-pages              ← layout.tsx が教材本体、ユーザーの表示だけがリクエスト時に実行
│ ├ ◐ /learn/protected-pages/login        ← ?next= とセッションの確認だけがリクエスト時に実行
│ ├ ◐ /learn/protected-pages/members      ← 見出しは静的、確認とお知らせはリクエスト時（未ログインなら redirect()）
│ └ ◐ /learn/protected-pages/proxied      ← members と同じ。描画の前に proxy.ts も確かめる
├ ◐ /learn/react-and-nextjs             ← デモのサーバー生成IDだけがリクエスト時に実行
├ ○ /learn/not-found-file               ← デモはブラウザからデモのページを取得
│ ├ ◐ /learn/not-found-file/items/[id]  ← 存在しない商品（notFound() で 200 + noindex）
│ ├ ○ /learn/not-found-file/items/1
│ ├ ◐ /learn/not-found-file/orders/[id] ← 存在しない注文（親フォルダの not-found.tsx）
│ └ ○ /learn/not-found-file/orders/101
├ ◐ /learn/revalidation                 ← デモだけがリクエスト時に実行
├ ○ /learn/route-handlers               ← デモはブラウザから Route Handler を呼ぶ
├ ƒ /learn/route-handlers/api           ← Route Handler（request を読むため毎回実行）
├ ◐ /learn/server-client-boundary       ← デモだけがリクエスト時に実行
├ ○ /learn/server-actions
├ ◐ /learn/server-components            ← デモだけがリクエスト時に実行
├ ◐ /learn/server-side-auth             ← cookie を読んでレポートを描画する部分だけがリクエスト時に実行
├ ƒ /learn/server-side-auth/api/report  ← 認証・認可を確かめる Route Handler（cookie を読むため毎回実行）
├ ƒ /learn/server-side-auth/api/unguarded ← 確認を忘れた Route Handler（悪い例）
├ ◐ /learn/static-and-dynamic           ← デモの一部だけがリクエスト時に実行
├ ◐ /learn/streaming                    ← デモだけがストリーミング
├ ○ /learn/what-is-nextjs               ← ファイル一覧はプリレンダー時、調査はブラウザから
├ ○ /learn/why-nextjs                   ← 期待する値はプリレンダー時、調査はブラウザから
└ ƒ Proxy (Middleware)                  ← /learn/not-found-file/checked/:id と /learn/protected-pages/proxied だけで動く
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
│     ├ dynamic-routes/      # articles/[id]（page / loading / not-found）と届き方の計測
│     ├ server-components/   # page.tsx + デモ用 Server / Client Components
│     ├ client-components/
│     ├ data-fetching/       # 直列 / 並列の取得と、実測のタイムライン
│     ├ server-actions/      # actions.ts ("use server") / ストア / キャッシュされる一覧
│     ├ route-handlers/      # api/route.ts（Route Handler）と、fetch() で呼び出すデモ
│     ├ streaming/           # Suspense 境界ごとの Server Components
│     ├ static-and-dynamic/  # 静的シェルとリクエスト時の部分、到着時間の計測
│     ├ error-file/          # layout.tsx が教材本体、error.tsx と障害を起こす Server Action
│     ├ not-found-file/      # items/[id]（not-found あり）/ orders/[id]（なし）と、表示されたファイルの判定
│     ├ loading-file/        # layout.tsx が教材本体、loading.tsx あり / なし / Suspense の3ページ
│     ├ nextjs-cache/        # キャッシュあり / なしの比較と再利用の判定
│     ├ revalidation/        # 失効の Server Action とタグ付きキャッシュ
│     ├ server-client-boundary/ # children の組み合わせと境界の検査
│     ├ authentication-basics/  # デモのログインと、認証・認可を確かめる Server Action
│     ├ server-side-auth/       # 同じ確認を3つの入口から呼ぶデモと、確認を忘れた Route Handler
│     └ protected-pages/        # layout.tsx が教材本体、ログインページと、ページ / proxy で守る会員ページ
├ components/
│  ├ layout/       # ヘッダー・サイドバー・テーマ・エラー表示
│  ├ learning/     # LessonPage / SourceCode / InsideThisPage / DemoLayout など
│  ├ visualizer/   # ProcessVisualizer / ProcessNode / ProcessEdge / RuntimeBadge
│  ├ home/         # トップページ用
│  └ ui/           # shadcn/ui
├ content/
│  ├ curriculum.ts # 章と教材の一覧
│  └ lessons/      # 教材ごとの本文・表示するファイル・Inside This Page の定義
├ proxy.ts         # not-found.tsx 教材のデモ用（matcher で checked/:id だけに限定）
├ hooks/
├ lib/             # source-code.ts（読み込み + ハイライト）/ measure.ts / metadata
│  └ auth-demo/    # Authentication 章で共有する認証デモ（session / dal / users、すべて server-only）
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

必要環境: Node.js 22.12 以上 / pnpm 9（Gemini の SDK と Vitest が Node.js 22 以上を必要とするため）

```bash
pnpm install
cp .env.example .env.local   # 必要に応じて NEXT_PUBLIC_SITE_URL を設定
pnpm dev
```

http://localhost:3000 を開きます。

Authentication 章の認証デモを動かすには、`.env.local` の `AUTH_DEMO_SECRET` に32文字以上のランダムな文字列を設定します（例: `openssl rand -base64 32` の出力）。未設定でも教材の本文は表示され、デモだけが使えない状態になります。Vercel では、Preview と Production に別々の値を環境変数として設定します。

### AI 機能（開発中）

教材について AI に質問する機能を、Gemini API の無料枠で段階的に追加しています（計画: [`docs/AI_IMPLEMENTATION_PLAN.md`](docs/AI_IMPLEMENTATION_PLAN.md)）。現在は、各教材ページの見出しの下にある「AI に質問する」パネル（AI Context Tutor）が使えます。

- **既定では無効**です（`NEXTSCOPE_AI_ENABLED=false`）。無効・未設定のときは、パネルの代わりに「現在使えません」という案内を出します。上限・障害のときも、パネルの中にエラーを出すだけで、教材とデモはそのまま使えます
- 対象は **18 歳以上・日本国内からの利用だけ**です（Gemini API の規約の条件）。本番では、国コードが日本のリクエストだけを受け付けます
- API を呼ぶのは、利用者が質問を送信したときだけです。教材の表示やデモの操作では呼びません
- 送るデータは、教材の ID と質問だけです。サーバーが教材の本文を ID から読み込み、Google の Gemini API に送ります。無料枠の入力は Google の製品改善に使われ、人が読むことがあります。個人情報や秘密情報らしい質問は、送る前にサーバーで断ります
- 利用回数を数えるため、匿名の Cookie（`nextscope_ai_session`、24 時間有効）と、IP アドレスから作ったハッシュを使います（パネルにも表示します）
- 使う環境変数は `.env.example` の「AI 機能」を参照してください。本番では、利用制限の保存先（Upstash Redis）も必要です。請求先アカウントやカードは登録しません
- 教材ページはビルド時にプリレンダーされるため、パネルを出すかどうかはビルド時の環境変数で決まります。Vercel で AI の環境変数を変えたら、再デプロイしてください

手元で試す手順は次のとおりです。

1. [Google AI Studio](https://aistudio.google.com/) で API キーを作る（無料枠のまま使う）
2. `.env.local` に `NEXTSCOPE_AI_ENABLED=true`、`GEMINI_API_KEY`、`GEMINI_MODEL`、`NEXTSCOPE_AI_HASH_SECRET`（32 文字以上のランダムな文字列）を設定する。開発中は Upstash を設定しなくても、メモリで代用します
3. `pnpm dev` を起動し直し、教材ページの「AI に質問する」を開く

## 開発コマンド

| コマンド                            | 内容                                        |
| ----------------------------------- | ------------------------------------------- |
| `pnpm dev`                          | 開発サーバーを起動                          |
| `pnpm build`                        | 本番ビルド（Cache Components の検証を含む） |
| `pnpm start`                        | 本番ビルドを起動                            |
| `pnpm lint`                         | ESLint                                      |
| `pnpm typecheck`                    | TypeScript の型チェック                     |
| `pnpm format` / `pnpm format:check` | Prettier による整形 / 確認                  |
| `pnpm test`                         | Vitest による自動テスト                     |

## 設計上の制約と注意点

- **Route Handlers のデモデータ**も同じくサーバープロセスのメモリに保存しています（最大20件）。再起動で最初の2件に戻り、複数インスタンスでは共有されません。
- **Server Actions のデモデータ**はサーバープロセスのメモリに保存しています。再起動で消え、複数インスタンスでは共有されません（最大8件）。また、ページのキャッシュは再起動後も `.next` に残るため、データが消えた後も古い表示が残ることがあります。
- **Cache 教材のデモ**は `"use cache: remote"` を使っています。Vercel の実測では通常の `"use cache"` が実行時に再利用されなかったためで、デプロイ先によっては料金が発生します。キャッシュは閲覧者全員で共有しますが、`cacheHandlers` を設定していないため、セルフホストで複数台動かすとインスタンスごとのメモリに分かれます。
- Process Visualizer のステップ間隔（約0.65秒）は目で追うための演出です。実際の処理時間は各ステップの計測値で示しています。
- **Dynamic Routes 教材**の存在しない値は、App Shell を送った後に `notFound()` を呼ぶため、ステータスが 200 になります（`noindex` 付き）。404 を返すには proxy での確認が必要ですが、教材ではこの挙動を見せるためにそのままにしています。proxy で確かめて 404 を返す例は not-found.tsx 教材にあります。
- **`src/proxy.ts`** は教材のデモ専用です。`matcher` で `/learn/not-found-file/checked/:id`（not-found.tsx 教材）と `/learn/protected-pages/proxied`（保護されたページ 教材）だけに限定し、パスで教材ごとの処理に振り分けているため、ほかのページのリクエストには影響しません。
- **保護されたページ 教材**の Live Demo は、枠の中（`children`）をパスが変わるたびに作り直しています。Cache Components では移動前のページが `<Activity>` で隠れたまま残り、未ログインで会員ページから送られた後にログインしても、残った「リダイレクトした」状態でログインページへ戻されてしまうためです。
- **not-found.tsx 教材**は、表示されたファイルを調べるため、デモのページを見えない `iframe` で開きます。同じオリジンのページなので `contentDocument` を読めます。
- **認証デモ**（`src/lib/auth-demo/`）は教材専用で、サイト全体のログインではありません。ログインは本人確認を省いたデモで、デモの管理者にもサイトを操作する権限はありません。cookie は `/learn` 以下にだけ送られ、同じブラウザでは Authentication 章の教材どうしでログインの状態が共有されます。データベースを使わないため、ログアウトしてもコピーされたトークンは期限（15分）まで有効です。
- **サーバー側での認証 教材**の `api/unguarded` は、確認を忘れた Route Handler の悪い例として、ログインしていなくても架空の売上の数字を返します。返すのはコード内の固定のデモデータだけです。
- App Router 教材の遷移フローは、RSC Payload のやり取りをブラウザから直接観測できないため「モデル図」として表示しています（URL と `useSelectedLayoutSegment()` の値は実データ）。

## 今後追加する予定の教材

カリキュラムにある教材は、すべて公開しています。

将来的な学習履歴・お気に入り機能に備え、教材データ（`content/`）と表示（`components/learning/`）を分離し、認証を後から追加できる構成にしています。
