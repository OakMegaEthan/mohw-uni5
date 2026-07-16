"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, FileText, Download, AlertCircle, Upload, X, Settings2, CalendarIcon, ClipboardCheck, Megaphone } from "lucide-react"
import { format } from "date-fns"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClassificationPrincipleDialog } from "@/components/filing/classification-principle-dialog"
import { MultiFileUpload, type UploadedFile } from "@/components/filing/multi-file-upload"
import {
  getClassificationPrinciples,
  setClassificationPrinciples,
  getSpecialtyOptions,
  isAdditionalQuotaEditable,
  type AdditionalQuotaApplication,
  type QuotaAttachment,
} from "@/lib/mock/additional-quota"

interface AdditionalQuotaFormProps {
  /** 未提供代表新增申請；提供則為既有案件（依階段決定可編輯範圍）。 */
  application?: AdditionalQuotaApplication
}

const NEW_QUOTA = {
  specialty: "",
  approved: 0,
  limit: 25,
  validFrom: "2025-08-01",
  validTo: "2026-07-31",
  latestAnnouncementDate: "115/01/03",
  latestAnnouncementNumber: "衛部醫字第1151650000號",
}

/**
 * 外加容額申請的單頁工作流：登錄申請內容、登錄審查結果、公告，全部在同一頁依階段進行。
 * 待審查：申請內容可編輯，可登錄審查結果並轉待公告。
 * 待公告：申請內容與審查結果唯讀，可辦理公告。
 * 已公告：全部唯讀。
 */
export function AdditionalQuotaForm({ application }: AdditionalQuotaFormProps) {
  const router = useRouter()
  const isNew = !application
  const stage = application?.stage ?? "待審查"
  const contentEditable = isNew || isAdditionalQuotaEditable(stage)
  const canRegisterReview = !isNew && stage === "待審查"
  const canAnnounce = !isNew && stage === "待公告"

  // ── 申請內容 ────────────────────────────────
  const [hospitalName, setHospitalName] = useState(application?.hospitalName ?? "")
  const [specialty, setSpecialty] = useState(application?.specialty ?? "")
  const [incomingDate, setIncomingDate] = useState<Date | undefined>(undefined)
  const [incomingDocNumber, setIncomingDocNumber] = useState(application?.incomingDocNumber ?? "")
  const [ministryDocNumber, setMinistryDocNumber] = useState(application?.ministryDocNumber ?? "")
  const [principle, setPrinciple] = useState(application?.classificationPrinciple ?? "")
  const [requestedQuota, setRequestedQuota] = useState(
    application?.requestedQuota ? String(application.requestedQuota) : "",
  )
  const [requestReason, setRequestReason] = useState(application?.requestReason ?? "")
  const [requestDescription, setRequestDescription] = useState(application?.requestDescription ?? "")
  const [attachments, setAttachments] = useState<QuotaAttachment[]>(application?.attachments ?? [])

  // ── 分類原則選項維護 ────────────────────────
  const [principleOptions, setPrincipleOptions] = useState<string[]>(getClassificationPrinciples())
  const [manageOpen, setManageOpen] = useState(false)
  const handlePrincipleOptionsChange = (next: string[]) => {
    setPrincipleOptions(next)
    setClassificationPrinciples(next) // 寫回 store，維持 session 期間的變更
    if (principle && !next.includes(principle)) setPrinciple("")
  }

  // ── 審查結果 ────────────────────────────────
  const [approvedQuota, setApprovedQuota] = useState(
    application?.approvedQuota != null ? String(application.approvedQuota) : "",
  )
  const [reviewComment, setReviewComment] = useState(application?.reviewComment ?? "")
  const [reviewMinutes, setReviewMinutes] = useState<UploadedFile[]>(application?.reviewMinutes ?? [])

  // ── 公告 ────────────────────────────────────
  const [announcementNumber, setAnnouncementNumber] = useState(application?.announcementNumber ?? "")

  const quota = application?.currentYearQuota ?? NEW_QUOTA
  const requestedNumber = Number(requestedQuota) || 0
  const totalAfterApproval = quota.approved + requestedNumber
  const exceedsLimit = totalAfterApproval > quota.limit

  const incomingDateText = incomingDate
    ? format(incomingDate, "yyyy/MM/dd")
    : application?.incomingDate ?? ""

  const canSaveApplication = useMemo(
    () =>
      Boolean(hospitalName) &&
      Boolean(specialty) &&
      Boolean(incomingDateText) &&
      incomingDocNumber.trim() !== "" &&
      Boolean(principle) &&
      requestedNumber > 0 &&
      !exceedsLimit &&
      requestReason.trim() !== "" &&
      requestDescription.trim() !== "" &&
      attachments.length > 0,
    [hospitalName, specialty, incomingDateText, incomingDocNumber, principle, requestedNumber, exceedsLimit, requestReason, requestDescription, attachments],
  )

  const handleQuotaChange = (value: string, setter: (v: string) => void) => {
    if (value !== "" && !/^\d+$/.test(value)) return
    setter(value)
  }

  const handleUploadAttachment = () =>
    setAttachments((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, name: `申請附件_${prev.length + 1}.pdf`, size: "1.5 MB" },
    ])
  const handleRemoveAttachment = (id: string) => setAttachments((prev) => prev.filter((f) => f.id !== id))

  const handleUploadMinutes = () =>
    setReviewMinutes((prev) => [
      ...prev,
      { id: `m-${Date.now()}`, name: "115年度外加容額審查會議紀錄.pdf", size: "1.5 MB" },
    ])
  const handleRemoveMinutes = (id: string) => setReviewMinutes((prev) => prev.filter((f) => f.id !== id))

  const handleSaveApplication = () => {
    toast.success(isNew ? "已登錄申請" : "已儲存")
    setTimeout(() => router.push("/filing/additional-quota"), 0)
  }

  const handleRegisterReview = () => {
    if (!approvedQuota || !reviewComment.trim()) {
      toast.error("請填寫核定容額與審查意見")
      return
    }
    toast.success("已登錄審查結果，案件轉為待公告")
    setTimeout(() => router.push("/filing/additional-quota"), 0)
  }

  const handleAnnounce = () => {
    if (!announcementNumber.trim()) {
      toast.error("請填寫公告文號")
      return
    }
    toast.success("已完成公告")
    setTimeout(() => router.push("/filing/additional-quota"), 0)
  }

  const title = isNew ? "新增外加容額申請" : `${application.hospitalName}（${application.specialty}）- 外加容額申請`

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

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {isNew ? "登錄申請內容並檢附證明文件" : `來文日期：${application.incomingDate}`}
            </p>
          </div>
          {!isNew && (
            <Badge variant="outline" className="shrink-0">
              {application.stage}
            </Badge>
          )}
        </div>

        <div className="space-y-6">
          {/* 本次申請內容 */}
          <Card>
            <CardHeader>
              <CardTitle>本次申請內容</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    訓練醫院 {contentEditable && <span className="text-destructive">*</span>}
                  </Label>
                  {contentEditable ? (
                    <Input
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      placeholder="請輸入訓練醫院名稱"
                      className="mt-1 bg-white"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{hospitalName}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    申請分科 {contentEditable && <span className="text-destructive">*</span>}
                  </Label>
                  {contentEditable ? (
                    <Select value={specialty} onValueChange={setSpecialty}>
                      <SelectTrigger className="mt-1 bg-white">
                        <SelectValue placeholder="請選擇申請分科" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSpecialtyOptions().map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{specialty}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    來文日期 {contentEditable && <span className="text-destructive">*</span>}
                  </Label>
                  {contentEditable ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="mt-1 w-full justify-start bg-white font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                          {incomingDateText || <span className="text-muted-foreground">選擇來文日期</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={incomingDate} onSelect={setIncomingDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{application.incomingDate}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    來文字號 {contentEditable && <span className="text-destructive">*</span>}
                  </Label>
                  {contentEditable ? (
                    <Input
                      value={incomingDocNumber}
                      onChange={(e) => setIncomingDocNumber(e.target.value)}
                      placeholder="例如：台大醫字第115XXXX號"
                      className="mt-1 bg-white"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{incomingDocNumber}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">本部文號</Label>
                  {contentEditable ? (
                    <Input
                      value={ministryDocNumber}
                      onChange={(e) => setMinistryDocNumber(e.target.value)}
                      placeholder="核復時填入，例如：衛部醫字第115XXXX號"
                      className="mt-1 bg-white"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{ministryDocNumber || "—"}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">
                      分類原則 {contentEditable && <span className="text-destructive">*</span>}
                    </Label>
                    {contentEditable && (
                      <button
                        type="button"
                        onClick={() => setManageOpen(true)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                        管理選項
                      </button>
                    )}
                  </div>
                  {contentEditable ? (
                    <Select value={principle} onValueChange={setPrinciple}>
                      <SelectTrigger className="mt-1 bg-white">
                        <SelectValue placeholder="請選擇分類原則" />
                      </SelectTrigger>
                      <SelectContent>
                        {principleOptions.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{principle}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  申請緣由 {contentEditable && <span className="text-destructive">*</span>}
                </Label>
                {contentEditable ? (
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

              {/* 申請容額數：容額現況與試算緊鄰輸入欄，超過上限即為錯誤狀態 */}
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  申請容額數 {contentEditable && <span className="text-destructive">*</span>}
                </Label>
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
                {/* 核定數字的版本依據 */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 border-x border-gray-200 bg-gray-50/60 px-4 py-1.5 text-xs text-gray-500">
                  <span>最近公告時間：{quota.latestAnnouncementDate}</span>
                  <span>最近公告文號：{quota.latestAnnouncementNumber}</span>
                </div>
                <div className="border-x border-gray-200 bg-white px-4 py-3">
                  {contentEditable ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={requestedQuota}
                        onChange={(e) => handleQuotaChange(e.target.value, setRequestedQuota)}
                        placeholder="0"
                        inputMode="numeric"
                        aria-invalid={exceedsLimit}
                        className={`w-32 ${exceedsLimit ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      />
                      <span className="text-sm text-gray-500">名</span>
                    </div>
                  ) : (
                    <p className="text-lg font-semibold text-blue-600">{application.requestedQuota} 名</p>
                  )}
                </div>
                <div
                  className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-b-lg border px-4 py-3 ${
                    exceedsLimit ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
                  }`}
                >
                  <p className="text-sm text-gray-700">
                    核定後總容額
                    <span className={`ml-1.5 text-base font-bold ${exceedsLimit ? "text-red-600" : "text-green-600"}`}>
                      {totalAfterApproval} 名
                    </span>
                  </p>
                  {exceedsLimit && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-red-600">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      超過容額上限 {quota.limit} 名，請調整申請容額數
                    </span>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  申請說明 {contentEditable && <span className="text-destructive">*</span>}
                </Label>
                {contentEditable ? (
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
                  申請上傳文件 {contentEditable && <span className="text-destructive">*</span>}
                </Label>
                <MultiFileUpload
                  files={attachments}
                  onUpload={contentEditable ? handleUploadAttachment : undefined}
                  onRemove={contentEditable ? handleRemoveAttachment : undefined}
                  uploadLabel="選擇檔案"
                  emptyState="尚未上傳申請文件"
                />
              </div>
            </CardContent>
          </Card>

          {/* 審查結果：新增申請時尚未進入審查，故不顯示 */}
          {!isNew && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  審查結果
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {canRegisterReview && (
                  <p className="text-sm text-muted-foreground">內部會議後，於此登錄核定結果與審查意見。</p>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    核定容額 {canRegisterReview && <span className="text-destructive">*</span>}
                  </Label>
                  {canRegisterReview ? (
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        value={approvedQuota}
                        onChange={(e) => handleQuotaChange(e.target.value, setApprovedQuota)}
                        placeholder="0"
                        inputMode="numeric"
                        className="w-32 bg-white"
                      />
                      <span className="text-sm text-gray-500">名</span>
                    </div>
                  ) : (
                    <p className="mt-1 text-lg font-semibold text-green-600">
                      {application?.approvedQuota != null ? `${application.approvedQuota} 名` : "—"}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    審查意見 {canRegisterReview && <span className="text-destructive">*</span>}
                  </Label>
                  {canRegisterReview ? (
                    <Textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="請說明審查結果與核定理由..."
                      className="mt-1 min-h-28 bg-white"
                    />
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap rounded-lg border bg-white p-3 text-sm text-gray-900">
                      {reviewComment || "—"}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium text-gray-700">審查會議紀錄</Label>
                  <MultiFileUpload
                    files={reviewMinutes}
                    onUpload={canRegisterReview ? handleUploadMinutes : undefined}
                    onRemove={canRegisterReview ? handleRemoveMinutes : undefined}
                    uploadLabel="選擇會議紀錄檔案"
                    emptyState="尚無審查會議紀錄"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 公告：待公告可辦理，已公告顯示結果 */}
          {(canAnnounce || stage === "已公告") && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-green-600" />
                  公告
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    公告文號 {canAnnounce && <span className="text-destructive">*</span>}
                  </Label>
                  {canAnnounce ? (
                    <Input
                      value={announcementNumber}
                      onChange={(e) => setAnnouncementNumber(e.target.value)}
                      placeholder="例如：衛部醫字第115XXXX號"
                      className="mt-1 bg-white"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{application?.announcementNumber ?? "—"}</p>
                  )}
                </div>
                {stage === "已公告" && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">公告日期</Label>
                    <p className="mt-1 text-sm text-gray-900">{application?.announcementDate ?? "—"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 前一期間資訊：唯讀參考 */}
          {application?.previousPeriod && (
            <Card>
              <CardHeader>
                <CardTitle>前一期間資訊（{application.previousPeriod.year}）</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">核定容額</Label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{application.previousPeriod.quota} 名</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">前次申請說明</Label>
                  <p className="mt-1 text-sm text-gray-900">{application.previousPeriod.requestDescription}</p>
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium text-gray-700">成果報告書</Label>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{application.previousPeriod.report.name}</p>
                        <p className="text-sm text-gray-500">{application.previousPeriod.report.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">前次審查意見</Label>
                  <p className="mt-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-900">
                    {application.previousPeriod.reviewComment}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/filing/additional-quota">返回</Link>
          </Button>
          {contentEditable && (
            <Button variant="outline" onClick={handleSaveApplication} disabled={!canSaveApplication}>
              {isNew ? "登錄申請" : "儲存"}
            </Button>
          )}
          {canRegisterReview && (
            <Button className="bg-[#2d3a8c] text-white hover:bg-[#252f73]" onClick={handleRegisterReview}>
              登錄審查結果並轉待公告
            </Button>
          )}
          {canAnnounce && (
            <Button className="bg-green-600 text-white hover:bg-green-700" onClick={handleAnnounce}>
              辦理公告
            </Button>
          )}
        </div>
      </div>

      <ClassificationPrincipleDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        options={principleOptions}
        onChange={handlePrincipleOptionsChange}
      />
    </div>
  )
}
