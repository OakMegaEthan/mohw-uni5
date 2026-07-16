"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

export function ReviewSimpleNav() {
  const pathname = usePathname()

  return (
    <div className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 py-3">
          <Button variant={pathname.startsWith("/review/submissions") ? "default" : "ghost"} size="sm" asChild>
            <Link href="/review/submissions">填報審查</Link>
          </Button>
          <Button variant={pathname.startsWith("/review/hospital-quota") ? "default" : "ghost"} size="sm" asChild>
            <Link href="/review/hospital-quota">醫院容額分配審查</Link>
          </Button>
          <Button variant={pathname.startsWith("/review/outcome-report") ? "default" : "ghost"} size="sm" asChild>
            <Link href="/review/outcome-report">成果報告審查</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
