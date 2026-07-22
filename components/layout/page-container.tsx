// 頁面外框與標題列。DESIGN_GUIDELINES.md 早就寫了要用這兩個元件，但檔案一直不存在，
// 各頁各自複製 `min-h-screen bg-gray-50` + `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8`。
// 此處把既有寫法收成元件，新頁一律使用；舊頁逐步遷移。

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

const WIDTH_CLASS = {
  narrow: "max-w-4xl", // 表單、單欄內容
  standard: "max-w-6xl", // 列表、儀表板（預設）
  wide: "max-w-7xl", // 數據密集頁面
} as const

export function PageContainer({
  children,
  width = "standard",
  className,
}: {
  children: ReactNode
  width?: keyof typeof WIDTH_CLASS
  className?: string
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className={cn("mx-auto px-4 py-8 sm:px-6 lg:px-8", WIDTH_CLASS[width], className)}>
        {children}
      </div>
    </div>
  )
}

/**
 * 頁面標題列。children 放右側操作按鈕。
 * 標題與按鈕同列對齊，描述在標題下方，避免各頁自己拼 margin 而基線不齊。
 */
export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-base text-gray-600">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  )
}
