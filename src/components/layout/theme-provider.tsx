"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ComponentProps } from "react"

// next-themes は Context と localStorage を使うため Client Component にする。
// layout からは children だけを包み、配下の Server Components はそのまま維持される。
export function ThemeProvider(
  props: ComponentProps<typeof NextThemesProvider>,
) {
  return <NextThemesProvider {...props} />
}
