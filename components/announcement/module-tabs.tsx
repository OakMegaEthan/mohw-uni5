"use client"

// 公告管理模組的頁內切換：待公告案件工作台 ↔ 公告清單。
// 依設計規範不設第二層導航，故用頁內 tab 列（與 /filing/additional-quota 的階段 tab 同版型）。

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"

const TABS = [
  { href: "/announcement-management/pending", label: "待公告案件" },
  { href: "/announcement-management", label: "公告清單" },
]

export function AnnouncementModuleTabs({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname()

  return (
    <div className="mb-6 flex items-center gap-6 border-b border-gray-200">
      {TABS.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative -mb-px flex items-center border-b-2 px-1 pb-3 text-base font-medium transition-colors ${
              active
                ? "border-[#2d3a8c] text-[#2d3a8c]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.href.endsWith("/pending") && pendingCount > 0 && (
              <Badge className="ml-2 border-amber-200 bg-amber-100 text-sm text-amber-800">
                {pendingCount}
              </Badge>
            )}
          </Link>
        )
      })}
    </div>
  )
}
