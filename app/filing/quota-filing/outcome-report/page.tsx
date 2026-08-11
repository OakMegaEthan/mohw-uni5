"use client"

// 容額成果報告（醫學會上傳端）。容額填報的子頁面，非獨立模組。
//
// 為什麼是子頁面而不是嵌在容額填報頁：兩條流程時間解耦（待送件起全程可上傳，deadline 甚至
// 早於送件），但成果報告區塊原本佔掉容額填報頁的整個第一屏，把該頁自己的內容擠到下面。
// 改為子頁面後，容額填報頁只留一列帶狀態的入口。
//
// 為什麼不是彈窗：這是有生命週期的子流程（待上傳→已送出→已歸檔／退回補件），使用者會反覆
// 回來看狀態，需要自己的 URL；彈窗適合一次性動作。
//
// 為什麼不獨立成模組（不進 nav）：它沒有權限外溢問題——只有醫學會 ↔ 醫事司，與容額填報同一
// 批人（外加容額成果報告拆成獨立模組是因為醫策會要參與）。且 nav 若並列「容額成果報告」與
// 「外加容額成果報告」，兩個名稱極像、流程完全不同，是專案已知的混淆點。
//
// mock 慣例：以 URL param `report` 切換子狀態，比照容額填報頁的 stage。

import { Suspense, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MultiFileUpload, type UploadedFile } from "@/components/filing/multi-file-upload"
import {
  MOCK_OUTCOME_REPORT_RETURN,
  OUTCOME_REPORT_SUB_CONFIG,
  isValidOutcomeReportSubStatus,
  type OutcomeReportSubStatus,
} from "@/lib/mock/quota-outcome-report"
import { useSearchParams } from "next/navigation"

export default function QuotaOutcomeReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f7fa] p-8 text-center text-muted-foreground">載入中...</div>
      }
    >
      <QuotaOutcomeReportContent />
    </Suspense>
  )
}

function QuotaOutcomeReportContent() {
  const params = useSearchParams()
  const reportParam = params.get("report") || ""
  const reportStatus: OutcomeReportSubStatus = isValidOutcomeReportSubStatus(reportParam)
    ? reportParam
    : "待上傳"

  // 回容額填報時保留其階段與版型，避免使用者一來一回就掉回預設狀態
  const backParams = new URLSearchParams()
  const stage = params.get("stage")
  const variant = params.get("variant")
  const returnedFrom = params.get("returnedFrom")
  if (stage) backParams.set("stage", stage)
  if (variant) backParams.set("variant", variant)
  if (returnedFrom) backParams.set("returnedFrom", returnedFrom)
  backParams.set("report", reportStatus)
  const backHref = `/filing/quota-filing?${backParams.toString()}`

  const editable = reportStatus === "待上傳" || reportStatus === "退回補件"
  const [files, setFiles] = useState<UploadedFile[]>(
    reportStatus === "待上傳"
      ? []
      : [
          { id: "or-1", name: "容額成果報告_審查細節.pdf", size: "2.6 MB" },
          { id: "or-2", name: "容額成果報告_附件_訓練醫院明細.xlsx", size: "1.1 MB" },
        ],
  )

  const handleUpload = () =>
    setFiles((prev) => [
      ...prev,
      { id: `or-${Date.now()}`, name: `容額成果報告_附件${prev.length + 1}.pdf`, size: "1.8 MB" },
    ])
  const handleRemove = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id))
  const handleSubmit = () => {
    if (files.length === 0) return
    toast.success("容額成果報告已送出，待醫事司確認")
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="container mx-auto px-6 py-4">
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1 text-base text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" />
          返回容額填報
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">容額成果報告</h1>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${OUTCOME_REPORT_SUB_CONFIG[reportStatus].color}`}
          >
            {OUTCOME_REPORT_SUB_CONFIG[reportStatus].label}
          </span>
        </div>
        <p className="mt-1 text-base text-muted-foreground">內科醫學會 - 2025年度</p>
      </div>

      <div className="container mx-auto px-6 pb-8">
        <div className="rounded-lg border border-border bg-card px-6 py-5">
          {/* 原型：無實際送件流程，提供各子狀態的檢視入口 */}
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            {(Object.keys(OUTCOME_REPORT_SUB_CONFIG) as OutcomeReportSubStatus[]).map((s) => {
              const p = new URLSearchParams(backParams)
              p.set("report", s)
              const active = s === reportStatus
              return (
                <Link
                  key={s}
                  href={`/filing/quota-filing/outcome-report?${p.toString()}`}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                    active
                      ? OUTCOME_REPORT_SUB_CONFIG[s].color
                      : "border-transparent text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {OUTCOME_REPORT_SUB_CONFIG[s].label}
                </Link>
              )
            })}
          </div>

          <p className="mb-4 text-base text-muted-foreground">
            請上傳容額成果報告（醫學會對各申請醫院的評估結果，為容額申請的前置依據），送出後由
            醫事司確認歸檔留存。此作業與審查階段獨立，不影響審查與公告進度。
          </p>

          {/* 退回補件意見：醫事司於容額成果報告審查頁填寫的單則意見。
              有別於案件層級的退件（附審查會議紀錄全文，於容額填報頁以 ReviewFeedbackBanner 呈現）。 */}
          {reportStatus === "退回補件" && (
            <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
              <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-base font-medium text-orange-800">
                  {MOCK_OUTCOME_REPORT_RETURN.reviewer}退回補件
                </span>
                <span className="text-base text-orange-700">
                  退回日期：{MOCK_OUTCOME_REPORT_RETURN.returnedDate}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-base leading-relaxed text-orange-800">
                {MOCK_OUTCOME_REPORT_RETURN.comment}
              </p>
              <p className="mt-2 text-base text-orange-700">請依上述意見補齊後，重新上傳並送出。</p>
            </div>
          )}

          <MultiFileUpload
            files={files}
            onUpload={editable ? handleUpload : undefined}
            onRemove={editable ? handleRemove : undefined}
            uploadLabel="選擇成果報告檔案"
            emptyState="尚未上傳容額成果報告"
          />

          {editable && (
            <div className="mt-4 flex justify-end">
              <Button
                className="gap-2 bg-[#2d3a8c] text-white hover:bg-[#252f73]"
                disabled={files.length === 0}
                onClick={handleSubmit}
              >
                <Send className="h-4 w-4" />
                {reportStatus === "退回補件" ? "重新送出" : "送出成果報告"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
