"use client"

import { MenuIcon } from "lucide-react"
import { useState } from "react"

import { SidebarNav } from "@/components/layout/sidebar-nav"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { Chapter } from "@/types/lesson"

export function MobileNav({ chapters }: { chapters: Chapter[] }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="教材メニューを開く"
          />
        }
      >
        <MenuIcon aria-hidden />
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto overscroll-contain">
        <SheetHeader>
          <SheetTitle>教材メニュー</SheetTitle>
        </SheetHeader>
        <div className="px-2 pb-6">
          <SidebarNav chapters={chapters} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
