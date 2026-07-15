"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { FilingDetailShell } from "@/components/filing/filing-detail-shell"
import { FileUploadSlot, type FileUploadSlotConfig } from "@/components/filing/file-upload-slot"
import { DocumentChangeChoice, type ChangeMethod } from "@/components/filing/document-change-choice"
import { DocumentSwitcherViewer, type ViewerFile } from "@/components/filing/document-switcher-viewer"
import { getUploadDocEntry, type UploadDocKey } from "@/lib/mock/filing-upload-content"

interface EvaluationUploadFilingProps {
  documentId: string
  documentTitle: string
  status: string
}

interface UploadGroup {
  key: UploadDocKey
  title: string
  mainSlot: FileUploadSlotConfig
  revisionSlot: FileUploadSlotConfig
}

// 評核標準與評核表版型：評核標準 + 評核表，各含主文件與修正對照表，共 4 份
const UPLOAD_GROUPS: UploadGroup[] = [
  {
    key: "standards",
    title: "評核標準",
    mainSlot: { key: "standards-main", label: "評核標準文件", description: "本年度評核標準正式版本", required: true },
    revisionSlot: { key: "standards-revision", label: "評核標準修正對照表", description: "與前一版本的逐條修訂對照", required: true },
  },
  {
    key: "form",
    title: "評核表",
    mainSlot: { key: "form-main", label: "評核表文件", description: "本年度評核表正式版本", required: true },
    revisionSlot: { key: "form-revision", label: "評核表修正對照表", description: "與前一版本的逐條修訂對照", required: true },
  },
]

/** 版型 C：評核標準與評核表。兩份文件、各含主文件與修正對照表，共 4 份。 */
export function EvaluationUploadFiling({ documentId, documentTitle, status }: EvaluationUploadFilingProps) {
  const isReadOnly = status === "approved" || status === "under-review"
  const isPreviousYearOnly = status === "view"
  const showChoice = status === "pending" || status === "not-submitted"
  const title = `內科專科醫師${documentTitle} - 114年度文件填報`

  const [method, setMethod] = useState<ChangeMethod>(status === "not-submitted" ? "no-change" : "change")
  const [files, setFiles] = useState<Record<string, string | undefined>>(
    isReadOnly
      ? {
          "standards-main": "評核標準_114年度.pdf",
          "standards-revision": "評核標準_修正對照表.pdf",
          "form-main": "評核表_114年度.pdf",
          "form-revision": "評核表_修正對照表.pdf",
        }
      : {},
  )

  const handleUpload = (key: string, label: string) => setFiles((prev) => ({ ...prev, [key]: `${label}.pdf` }))
  const handleRemove = (key: string) => setFiles((prev) => ({ ...prev, [key]: undefined }))

  const effectiveNoChange = showChoice && method === "no-change"
  const uploadEnabled = !isReadOnly && !isPreviousYearOnly && !effectiveNoChange
  const allSlotKeys = UPLOAD_GROUPS.flatMap((g) => [g.mainSlot.key, g.revisionSlot.key])
  const canSubmit = effectiveNoChange || allSlotKeys.every((k) => Boolean(files[k]))

  // 依兩份文件組出共用檢視器所需資料（文件選擇器切換評核標準／評核表）
  const viewerFiles: ViewerFile[] = UPLOAD_GROUPS.map((group) => {
    const entry = getUploadDocEntry(documentId, group.key)
    const hasMain = Boolean(files[group.mainSlot.key])
    const hasRevision = Boolean(files[group.revisionSlot.key])

    let current = null
    let currentEmpty = "尚未上傳本年度文件，上傳後可於此檢視內容。"
    let comparison = null
    let comparisonEmpty = "尚未上傳修正對照表，上傳後可於此檢視。"
    if (isPreviousYearOnly) {
      currentEmpty = "此為前年度檢視模式，僅供查看前年度文件。"
      comparisonEmpty = "前年度檢視模式無修正對照表。"
    } else if (effectiveNoChange) {
      currentEmpty = "本年度沿用前年度文件，內容與前年度相同。"
      comparisonEmpty = "本年度未變更，無修正對照表。"
    } else {
      current = hasMain ? entry?.current ?? null : null
      comparison = hasRevision ? entry?.comparison ?? null : null
    }

    return {
      key: group.key,
      label: group.title,
      previous: entry?.previous ?? null,
      current,
      comparison,
      currentEmptyState: currentEmpty,
      comparisonEmptyState: comparisonEmpty,
    }
  })

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
                : "請分別上傳「評核標準」與「評核表」的主要文件及其修正對照表，共 4 份。"}
            </p>
            <div className="flex flex-col gap-6">
              {UPLOAD_GROUPS.map((group) => (
                <div key={group.key} className="rounded-lg border border-border p-4">
                  <h4 className="mb-3 text-base font-medium text-foreground">{group.title}</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[group.mainSlot, group.revisionSlot].map((slot) => (
                      <FileUploadSlot
                        key={slot.key}
                        config={slot}
                        disabled={!uploadEnabled}
                        fileName={files[slot.key]}
                        onUpload={uploadEnabled ? () => handleUpload(slot.key, slot.label) : undefined}
                        onRemove={uploadEnabled ? () => handleRemove(slot.key) : undefined}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 文件檢視：文件選擇器切換評核標準／評核表；T/G 切換年度與對照表 */}
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
