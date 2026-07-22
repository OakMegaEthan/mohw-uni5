"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { ChevronDown, Download, FileText, GitCompare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DocumentPane, ComparisonPane } from "@/components/filing/document-pane"
import type { DocContent, ComparisonContent } from "@/lib/mock/filing-upload-content"

// 供檢視器切換的單一份文件（含前/今年度內容與修正對照表）
export interface ViewerFile {
  key: string
  label: string
  previous: DocContent | null
  current: DocContent | null
  comparison: ComparisonContent | null
  // 對應內容為 null 時的空狀態畫面
  currentEmptyState?: React.ReactNode
  comparisonEmptyState?: React.ReactNode
}

interface DocumentSwitcherViewerProps {
  files: ViewerFile[]
  className?: string
  // 檢視區高度（前年度／今年度／對照表共用同一容器與比例）
  heightClassName?: string
}

type ViewYear = "previous" | "current"

// 情境無關的共用文件檢視器：
//  - 上方文件選擇器切換不同文件（版型 C 的評核標準／評核表）
//  - T 鍵或按鈕切換前年度／今年度
//  - G 鍵或按鈕開關修正對照表（佔用與文件相同的檢視比例）
//  - 每個檢視（文件×年度、對照表）各自保留捲動位置
// 填報專區與審查專區皆可直接引用。
export function DocumentSwitcherViewer({
  files,
  className,
  heightClassName = "h-[60vh] min-h-[28rem]",
}: DocumentSwitcherViewerProps) {
  const [activeFileKey, setActiveFileKey] = useState(files[0]?.key ?? "")
  const [year, setYear] = useState<ViewYear>("current")
  const [showComparison, setShowComparison] = useState(false)

  const activeFile = files.find((f) => f.key === activeFileKey) ?? files[0]
  const mode = showComparison ? "cmp" : year
  const viewId = `${activeFileKey}:${mode}`

  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollPositions = useRef<Record<string, number>>({})
  const viewIdRef = useRef(viewId)

  // 持續記錄目前檢視的捲動位置
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (el) scrollPositions.current[viewIdRef.current] = el.scrollTop
  }, [])

  // 切換檢視時還原該檢視先前的捲動位置
  useLayoutEffect(() => {
    viewIdRef.current = viewId
    const el = scrollRef.current
    if (el) el.scrollTop = scrollPositions.current[viewId] ?? 0
  }, [viewId])

  const toggleYear = useCallback(() => {
    setYear((prev) => (prev === "current" ? "previous" : "current"))
  }, [])

  // 鍵盤快捷鍵：T 切年度、G 開關對照表；輸入中或組字中不觸發
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // 原生 KeyboardEvent 直接有 isComposing；nativeEvent 是 React 合成事件才有的屬性
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return
      const target = document.activeElement as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return
      }
      const key = e.key.toLowerCase()
      if (key === "t") {
        if (showComparison) return // 對照表模式下年度切換無作用
        e.preventDefault()
        toggleYear()
      } else if (key === "g") {
        e.preventDefault()
        setShowComparison((v) => !v)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [showComparison, toggleYear])

  if (!activeFile) return null

  const renderBody = () => {
    if (showComparison) {
      return activeFile.comparison ? (
        <ComparisonPane content={activeFile.comparison} />
      ) : (
        <EmptyState>{activeFile.comparisonEmptyState ?? "尚無修正對照表內容"}</EmptyState>
      )
    }
    if (year === "previous") {
      return activeFile.previous ? (
        <DocumentPane content={activeFile.previous} />
      ) : (
        <EmptyState>前年度無可檢視的文件</EmptyState>
      )
    }
    return activeFile.current ? (
      <DocumentPane content={activeFile.current} />
    ) : (
      <EmptyState>{activeFile.currentEmptyState ?? "今年度尚無可檢視的文件"}</EmptyState>
    )
  }

  return (
    <div className={cn("rounded-xl border bg-card", className)}>
      {/* 文件選擇器：多份文件時顯示 */}
      {files.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <span className="mr-1 text-sm text-muted-foreground">文件</span>
          {files.map((file) => (
            <Button
              key={file.key}
              size="sm"
              variant={file.key === activeFileKey ? "default" : "outline"}
              onClick={() => setActiveFileKey(file.key)}
              className={file.key === activeFileKey ? "bg-[#2d3a8c] text-white hover:bg-[#252f73]" : ""}
            >
              <FileText className="mr-1.5 h-4 w-4" />
              {file.label}
            </Button>
          ))}
        </div>
      )}

      {/* 檢視控制列 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-3">
          {/* 年度切換 */}
          <div
            className={cn(
              "inline-flex overflow-hidden rounded-lg border",
              showComparison && "pointer-events-none opacity-40",
            )}
            role="group"
            aria-label="切換年度"
          >
            <button
              type="button"
              onClick={() => setYear("previous")}
              disabled={showComparison}
              className={cn(
                "px-3 py-1.5 text-sm font-medium transition-colors",
                year === "previous" ? "bg-[#2d3a8c] text-white" : "bg-transparent text-muted-foreground hover:bg-muted",
              )}
            >
              前年度
            </button>
            <button
              type="button"
              onClick={() => setYear("current")}
              disabled={showComparison}
              className={cn(
                "px-3 py-1.5 text-sm font-medium transition-colors",
                year === "current" ? "bg-[#2d3a8c] text-white" : "bg-transparent text-muted-foreground hover:bg-muted",
              )}
            >
              今年度
            </button>
          </div>

          {/* 對照表開關 */}
          <Button
            variant={showComparison ? "default" : "outline"}
            size="sm"
            onClick={() => setShowComparison((v) => !v)}
            aria-pressed={showComparison}
            className={cn("gap-1.5", showComparison && "bg-[#2d3a8c] text-white hover:bg-[#252f73]")}
          >
            <GitCompare className="h-4 w-4" />
            修正對照表{showComparison ? "（開）" : "（關）"}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* 下載前次檔案：僅在檢視前年度且有前年度文件時提供 */}
          {!showComparison && year === "previous" && activeFile.previous && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-4 w-4" />
                  下載前次檔案
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  下載 Word 檔
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  下載 PDF 檔
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 快捷鍵提示 */}
          <p className="text-sm text-muted-foreground">
            快捷鍵：
            <kbd className="mx-1 rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">T</kbd>
            切換年度
            <kbd className="mx-1 rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">G</kbd>
            開關對照表
          </p>
        </div>
      </div>

      {/* 檢視區：三種檢視共用同一固定高度容器與比例 */}
      <div ref={scrollRef} onScroll={handleScroll} className={cn("overflow-y-auto", heightClassName)}>
        {renderBody()}
      </div>
    </div>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-[16rem] items-center justify-center px-6 py-12 text-center">
      <div className="max-w-md text-base text-muted-foreground">{children}</div>
    </div>
  )
}
