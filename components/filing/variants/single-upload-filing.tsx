"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { FilingDetailShell } from "@/components/filing/filing-detail-shell"
import { FileUploadSlot, type FileUploadSlotConfig } from "@/components/filing/file-upload-slot"
import { DocumentChangeChoice, type ChangeMethod } from "@/components/filing/document-change-choice"
import { DocumentSwitcherViewer, type ViewerFile } from "@/components/filing/document-switcher-viewer"
import { getUploadDocEntry } from "@/lib/mock/filing-upload-content"

interface SingleUploadFilingProps {
  documentId: string
  documentTitle: string
  status: string
}

// 單主文件上傳版型：上傳 1 份主文件 + 1 份修正對照表
const UPLOAD_SLOTS: FileUploadSlotConfig[] = [
  { key: "main", label: "主要文件", description: "本年度文件正式版本", required: true },
  { key: "revision-table", label: "修正對照表", description: "與前一版本的逐條修訂對照", required: true },
]

/** 版型 B：單主文件上傳（訓練課程基準、甄審原則）。 */
export function SingleUploadFiling({ documentId, documentTitle, status }: SingleUploadFilingProps) {
  const isReadOnly = status === "approved" || status === "under-review"
  const isPreviousYearOnly = status === "view"
  const showChoice = status === "pending" || status === "not-submitted"
  const title = `內科專科醫師${documentTitle} - 114年度文件填報`

  const [method, setMethod] = useState<ChangeMethod>(status === "not-submitted" ? "no-change" : "change")
  // 已上傳檔名（原型以 mock 檔名模擬）；已送件狀態視為檔案已存在
  const [files, setFiles] = useState<Record<string, string | undefined>>(
    isReadOnly
      ? { main: `${documentTitle}_114年度.pdf`, "revision-table": `${documentTitle}_修正對照表.pdf` }
      : {},
  )

  const handleUpload = (key: string) =>
    setFiles((prev) => ({ ...prev, [key]: `${documentTitle}_${key === "main" ? "114年度" : "修正對照表"}.pdf` }))
  const handleRemove = (key: string) => setFiles((prev) => ({ ...prev, [key]: undefined }))

  // 只有在顯示「變更/不變更」選擇時，選「不變更」才會停用上傳
  const effectiveNoChange = showChoice && method === "no-change"
  const uploadEnabled = !isReadOnly && !isPreviousYearOnly && !effectiveNoChange
  const canSubmit = effectiveNoChange || (Boolean(files.main) && Boolean(files["revision-table"]))

  const entry = getUploadDocEntry(documentId, "main")

  // 組出共用檢視器所需的單一份文件資料
  let viewerCurrent = null
  let currentEmpty = "尚未上傳本年度文件，上傳後可於此檢視內容。"
  let viewerComparison = null
  let comparisonEmpty = "尚未上傳修正對照表，上傳後可於此檢視。"
  if (isPreviousYearOnly) {
    currentEmpty = "此為前年度檢視模式，僅供查看前年度文件。"
    comparisonEmpty = "前年度檢視模式無修正對照表。"
  } else if (effectiveNoChange) {
    currentEmpty = "本年度沿用前年度文件，內容與前年度相同。"
    comparisonEmpty = "本年度未變更，無修正對照表。"
  } else {
    viewerCurrent = files.main ? entry?.current ?? null : null
    viewerComparison = files["revision-table"] ? entry?.comparison ?? null : null
  }

  const viewerFiles: ViewerFile[] = [
    {
      key: "main",
      label: documentTitle,
      previous: entry?.previous ?? null,
      current: viewerCurrent,
      comparison: viewerComparison,
      currentEmptyState: currentEmpty,
      comparisonEmptyState: comparisonEmpty,
    },
  ]

  return (
    <FilingDetailShell title={title}>
      <div className="flex flex-col gap-6">
        {isReadOnly && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="font-medium">此文件已送件，目前為僅供查看狀態</span>
            </div>
          </div>
        )}

        {showChoice && <DocumentChangeChoice value={method} onChange={setMethod} />}

        {!isReadOnly && !isPreviousYearOnly && (
          <div className="rounded-lg bg-card p-6">
            <h3 className="mb-1 font-medium text-foreground">文件上傳</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {effectiveNoChange
                ? "已選擇「不變更」，本年度沿用前年度文件，無須上傳。"
                : "請上傳本年度主要文件及其修正對照表，共 2 份。"}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {UPLOAD_SLOTS.map((slot) => (
                <FileUploadSlot
                  key={slot.key}
                  config={slot}
                  disabled={!uploadEnabled}
                  fileName={files[slot.key]}
                  onUpload={uploadEnabled ? () => handleUpload(slot.key) : undefined}
                  onRemove={uploadEnabled ? () => handleRemove(slot.key) : undefined}
                />
              ))}
            </div>
          </div>
        )}

        {/* 文件檢視：前年度／今年度／修正對照表切換（T/G） */}
        <div className="rounded-lg bg-card p-6">
          <h3 className="mb-4 font-medium text-foreground">文件檢視</h3>
          <DocumentSwitcherViewer files={viewerFiles} />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="outline">返回</Button>
          {!isReadOnly && !isPreviousYearOnly && (
            <Button className="bg-[#2d3a8c] text-white hover:bg-[#252f73]" disabled={!canSubmit}>
              儲存並送出
            </Button>
          )}
        </div>
      </div>
    </FilingDetailShell>
  )
}
