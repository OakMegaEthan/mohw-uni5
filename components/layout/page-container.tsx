import { ReactNode } from "react"
import { CONTAINER } from "@/lib/design-system"

interface PageContainerProps {
  children: ReactNode
  className?: string
}

/**
 * 統一的頁面容器元件
 * 確保所有頁面使用相同的寬度和內邊距
 * 
 * 使用方式：
 * <PageContainer>
 *   <PageHeader title="頁面標題" description="說明文字" />
 *   {/* 頁面內容 */}
 * </PageContainer>
 */
export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`container mx-auto ${CONTAINER.CORE.tailwindClass} ${CONTAINER.CORE_PADDING.horizontal} ${CONTAINER.CORE_PADDING.vertical} ${className}`}>
      {children}
    </div>
  )
}

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
}

/**
 * 統一的頁面標題元件
 * 包含頁面標題、說明文字和操作按鈕區域
 */
export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-1 text-base text-gray-600">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  )
}
