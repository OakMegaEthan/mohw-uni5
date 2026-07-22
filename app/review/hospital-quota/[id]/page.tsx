"use client"

import { use, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ArrowLeft, Upload, HelpCircle } from "lucide-react"
import {
  getHospitalQuotaDetail,
  getHospitalQuotaStageConfig,
  getQuotaReviewStageUnit,
} from "@/lib/mock/review-hospital-quota"
import { StageReviewHistory } from "@/components/review/stage-review-history"
import { quotaNotesStore } from "@/lib/stores/quota-notes-store"
import { societyQuotaLimits } from "@/lib/mock/society-quota-limits"

/**
 * 容額填報審查明細（醫策會／RRC／醫事司視角）。
 * 名冊表格的欄位與版型比照容額填報端（components/filing/quota-filing-view.tsx）：
 * 類別（單一／主訓／合作／合併認定）、所在地、前年度核定、可收訓容額、建議分配、資格效期（民國區間）。
 * 審查端唯讀，故不含編輯／排序／刪除欄。
 */
export default function HospitalQuotaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const detail = getHospitalQuotaDetail(id)
  const stageConfig = getHospitalQuotaStageConfig()

  const [reviewComment, setReviewComment] = useState(detail?.reviewComment || "")
  const [reviewResult, setReviewResult] = useState<"pending" | "approved" | "returned">(
    detail?.society.returnedFrom ? "returned" : detail?.society.reviewResult || "pending"
  )

  if (!detail) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="py-20 text-center">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              查無此案件，或該醫學會尚未填寫容額填報
            </h2>
            <Button asChild>
              <Link href="/review/hospital-quota">返回列表</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const {
    society,
    hospitals,
    disqualifiedHospitals,
    notAppliedHospitals,
    tuberculosisHospitals,
    reviewHistory,
    isInternalMedicine,
  } = detail

  const isReturned = society.returnedFrom !== null
  const isAnnounced = society.stage === "已公告"

  // 聯合申請組合的色帶，與填報端同一套配色
  const groupColors: Record<string, string> = {}
  const palette = [
    "border-l-violet-400 bg-violet-50/40",
    "border-l-teal-400 bg-teal-50/40",
    "border-l-orange-400 bg-orange-50/40",
    "border-l-pink-400 bg-pink-50/40",
  ]
  let colorIndex = 0
  for (const h of hospitals) {
    if (h.groupId && !groupColors[h.groupId]) {
      groupColors[h.groupId] = palette[colorIndex % palette.length]
      colorIndex++
    }
  }

  // 統計數字（算法與填報端一致：只計主列）
  const mainRows = hospitals.filter((h) => !h.isSubRow)
  const mainTrainingCount = mainRows.filter((h) => !h.groupId).length
  const cooperationCount = mainRows.reduce((acc, h) => acc + (h.partnerHospitalCodes?.length ?? 0), 0)
  const totalApplied = mainRows.length
  const disqualifiedCount = disqualifiedHospitals.length
  const qualifiedCount = totalApplied - disqualifiedCount
  const notAppliedCount = notAppliedHospitals?.length ?? 0

  const totalLimit = mainRows.reduce((sum, h) => sum + (h.limit ?? 0), 0)
  const totalPrevQuota = mainRows.reduce((sum, h) => sum + (h.prevQuota ?? 0), 0)
  const totalCurrentQuota = mainRows.reduce((sum, h) => sum + (h.currentQuota ?? 0), 0)

  const societyLimit = societyQuotaLimits.find((s) => s.societyId === society.id)
  const hasLimit = societyLimit?.totalLimit != null
  const isExceeded = hasLimit && totalCurrentQuota > societyLimit!.totalLimit!

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/review/hospital-quota"
          className="mb-4 inline-flex items-center gap-1 text-base text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" />
          返回容額填報審查
        </Link>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{society.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Badge variant="outline">{society.year}</Badge>
              {isReturned ? (
                <Badge className="border-orange-200 bg-orange-100 text-orange-800">退件補正中</Badge>
              ) : (
                <Badge className={stageConfig[society.stage].color}>
                  {stageConfig[society.stage].label}
                </Badge>
              )}
              <span className="text-base text-gray-500">送件日期：{society.submittedDate}</span>
            </div>
          </div>
        </div>

        {/* 退件橫幅：與填報端的退件說明對稱，載明續審規則 */}
        {isReturned && society.returnedFrom && (
          <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
            <p className="text-base text-orange-800">
              本案由<span className="mx-1 font-medium">{getQuotaReviewStageUnit(society.returnedFrom)}</span>
              於「{society.returnedFrom}」階段退回醫學會補正。醫學會重新送件後，案件回到該階段續審，
              不重走先前已通過的階段。
            </p>
          </div>
        )}

        {/* 已公告：唯讀 */}
        {isAnnounced && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-base text-green-800">
              本案已公告，內容為最終核定結果，僅供檢視。
            </p>
          </div>
        )}

        {/* 訓練醫院申請家數統計 */}
        <div className="mb-6">
          <h3 className="mb-4 text-lg font-bold text-foreground">訓練醫院申請家數</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex overflow-hidden rounded-lg border border-blue-200 bg-blue-50">
              <div className="flex flex-1 flex-col justify-center px-5 py-4">
                <p className="mb-1 text-sm text-blue-600">申請家數</p>
                <p className="text-3xl font-bold text-blue-700">{totalApplied}</p>
                <p className="mt-1.5 text-sm text-blue-600/70">
                  {mainTrainingCount} 家主訓、{cooperationCount} 家合作
                </p>
              </div>
              <div className="flex w-28 flex-col divide-y divide-blue-200 border-l border-blue-200">
                <div className="flex flex-1 flex-col justify-center bg-green-50/80 px-4 py-3">
                  <p className="mb-0.5 text-sm text-green-600">合格</p>
                  <p className="text-xl font-bold text-green-700">{qualifiedCount}</p>
                </div>
                <div
                  className={`flex flex-1 flex-col justify-center px-4 py-3 ${
                    disqualifiedCount > 0 ? "bg-red-50/80" : "bg-gray-50/60"
                  }`}
                >
                  <p
                    className={`mb-0.5 text-sm ${disqualifiedCount > 0 ? "text-red-600" : "text-gray-500"}`}
                  >
                    不合格
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      disqualifiedCount > 0 ? "text-red-700" : "text-gray-400"
                    }`}
                  >
                    {disqualifiedCount}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`flex flex-col justify-center rounded-lg border px-5 py-4 ${
                notAppliedCount > 0 ? "border-amber-200 bg-amber-50" : "border-gray-100 bg-gray-50"
              }`}
            >
              <p className={`mb-1 text-sm ${notAppliedCount > 0 ? "text-amber-600" : "text-gray-500"}`}>
                未申請家數
              </p>
              <p
                className={`text-3xl font-bold ${notAppliedCount > 0 ? "text-amber-700" : "text-gray-400"}`}
              >
                {notAppliedCount}
              </p>
            </div>

            {/* 醫學會容額上限對照（審查端才有的資訊，填報端不顯示核定上限） */}
            <div
              className={`flex flex-col justify-center rounded-lg border px-5 py-4 ${
                isExceeded ? "border-red-200 bg-red-50" : "border-border bg-card"
              }`}
            >
              <p className="mb-1 text-sm text-muted-foreground">建議分配 / 設定上限</p>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-3xl font-bold ${isExceeded ? "text-red-700" : "text-foreground"}`}>
                  {totalCurrentQuota}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {hasLimit ? `${societyLimit!.totalLimit} 名` : "未設定"}
                </span>
              </div>
              {isExceeded && (
                <p className="mt-1.5 text-sm font-medium text-red-600">
                  已超額 {totalCurrentQuota - societyLimit!.totalLimit!} 名
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 前置階段審查結果：目前階段之前的每一關都列出來。
            待公告的醫事司因此看得到醫策會初審、分組會議與 RRC 大會三份結論，
            而不是像先前只硬寫一塊分組會議。 */}
        <StageReviewHistory records={reviewHistory} />

        {/* 專科醫師訓練醫院認定合格名冊及訓練容量（版型比照填報端） */}
        <div className="mb-6">
          <h3 className="mb-4 text-lg font-bold text-foreground">
            專科醫師訓練醫院認定合格名冊及訓練容量
          </h3>
          <div className="relative overflow-hidden rounded-lg bg-card shadow-sm">
            {hasLimit || totalCurrentQuota > 0 ? (
              <div className="flex items-center gap-6 border-b bg-muted/30 px-6 py-3">
                <span className="text-sm text-muted-foreground">
                  設定容額上限：
                  <span className="font-semibold text-foreground">
                    {hasLimit ? societyLimit!.totalLimit : "未設定"}
                  </span>
                </span>
                <span className="text-muted-foreground">|</span>
                <span className="text-sm text-muted-foreground">
                  本年度建議分配合計：
                  <span className={`font-semibold ${isExceeded ? "text-red-600" : "text-foreground"}`}>
                    {totalCurrentQuota}
                  </span>
                  {isExceeded && (
                    <span className="ml-2 text-sm font-medium text-red-600">
                      （已超額 {totalCurrentQuota - societyLimit!.totalLimit!} 名）
                    </span>
                  )}
                </span>
              </div>
            ) : null}

            {/* 右側漸層陰影提示可橫向滑動 */}
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-gradient-to-l from-card to-transparent" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b bg-muted/50 text-sm font-medium text-muted-foreground">
                    <th className="sticky left-0 z-20 w-10 whitespace-nowrap bg-muted/50 px-2 py-2.5 text-left">
                      編號
                    </th>
                    <th className="sticky left-10 z-20 min-w-[240px] whitespace-nowrap bg-muted/50 px-2 py-2.5 text-left shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                      醫院名稱
                    </th>
                    <th className="whitespace-nowrap px-2 py-2.5 text-left">類別</th>
                    <th className="whitespace-nowrap px-2 py-2.5 text-left">所在地</th>
                    <th className="whitespace-nowrap px-2 py-2.5 text-center">前年度核定</th>
                    <th className="whitespace-nowrap px-2 py-2.5 text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex cursor-default items-center gap-0.5">
                              可收訓容額
                              <HelpCircle className="h-3 w-3 text-muted-foreground/70" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-sm" side="top">
                            係指醫院實際訓練量能，最大訓練容量之容額數
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                    <th className="whitespace-nowrap px-2 py-2.5 text-center">建議分配</th>
                    <th className="whitespace-nowrap px-2 py-2.5 text-center">資格效期</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {hospitals.map((hospital) => {
                    const groupStyle = hospital.groupId ? groupColors[hospital.groupId] : ""
                    const expiryRange =
                      hospital.expiryStartYear && hospital.expiryEndYear
                        ? `${hospital.expiryStartYear}/08/01 - ${hospital.expiryEndYear}/07/31`
                        : "—"
                    const hasNote = quotaNotesStore.hospitalNotes[String(hospital.id)]
                    return (
                      <tr
                        key={hospital.id}
                        className={`hover:bg-muted/30 ${groupStyle ? `border-l-4 ${groupStyle}` : ""}`}
                      >
                        <td className="sticky left-0 z-10 whitespace-nowrap bg-card px-2 py-3 text-sm text-muted-foreground">
                          {hospital.id}
                        </td>
                        <td className="sticky left-10 z-10 min-w-[240px] max-w-[360px] bg-card px-2 py-3 align-top text-sm font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                          <span
                            className={`block break-words leading-snug ${hospital.isSubRow ? "pl-5" : ""}`}
                          >
                            {hasNote && (
                              <span className="mr-0.5 text-destructive" title="此醫院有備註">
                                *
                              </span>
                            )}
                            {hospital.name}
                          </span>
                        </td>
                        <td className="px-2 py-3 align-top">
                          <div className="flex flex-col items-start gap-1">
                            {hospital.applicationType === "joint" && !hospital.isSubRow && (
                              <span className="whitespace-nowrap rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                                主訓機構
                              </span>
                            )}
                            {hospital.applicationType === "joint" && hospital.isSubRow && (
                              <span className="whitespace-nowrap rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                合作機構
                              </span>
                            )}
                            {hospital.applicationType === "single" && (
                              <span className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                單一機構
                              </span>
                            )}
                            {hospital.mergedHospitalCodes.length > 0 && (
                              <span className="whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                                合併認定
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-2 py-3 align-top text-sm">
                          {hospital.county ? (
                            <span className="text-foreground">{hospital.county}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-2 py-3 text-center text-sm">
                          {hospital.prevQuota ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-2 py-3 text-center text-sm">
                          {hospital.limit ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-2 py-3 text-center text-sm">
                          {hospital.currentQuota ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-2 py-3 text-center text-sm text-muted-foreground">
                          {expiryRange}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/60">
                    <td className="sticky left-0 z-10 bg-muted/60 px-2 py-2.5 text-sm font-semibold text-foreground">
                      合計
                    </td>
                    <td className="sticky left-10 z-10 bg-muted/60 px-2 py-2.5 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]" />
                    <td className="px-2 py-2.5" />
                    <td className="px-2 py-2.5" />
                    <td className="px-2 py-2.5 text-center text-sm font-bold text-foreground">
                      {totalPrevQuota}
                    </td>
                    <td className="px-2 py-2.5 text-center text-sm font-bold text-foreground">
                      {totalLimit}
                    </td>
                    <td className="px-2 py-2.5 text-center text-sm font-bold text-foreground">
                      {totalCurrentQuota}
                    </td>
                    <td className="px-2 py-2.5" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* 結核病計畫容額（僅內科版型，欄位比照填報端） */}
        {isInternalMedicine && tuberculosisHospitals && tuberculosisHospitals.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-bold text-foreground">結核病計畫容額</h3>
            <div className="overflow-hidden rounded-lg bg-card shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50 text-sm font-medium text-muted-foreground">
                    <th className="w-10 whitespace-nowrap px-2 py-2.5 text-left">編號</th>
                    <th className="min-w-[240px] whitespace-nowrap px-2 py-2.5 text-left">醫院名稱</th>
                    <th className="whitespace-nowrap px-2 py-2.5 text-left">所在地</th>
                    <th className="whitespace-nowrap px-2 py-2.5 text-center">可收訓容額</th>
                    <th className="whitespace-nowrap px-2 py-2.5 text-center">建議分配</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tuberculosisHospitals.map((hospital) => (
                    <tr key={hospital.id} className="hover:bg-muted/30">
                      <td className="px-2 py-3 text-sm text-muted-foreground">{hospital.id}</td>
                      <td className="px-2 py-3 text-sm font-medium">{hospital.name}</td>
                      <td className="whitespace-nowrap px-2 py-3 text-sm">{hospital.county}</td>
                      <td className="px-2 py-3 text-center text-sm">{hospital.limit ?? "—"}</td>
                      <td className="px-2 py-3 text-center text-sm">{hospital.currentQuota ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/30">
                    <td className="px-2 py-2.5 text-sm font-semibold text-foreground">合計</td>
                    <td className="px-2 py-2.5" />
                    <td className="px-2 py-2.5" />
                    <td className="px-2 py-2.5 text-center text-sm font-bold text-foreground">
                      {tuberculosisHospitals.reduce((sum, h) => sum + (h.limit ?? 0), 0)}
                    </td>
                    <td className="px-2 py-2.5 text-center text-sm font-bold text-foreground">
                      {tuberculosisHospitals.reduce((sum, h) => sum + (h.currentQuota ?? 0), 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* 不合格醫院名單（欄位比照填報端：編號／醫院名稱／不合格原因） */}
        {disqualifiedHospitals.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-bold text-foreground">不合格醫院名單</h3>
            <div className="overflow-hidden rounded-lg bg-card shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50 text-sm font-medium text-muted-foreground">
                    <th className="w-10 whitespace-nowrap px-2 py-2.5 text-left">編號</th>
                    <th className="min-w-[240px] whitespace-nowrap px-2 py-2.5 text-left">醫院名稱</th>
                    <th className="px-2 py-2.5 text-left">不合格原因</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {disqualifiedHospitals.map((hospital) => (
                    <tr key={hospital.id} className="hover:bg-muted/30">
                      <td className="px-2 py-3 text-sm text-muted-foreground">{hospital.id}</td>
                      <td className="px-2 py-3 text-sm font-medium">{hospital.name}</td>
                      <td className="px-2 py-3 text-sm text-muted-foreground">{hospital.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 未申請醫院名單（欄位比照填報端） */}
        {notAppliedHospitals && notAppliedHospitals.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-bold text-foreground">未申請醫院名單</h3>
            <div className="overflow-hidden rounded-lg bg-card shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50 text-sm font-medium text-muted-foreground">
                    <th className="w-10 whitespace-nowrap px-2 py-2.5 text-left">編號</th>
                    <th className="min-w-[240px] whitespace-nowrap px-2 py-2.5 text-left">醫院名稱</th>
                    <th className="whitespace-nowrap px-2 py-2.5 text-left">前一年度訓練資格</th>
                    <th className="px-2 py-2.5 text-left">未申請原因</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {notAppliedHospitals.map((hospital) => (
                    <tr key={hospital.id} className="hover:bg-muted/30">
                      <td className="px-2 py-3 text-sm text-muted-foreground">{hospital.id}</td>
                      <td className="px-2 py-3 text-sm font-medium">{hospital.name}</td>
                      <td className="px-2 py-3 text-sm text-muted-foreground">
                        {hospital.prevQualification}
                      </td>
                      <td className="px-2 py-3 text-sm text-muted-foreground">{hospital.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 備註區塊（唯讀顯示） */}
        {(() => {
          const autoNotes = hospitals
            .filter((h) => !h.isSubRow && quotaNotesStore.hospitalNotes[String(h.id)])
            .map((h) => ({
              hospitalId: String(h.id),
              content: quotaNotesStore.hospitalNotes[String(h.id)],
            }))

          if (autoNotes.length === 0) return null

          return (
            <div className="mb-6">
              <h3 className="mb-4 text-lg font-bold text-foreground">備註</h3>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {autoNotes.map((item, idx) => (
                      <div key={item.hospitalId} className="flex items-start gap-4 px-6 py-4">
                        <span className="w-6 shrink-0 pt-0.5 text-base font-medium text-muted-foreground">
                          {idx + 1}.
                        </span>
                        <p className="flex-1 whitespace-pre-wrap text-base text-foreground">
                          {item.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })()}

        {/* 審查操作區：已公告為最終結果，不再提供審查操作 */}
        {!isAnnounced && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">審查操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>審查評語</Label>
                <Textarea
                  placeholder="請輸入審查評語或會議決議內容..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="min-h-32"
                />
              </div>

              <div className="space-y-2">
                <Label>上傳會議記錄</Label>
                <div className="cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50">
                  <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-base text-muted-foreground">點擊或拖曳檔案至此處上傳</p>
                  <p className="mt-1 text-base text-muted-foreground">支援 PDF、DOC、DOCX 格式</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  審查結果 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={reviewResult}
                  onValueChange={(v) => setReviewResult(v as typeof reviewResult)}
                >
                  <SelectTrigger className="w-72">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <span className="font-medium text-gray-600">待審查</span>
                    </SelectItem>
                    <SelectItem value="approved">
                      <span className="font-medium text-green-600">通過</span>
                    </SelectItem>
                    <SelectItem value="returned">
                      <span className="font-medium text-orange-600">退件（退回醫學會補正）</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {reviewResult === "returned"
                    ? `退件後案件離開「${society.stage}」進入退件補正中；醫學會重新送件後回到本階段續審。`
                    : "審查結果記錄後，由列表頁統一批次推進至下一階段。"}
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <Button variant="outline">儲存草稿</Button>
                <Button className="bg-[#2d3a8c] hover:bg-[#252f73]">確認送出</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
