"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, AlertCircle, Settings2, CalendarIcon, ClipboardCheck } from "lucide-react"
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
import { AdditionalQuotaHistory } from "@/components/filing/additional-quota-history"
import { ClassificationPrincipleDialog } from "@/components/filing/classification-principle-dialog"
import { MultiFileUpload, type UploadedFile } from "@/components/filing/multi-file-upload"
import {
  getClassificationPrinciples,
  setClassificationPrinciples,
  getSpecialtyOptions,
  isAdditionalQuotaEditable,
  type AdditionalQuotaApplication,
  type ClassificationPrinciple,
  type QuotaAttachment,
} from "@/lib/mock/additional-quota"

interface AdditionalQuotaFormProps {
  /** 未提供代表新增申請；提供則為既有案件（依階段決定可編輯範圍）。 */
  application?: AdditionalQuotaApplication
}

/**
 * 外加容額申請的單頁工作流：登錄醫院來文、登錄審查結果，依階段在同一頁進行。
 * 審查通過為終點，公告由公告管理辦理，本頁不處理公告事務。
 *
 * **段落的切分依據是「資料由誰、在哪一步產生」**：
 * - 「本次申請內容」＝醫院來文的事實＋收文當下的分類判斷。醫事司只是忠實登錄，
 *   故**不含任何審查判斷依據與審查後才產生的欄位**（容額現況、本部文號皆不在此）。
 * - 「審查結果」＝內部會議後才產生的資料。核定容額要對照當年度容額現況才判斷得了，
 *   故容額現況（已分配／可收訓／效期／最近公告）與本部文號都放在此段。
 *
 * 容額上限只硬擋**核定容額**：申請人數是醫院來文的既成事實，公文已經來了，
 * 不能因為超過上限就登不進系統；能不能給、給多少是審查階段的事。
 */
export function AdditionalQuotaForm({ application }: AdditionalQuotaFormProps) {
  const router = useRouter()
  const isNew = !application
  const stage = application?.stage ?? "待審查"
  const contentEditable = isNew || isAdditionalQuotaEditable(stage)
  const canRegisterReview = !isNew && stage === "待審查"
  // 全線一致：外加容額到「審查通過」為終點，公告（含文號）由公告管理獨佔，此頁不顯示公告狀態。
  const isPassed = !isNew && stage === "審查通過"

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
  const [attachments, setAttachments] = useState<QuotaAttachment[]>(application?.attachments ?? [])

  // ── 分類原則選項維護 ────────────────────────
  const [principleOptions, setPrincipleOptions] = useState<ClassificationPrinciple[]>(getClassificationPrinciples())
  const [manageOpen, setManageOpen] = useState(false)
  const handlePrincipleOptionsChange = (next: ClassificationPrinciple[]) => {
    setPrincipleOptions(next)
    setClassificationPrinciples(next) // 寫回 store，維持 session 期間的變更
    if (principle && !next.some((p) => p.name === principle)) setPrinciple("")
  }

  // ── 審查結果 ────────────────────────────────
  const [approvedQuota, setApprovedQuota] = useState(
    application?.approvedQuota != null ? String(application.approvedQuota) : "",
  )
  const [reviewComment, setReviewComment] = useState(application?.reviewComment ?? "")
  const [reviewMinutes, setReviewMinutes] = useState<UploadedFile[]>(application?.reviewMinutes ?? [])

  // 新增時尚未選定醫院與專科，查不到當年度容額現況，故此區塊只在既有案件出現
  const quota = application?.currentYearQuota ?? null
  const requestedNumber = Number(requestedQuota) || 0
  const approvedNumber = Number(approvedQuota) || 0
  // 硬限制只作用在核定容額；申請人數僅記錄來文事實，超過上限不擋
  const totalAfterApproval = quota ? quota.approved + approvedNumber : 0
  const exceedsLimit = quota != null && totalAfterApproval > quota.limit

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
      requestReason.trim() !== "",
    [hospitalName, specialty, incomingDateText, incomingDocNumber, principle, requestedNumber, requestReason],
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
    // 核定 0 名為合法值（審議後未同意外加），故以空字串而非 falsy 判斷未填
    if (approvedQuota === "" || !reviewComment.trim()) {
      toast.error("請填寫核定容額與審查意見")
      return
    }
    if (exceedsLimit) {
      toast.error(`核定後總容額超過可收訓容額 ${quota?.limit} 名，請調整核定容額`)
      return
    }
    toast.success("已登錄審查結果，案件審查通過，交由公告管理辦理公告")
    setTimeout(() => router.push("/filing/additional-quota"), 0)
  }

  const title = isNew ? "新增外加容額申請" : `${application.hospitalName}（${application.specialty}）- 外加容額申請`

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/filing/additional-quota"
          className="mb-4 inline-flex items-center gap-1 text-base text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" />
          返回外加容額管理
        </Link>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="mt-1 text-base text-gray-500">
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
                  <Label className="text-base font-medium text-gray-700">
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
                    <p className="mt-1 text-base text-gray-900">{hospitalName}</p>
                  )}
                </div>

                <div>
                  <Label className="text-base font-medium text-gray-700">
                    申請專科 {contentEditable && <span className="text-destructive">*</span>}
                  </Label>
                  {contentEditable ? (
                    <Select value={specialty} onValueChange={setSpecialty}>
                      <SelectTrigger className="mt-1 bg-white">
                        <SelectValue placeholder="請選擇申請專科" />
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
                    <p className="mt-1 text-base text-gray-900">{specialty}</p>
                  )}
                </div>

                <div>
                  <Label className="text-base font-medium text-gray-700">
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
                    <p className="mt-1 text-base text-gray-900">{application.incomingDate}</p>
                  )}
                </div>

                <div>
                  <Label className="text-base font-medium text-gray-700">
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
                    <p className="mt-1 text-base text-gray-900">{incomingDocNumber}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium text-gray-700">
                      分類原則 {contentEditable && <span className="text-destructive">*</span>}
                    </Label>
                    {contentEditable && (
                      <button
                        type="button"
                        onClick={() => setManageOpen(true)}
                        className="flex items-center gap-1 text-base text-blue-600 hover:underline"
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
                          <SelectItem key={p.name} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 text-base text-gray-900">{principle}</p>
                  )}
                </div>
              </div>

              {/*
                申請人數＝醫院來文要幾名，是既成事實，不受可收訓容額限制、不做警示。
                僅附一行試算供收文時對照；能不能給、給多少由審查段判斷。
              */}
              <div>
                <Label className="text-base font-medium text-gray-700">
                  申請人數 {contentEditable && <span className="text-destructive">*</span>}
                </Label>
                {contentEditable ? (
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      value={requestedQuota}
                      onChange={(e) => handleQuotaChange(e.target.value, setRequestedQuota)}
                      placeholder="0"
                      inputMode="numeric"
                      className="w-32 bg-white"
                    />
                    <span className="text-base text-gray-500">名</span>
                  </div>
                ) : (
                  <p className="mt-1 text-lg font-semibold text-blue-600">{application.requestedQuota} 名</p>
                )}
                {quota && (
                  <p className="mt-1.5 text-base text-gray-500">
                    申請後總容額 {quota.approved + requestedNumber} 名（現有 {quota.approved} 名 ＋ 本次申請{" "}
                    {requestedNumber} 名）
                  </p>
                )}
              </div>

              <div>
                <Label className="text-base font-medium text-gray-700">
                  申請緣由 {contentEditable && <span className="text-destructive">*</span>}
                </Label>
                {contentEditable ? (
                  <Textarea
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="請說明業務量、師資與教學資源等支持本次申請之具體事由..."
                    className="mt-1 min-h-32 bg-white"
                  />
                ) : (
                  <p className="mt-1 whitespace-pre-wrap text-base text-gray-900">{requestReason}</p>
                )}
              </div>

              <div>
                {/* 選填：醫院可能只發一紙公文而未附件，附件必填會讓來文登不進系統 */}
                <Label className="mb-2 block text-base font-medium text-gray-700">申請上傳文件</Label>
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
                  <p className="text-base text-muted-foreground">內部會議後，於此登錄核定結果與審查意見。</p>
                )}
                {/*
                  核定容額：容額現況（判斷依據）與試算緊鄰輸入欄，
                  核定後總容額超過可收訓容額即為錯誤狀態，不得完成登錄。
                */}
                <div>
                  <Label className="text-base font-medium text-gray-700">
                    核定容額 {canRegisterReview && <span className="text-destructive">*</span>}
                  </Label>
                  {quota && (
                    <>
                      <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-t-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-base text-gray-600">
                        <span>
                          已分配容額 <strong className="text-gray-900">{quota.approved}</strong> 名
                        </span>
                        <span>
                          可收訓容額 <strong className="text-gray-900">{quota.limit}</strong> 名
                        </span>
                        <span className="text-gray-500">
                          效期 {quota.validFrom} ~ {quota.validTo}
                        </span>
                      </div>
                      {/* 核定數字的版本依據：讓審查者確認參照的是否為最新公告 */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 border-x border-gray-200 bg-gray-50/60 px-4 py-1.5 text-base text-gray-500">
                        <span>最近公告時間：{quota.latestAnnouncementDate}</span>
                        <span>最近公告文號：{quota.latestAnnouncementNumber}</span>
                      </div>
                    </>
                  )}
                  <div className={`border-x border-gray-200 bg-white px-4 py-3 ${quota ? "" : "mt-1 rounded-t-lg border-t"}`}>
                    {canRegisterReview ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={approvedQuota}
                          onChange={(e) => handleQuotaChange(e.target.value, setApprovedQuota)}
                          placeholder="0"
                          inputMode="numeric"
                          aria-invalid={exceedsLimit}
                          className={`w-32 ${exceedsLimit ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                        />
                        <span className="text-base text-gray-500">名</span>
                      </div>
                    ) : (
                      <p className="text-lg font-semibold text-green-600">
                        {application?.approvedQuota != null ? `${application.approvedQuota} 名` : "—"}
                      </p>
                    )}
                  </div>
                  <div
                    className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-b-lg border px-4 py-3 ${
                      exceedsLimit ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
                    }`}
                  >
                    <p className="text-base text-gray-700">
                      核定後總容額
                      <span className={`ml-1.5 text-lg font-bold ${exceedsLimit ? "text-red-600" : "text-green-600"}`}>
                        {totalAfterApproval} 名
                      </span>
                    </p>
                    {exceedsLimit && quota && (
                      <span className="flex items-center gap-1.5 text-base font-medium text-red-600">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        超過可收訓容額 {quota.limit} 名，請調整核定容額
                      </span>
                    )}
                  </div>
                </div>

                {/* 本部文號：醫事司於審查後發文才產生，非醫院來文內容，故置於審查段 */}
                <div>
                  <Label className="text-base font-medium text-gray-700">本部文號</Label>
                  {canRegisterReview ? (
                    <Input
                      value={ministryDocNumber}
                      onChange={(e) => setMinistryDocNumber(e.target.value)}
                      placeholder="例如：衛部醫字第115XXXX號"
                      className="mt-1 bg-white"
                    />
                  ) : (
                    <p className="mt-1 text-base text-gray-900">{ministryDocNumber || "—"}</p>
                  )}
                </div>

                <div>
                  <Label className="text-base font-medium text-gray-700">
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
                    <p className="mt-1 whitespace-pre-wrap rounded-lg border bg-white p-3 text-base text-gray-900">
                      {reviewComment || "—"}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="mb-2 block text-base font-medium text-gray-700">審查會議紀錄</Label>
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

          {/* 審查通過為終點：本模組不辦理、不顯示公告；僅中性指路（wayfinding） */}
          {isPassed && (
            <Card className="border-gray-200 bg-gray-50/60">
              <CardContent className="py-4">
                <p className="text-base text-gray-700">
                  本案已審查通過。後續公告（含公告文號）由
                  <Link href="/announcement-documents" className="mx-1 text-blue-600 hover:underline">
                    公告管理
                  </Link>
                  辦理，本頁不再處理公告事務。
                </p>
              </CardContent>
            </Card>
          )}

          {/* 歷年申請與核定紀錄：唯讀參考，輔助判斷本次該核定多少容額 */}
          {application && <AdditionalQuotaHistory application={application} />}
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
              登錄審查結果（審查通過）
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
