"use client"

import { use, Suspense } from "react"
import { useSearchParams } from "next/navigation"

import { getFilingDocument } from "@/lib/mock/filing-documents"
import { SectionEditFiling } from "@/components/filing/variants/section-edit-filing"
import { SingleUploadFiling } from "@/components/filing/variants/single-upload-filing"
import { EvaluationUploadFiling } from "@/components/filing/variants/evaluation-upload-filing"

/**
 * 文件填報詳情頁：文件類型與版型完全耦合。
 * 依文件 id 取得 variant，分派到對應版型元件。
 *  - section-edit      逐條編輯（訓練計畫認定基準、容額分配原則、精進指南）
 *  - single-upload     單主文件上傳（訓練課程基準、甄審原則）
 *  - evaluation-upload 評核標準與評核表（評核標準與評核表）
 */
function FilingDetailContent({ id }: { id: string }) {
  const searchParams = useSearchParams()
  // status URL param 使用英文 key（見 lib/mock/filing-documents.ts）；未帶參數時預設唯讀檢視
  const status = searchParams.get("status") || "view"

  const doc = getFilingDocument(id)
  const documentTitle = doc?.title ?? id
  const variant = doc?.variant ?? "section-edit"

  if (variant === "single-upload") {
    return <SingleUploadFiling documentId={id} documentTitle={documentTitle} status={status} />
  }

  if (variant === "evaluation-upload") {
    return <EvaluationUploadFiling documentId={id} documentTitle={documentTitle} status={status} />
  }

  return <SectionEditFiling documentTitle={documentTitle} status={status} />
}

export default function FilingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f7fa]" />}>
      <FilingDetailContent id={id} />
    </Suspense>
  )
}
