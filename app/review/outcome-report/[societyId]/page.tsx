"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, ClipboardCheck, AlertCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MultiFileUpload } from "@/components/filing/multi-file-upload"
import { OUTCOME_REPORT_SUB_CONFIG, getQuotaOutcomeReportCase } from "@/lib/mock/quota-outcome-report"

/**
 * 容額成果報告審查詳情（醫事司視角）。
 * 報告檔案唯讀；醫事司確認歸檔或退回補件（附退回意見）。不經醫策會、無初審步驟。
 */
export default function QuotaOutcomeReportReviewDetailPage({
  params,
}: {
  params: Promise<{ societyId: string }>
}) {
  const { societyId } = use(params)
  const router = useRouter()
  const reportCase = getQuotaOutcomeReportCase(societyId)

  const [returnComment, setReturnComment] = useState(reportCase?.returnComment ?? "")

  if (!reportCase) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/review/outcome-report"
            className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4" />
            返回容額成果報告審查
          </Link>
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-gray-500">找不到此案件</p>
          </div>
        </div>
      </div>
    )
  }

  const isArchived = reportCase.status === "已歸檔"
  const isReturned = reportCase.status === "退回補件"
  const canDecide = reportCase.status === "已送出"

  const handleArchive = () => {
    toast.success("已確認並歸檔")
    setTimeout(() => router.push("/review/outcome-report"), 0)
  }

  const handleReturn = () => {
    if (!returnComment.trim()) {
      toast.error("請填寫退回補件意見")
      return
    }
    toast.warning("已退回補件")
    setTimeout(() => router.push("/review/outcome-report"), 0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/review/outcome-report"
          className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" />
          返回容額成果報告審查
        </Link>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{reportCase.societyName} - 容額成果報告</h1>
            <p className="mt-1 text-sm text-gray-500">
              送出日期：{reportCase.submittedDate}
              {reportCase.archivedDate && `　歸檔日期：${reportCase.archivedDate}`}
            </p>
          </div>
          <Badge variant="outline" className={OUTCOME_REPORT_SUB_CONFIG[reportCase.status].color}>
            {OUTCOME_REPORT_SUB_CONFIG[reportCase.status].label}
          </Badge>
        </div>

        {isArchived && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 text-green-700">
              <ClipboardCheck className="h-5 w-5 shrink-0" />
              <span className="font-medium">本報告已確認並歸檔，僅供查看</span>
            </div>
          </div>
        )}

        {isReturned && (
          <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-start gap-2 text-orange-800">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">已退回補件</p>
                <p className="mt-0.5 text-sm">{reportCase.returnComment}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* 報告檔案：醫事司僅檢視 */}
          <Card>
            <CardHeader>
              <CardTitle>容額成果報告</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                {reportCase.societyName}上傳之審查細節補充資料，共 {reportCase.reports.length} 份。
              </p>
              <MultiFileUpload files={reportCase.reports} emptyState="尚無報告檔案" />
            </CardContent>
          </Card>

          {/* 退回意見：待確認時可填 */}
          {canDecide && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  審查
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  確認報告內容無誤即可歸檔；若需補件，請填寫退回意見後退回。
                </p>
                <div>
                  <Label className="text-sm font-medium text-gray-700">退回補件意見</Label>
                  <Textarea
                    value={returnComment}
                    onChange={(e) => setReturnComment(e.target.value)}
                    placeholder="退回補件時填寫，說明需補正之項目..."
                    className="mt-1 min-h-24 bg-white"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/review/outcome-report">返回</Link>
          </Button>
          {canDecide && (
            <>
              <Button
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                onClick={handleReturn}
              >
                退回補件
              </Button>
              <Button className="bg-[#2d3a8c] text-white hover:bg-[#252f73]" onClick={handleArchive}>
                確認並歸檔
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
