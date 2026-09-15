export const siteConfig = {
  name: "NextScope",
  description:
    "実際に動作するNext.jsと処理フローの可視化を通して、Server ComponentsやServer ActionsなどNext.js特有の仕組みを理解するためのインタラクティブ教材。",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const
