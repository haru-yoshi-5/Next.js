import { useSyncExternalStore } from "react"

const query = "(prefers-reduced-motion: reduce)"

function subscribe(onChange: () => void) {
  const mediaQuery = window.matchMedia(query)
  mediaQuery.addEventListener("change", onChange)
  return () => mediaQuery.removeEventListener("change", onChange)
}

/** OS の「視差効果を減らす」設定を購読する。サーバーでは false とみなす */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}
