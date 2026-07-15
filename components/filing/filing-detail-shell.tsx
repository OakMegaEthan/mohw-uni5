import type { ReactNode } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

interface FilingDetailShellProps {
  title: string
  actions?: ReactNode
  /** Full-width banner rendered between the header and the content container. */
  banner?: ReactNode
  children: ReactNode
}

/**
 * 文件填報詳情頁的共用外框：頂部導覽列、返回連結、標題列與內容容器。
 * 三種版型（逐條編輯 / 單主文件上傳 / 評核標準上傳）皆共用，確保頁面框架一致。
 */
export function FilingDetailShell({ title, actions, banner, children }: FilingDetailShellProps) {
  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="bg-[#1e2a5e] text-white/70 text-sm py-2">
        <div className="container mx-auto px-6">規範文件管理 / 專科醫師訓練管理系統</div>
      </div>

      <div className="container mx-auto px-6 pt-6">
        <Link href="/filing" className="inline-flex items-center text-primary hover:underline text-sm">
          <ChevronLeft className="h-4 w-4 mr-1" />
          返回填報專區
        </Link>

        <div className="flex items-center justify-between mt-4 mb-6 gap-4">
          <h1 className="text-2xl font-bold text-foreground text-balance">{title}</h1>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>

      {banner}

      <div className="container mx-auto px-6 pb-8">{children}</div>
    </div>
  )
}
