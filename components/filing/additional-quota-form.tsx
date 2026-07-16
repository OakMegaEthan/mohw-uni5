"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, FileText, Download, AlertCircle, Upload, X } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReviewFeedbackBanner } from "@/components/filing/review-feedback-banner"
import { AVAILABLE_HOSPITALS } from "@/components/filing/quota-form"
import {
  isAdditionalQuotaEditable,
  type AdditionalQuotaApplication,
  type QuotaAttachment,
} from "@/lib/mock/filing-additional-quota"

interface AdditionalQuotaFormProps {
  /** 未提供代表新增申請；提供則為檢視／編輯既有申請。 */
  application?: AdditionalQuotaApplication
}

// 新增申請時，容額脈絡待選定醫院後才有；原型以此為預設值
const NEW_APPLICATION_QUOTA = {
  specialty: "急診醫學科",
  approved: 15,
  limit: 25,
  validFrom: "2025-08-01",
  validTo: "2026-07-31",
}

/**
 * 外加容額申請的填報表單。新增與檢視／編輯共用同一版型，
 * 欄位與審查端 app/review/additional-quota/[hospitalId] 的「本次申請內容」對齊：
 * 填報端填寫的內容即審查端檢視的內容。
 */
export function AdditionalQuotaForm({ application }: AdditionalQuotaFormProps) {
  const router = useRouter()
  const isNew = !application
  const editable = isNew || isAdditionalQuotaEditable(application.status)

  const [hospitalName, setHospitalName] = useState(application?.hospitalName ?? "")
  const [requestedQuota, setRequestedQuota] = useState(
    application?.requestedQuota ? String(application.requestedQuota) : "",
  )
  const [requestReason, setRequestReason] = useState(application?.requestReason ?? "")
  const [requestDescription, setRequestDescription] = useState(application?.requestDescription ?? "")
  const [attachments, setAttachments] = useState<QuotaAttachment[]>(application?.attachments ?? [])

  const quota = application?.currentYearQuota ?? NEW_APPLICATION_QUOTA
  const previousPeriod = application?.previousPeriod

  // 核定後總容額隨輸入即時試算，讓填報者當下就看到是否超過上限
  const requestedNumber = Number(requestedQuota) || 0
  const totalAfterApproval = quota.approved + requestedNumber
  const exceedsLimit = totalAfterApproval > quota.limit

  const canSubmit = useMemo(
    () =>
      Boolean(hospitalName) &&
      requestedNumber > 0 &&
      requestReason.trim() !== "" &&
      requestDescription.trim() !== "" &&
      attachments.length > 0,
    [hospitalName, requestedNumber, requestReason, requestDescription, attachments],
  )

  const handleQuotaChange = (value: string) => {
    // 僅允許正整數
    if (value !== "" && !/^\d+$/.test(value)) return
    setRequestedQuota(value)
  }

  const handleUpload = () =>
    setAttachments((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, name: `申請附件_${prev.length + 1}.pdf`, size: "1.5 MB" },
    ])

  const handleRemove = (id: string) => setAttachments((prev) => prev.filter((f) => f.id !== id))

  const handleSubmit = () => {
    toast.success(application?.status === "退回修改" ? "已重新送出申請" : "已送出申請")
    setTimeout(() => router.push("/filing/additional-quota"), 0)
  }

  const handleSaveDraft = () => toast.success("已儲存草稿")

  const title = isNew ? "新增外加容額申請" : `${application.hospitalName} - 外加容額申請`

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/filing/additional-quota"
          className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" />
          返回外加容額申請
        </Link>

        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {isNew ? "填寫申請內容並檢附證明文件" : `${application.year}　送件日期：${application.submittedDate}`}
            </p>
          </div>
          {!isNew && (
            <Badge variant="outline" className="shrink-0">
              {application.year}
            </Badge>
          )}
        </div>

        {application?.reviewFeedback && (
          <div className="mb-6">
            <ReviewFeedbackBanner feedback={application.reviewFeedback} />
          </div>
        )}

        <div className="space-y-6">
          {/* 本次申請內容：對應審查端同名區段 */}
          <Card>
            <CardHeader>
              <CardTitle>本次申請內容</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  訓練醫院 {editable && <span className="text-destructive">*</span>}
                </Label>
                {editable ? (
                  <Select value={hospitalName} onValueChange={setHospitalName} disabled={!isNew}>
                    <SelectTrigger className="mt-1 bg-white">
                      <SelectValue placeholder="請選擇訓練醫院" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_HOSPITALS.map((h) => (
                        <SelectItem key={h.code} value={h.name}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{hospitalName}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  申請緣由 {editable && <span className="text-destructive">*</span>}
                </Label>
                {editable ? (
                  <Textarea
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="請簡述申請外加容額之緣由..."
                    className="mt-1 min-h-20 bg-white"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{requestReason}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  申請容額數 {editable && <span className="text-destructive">*</span>}
                </Label>

                {/* 容額現況與試算緊鄰輸入欄：填報者決定申請幾名時，
                    需要的正是這三個數字，放在頁面頂端等於要他來回捲動 */}
                <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-t-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
                  <span>
                    已核定容額 <strong className="text-gray-900">{quota.approved}</strong> 名
                  </span>
                  <span>
                    容額上限 <strong className="text-gray-900">{quota.limit}</strong> 名
                  </span>
                  <span className="text-gray-500">
                    效期 {quota.validFrom} ~ {quota.validTo}
                  </span>
                </div>

                <div className="border-x border-gray-200 bg-white px-4 py-3">
                  {editable ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={requestedQuota}
                        onChange={(e) => handleQuotaChange(e.target.value)}
                        placeholder="0"
                        className="w-32"
                        inputMode="numeric"
                      />
                      <span className="text-sm text-gray-500">名</span>
                    </div>
                  ) : (
                    <p className="text-lg font-semibold text-blue-600">{application.requestedQuota} 名</p>
                  )}
                </div>

                {/* 核定後總容額：隨輸入即時試算，讓填報者當下就知道是否超額 */}
                <div
                  className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-b-lg border px-4 py-3 ${
                    exceedsLimit ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
                  }`}
                >
                  <p className="text-sm text-gray-700">
                    已核定 {quota.approved} ＋ 本次申請 {requestedNumber} ＝
                    <span className={`ml-1.5 text-base font-bold ${exceedsLimit ? "text-red-600" : "text-green-600"}`}>
                      核定後總容額 {totalAfterApproval} 名
                    </span>
                  </p>
                  {exceedsLimit && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-red-600">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      超過上限 {quota.limit} 名，請於申請說明補充必要性
                    </span>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  申請說明 {editable && <span className="text-destructive">*</span>}
                </Label>
                {editable ? (
                  <Textarea
                    value={requestDescription}
                    onChange={(e) => setRequestDescription(e.target.value)}
                    placeholder="請詳細說明業務量、師資與教學資源等支持本次申請之具體事由..."
                    className="mt-1 min-h-32 bg-white"
                  />
                ) : (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">{requestDescription}</p>
                )}
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium text-gray-700">
                  申請上傳文件 {editable && <span className="text-destructive">*</span>}
                </Label>
                <div className="space-y-2">
                  {attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">{file.size}</p>
                        </div>
                      </div>
                      {editable ? (
                        <Button variant="ghost" size="sm" onClick={() => handleRemove(file.id)}>
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {attachments.length === 0 && !editable && (
                    <p className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
                      無附件
                    </p>
                  )}

                  {editable && (
                    <Button variant="outline" onClick={handleUpload} className="w-full gap-2 border-dashed bg-white">
                      <Upload className="h-4 w-4" />
                      選擇檔案
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 前一期間資訊：唯讀，供填寫本次申請時參考 */}
          {previousPeriod && (
            <Card>
              <CardHeader>
                <CardTitle>前一期間資訊（{previousPeriod.year}）</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">核定容額</Label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{previousPeriod.quota} 名</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">前次申請緣由</Label>
                  <p className="mt-1 text-sm text-gray-900">{previousPeriod.requestReason}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">前次申請說明</Label>
                  <p className="mt-1 text-sm text-gray-900">{previousPeriod.requestDescription}</p>
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium text-gray-700">成果報告書</Label>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{previousPeriod.report.name}</p>
                        <p className="text-sm text-gray-500">{previousPeriod.report.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">前次審查意見</Label>
                  <p className="mt-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-900">{previousPeriod.reviewComment}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/filing/additional-quota">返回</Link>
          </Button>
          {editable && (
            <>
              <Button variant="outline" onClick={handleSaveDraft}>
                儲存草稿
              </Button>
              <Button
                className="bg-[#2d3a8c] text-white hover:bg-[#252f73]"
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                {application?.status === "退回修改" ? "重新送出" : "送出申請"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
