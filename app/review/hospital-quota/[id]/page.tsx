"use client"

import { use, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Upload, FileText, Download, Eye } from "lucide-react"
import { getHospitalQuotaDetail, getHospitalQuotaStageConfig } from "@/lib/mock/review-hospital-quota"
import { quotaNotesStore } from "@/lib/stores/quota-notes-store"

export default function HospitalQuotaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const detail = getHospitalQuotaDetail(id)
  const stageConfig = getHospitalQuotaStageConfig()

  const [reviewComment, setReviewComment] = useState(detail?.reviewComment || "")
  const [reviewResult, setReviewResult] = useState<"pending" | "approved" | "needs-revision">(
    detail?.society.reviewResult || "pending"
  )

  if (!detail) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">找不到該醫學會</h2>
            <Button asChild>
              <Link href="/review/hospital-quota">返回列表</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const { society, hospitals, disqualifiedHospitals, groupReviewData } = detail
  const isMainReview = society.stage === "main-review"
  const isUploadPending = society.stage === "upload-pending"

  // 為聯合申請組合分配顏色
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

  // 統計數字計算
  const mainRows = hospitals.filter((h) => !h.isSubRow)
  const mainTrainingCount = mainRows.filter((h) => !h.groupId).length
  const cooperationCount = mainRows.reduce((acc, h) => acc + (h.partnerHospitalCodes?.length ?? 0), 0)
  const totalApplied = mainRows.length
  const disqualifiedCount = disqualifiedHospitals.length
  const qualifiedCount = totalApplied - disqualifiedCount
  const notAppliedCount = 0 // 未申請家數（mock 資料暫無此欄位）

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Link
          href="/review/hospital-quota"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回醫院容額分配審查
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{society.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline">{society.year}</Badge>
              <Badge className={stageConfig[society.stage].color}>
                {stageConfig[society.stage].label}
              </Badge>
              <span className="text-base text-gray-500">送件日期：{society.submittedDate}</span>
            </div>
          </div>
        </div>

        {/* 訓練醫院申請家數統計 */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-foreground mb-4">訓練醫院申請家數</h3>
          <div className="grid grid-cols-3 gap-4">
            {/* 申請家數（含子分類：合格/不合格） */}
            <div className="rounded-lg border border-blue-200 overflow-hidden bg-blue-50 flex">
              {/* 左：申請總數 */}
              <div className="flex-1 px-5 py-4 flex flex-col justify-center">
                <p className="text-sm text-blue-600 mb-1">申請家數</p>
                <p className="text-3xl font-bold text-blue-700">{totalApplied}</p>
                <p className="text-sm text-blue-600/70 mt-1.5">
                  {mainTrainingCount} 家主訓、{cooperationCount} 家合作
                </p>
              </div>
              {/* 右：合格/不合格 上下堆疊 */}
              <div className="flex flex-col divide-y divide-blue-200 border-l border-blue-200 w-28">
                <div className="px-4 py-3 bg-green-50/80 flex-1 flex flex-col justify-center">
                  <p className="text-sm text-green-600 mb-0.5">合格</p>
                  <p className="text-xl font-bold text-green-700">{qualifiedCount}</p>
                </div>
                <div className={`px-4 py-3 flex-1 flex flex-col justify-center ${disqualifiedCount > 0 ? "bg-red-50/80" : "bg-gray-50/60"}`}>
                  <p className={`text-sm mb-0.5 ${disqualifiedCount > 0 ? "text-red-600" : "text-gray-500"}`}>不合格</p>
                  <p className={`text-xl font-bold ${disqualifiedCount > 0 ? "text-red-700" : "text-gray-400"}`}>{disqualifiedCount}</p>
                </div>
              </div>
            </div>

            {/* 未申請家數 */}
            <div className={`rounded-lg border px-5 py-4 flex flex-col justify-center ${notAppliedCount > 0 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"}`}>
              <p className={`text-sm mb-1 ${notAppliedCount > 0 ? "text-amber-600" : "text-gray-500"}`}>未申請家數</p>
              <p className={`text-3xl font-bold ${notAppliedCount > 0 ? "text-amber-700" : "text-gray-400"}`}>{notAppliedCount}</p>
            </div>

            {/* 佔位 - 保持三欄對齊 */}
            <div></div>
          </div>
        </div>

        {/* RRC 大會審核階段：顯示分組會議資料 */}
        {(isMainReview || isUploadPending) && groupReviewData && (
          <Card className="mb-6 border-purple-200 bg-purple-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-purple-900">
                分組會議審查結果
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-base text-gray-600">
                    會議日期：<span className="font-medium text-gray-900">{groupReviewData.meetingDate}</span>
                  </p>
                  <p className="text-base text-gray-600">
                    審查決議：<Badge variant="outline" className="ml-1 bg-green-50 text-green-700 border-green-200">{groupReviewData.decision}</Badge>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Eye className="h-4 w-4" />
                    檢視會議記錄
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-4 w-4" />
                    下載
                  </Button>
                </div>
              </div>
              <p className="text-base text-gray-500">
                檔案：{groupReviewData.meetingRecord}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 訓練醫院名單與容額分配 */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-foreground mb-4">訓練醫院名單與容額分配</h3>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16">序號</TableHead>
                    <TableHead>醫事機構代碼</TableHead>
                    <TableHead>訓練醫院全銜</TableHead>
                    <TableHead>醫院所在地</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>效期</TableHead>
                    <TableHead>延長效期</TableHead>
                    <TableHead className="text-center">容額上限</TableHead>
                    <TableHead className="text-center">前年度核定容額</TableHead>
                    <TableHead className="text-center">本年度容額</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hospitals.map((hospital) => {
                    const groupStyle = hospital.groupId ? groupColors[hospital.groupId] : ""
                    const hasNote = quotaNotesStore.hospitalNotes[String(hospital.id)]
                    return (
                      <TableRow
                        key={hospital.id}
                        className={`${groupStyle ? `border-l-4 ${groupStyle}` : ""} ${hospital.isSubRow ? "bg-muted/20" : ""}`}
                      >
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {!hospital.isSubRow ? hospital.id : ""}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {hospital.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {hospital.groupId && !hospital.isSubRow ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-medium">主訓</span>
                                {hasNote && <span className="text-destructive" title="此醫院有備註">*</span>}
                                {(hospital.mainHospitalCodes ?? [hospital.code]).map((code, i) => {
                                  const h = hospitals.find(hh => hh.code === code)
                                  return (
                                    <span key={code} className="text-sm font-medium">
                                      {h?.name ?? code}{i < (hospital.mainHospitalCodes ?? []).length - 1 ? "、" : ""}
                                    </span>
                                  )
                                })}
                              </div>
                              {(hospital.partnerHospitalCodes ?? []).length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-sm bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">合作</span>
                                  {(hospital.partnerHospitalCodes ?? []).map((code, i) => {
                                    const h = hospitals.find(hh => hh.code === code)
                                    return (
                                      <span key={code} className="text-sm text-muted-foreground">
                                        {h?.name ?? code}{i < (hospital.partnerHospitalCodes ?? []).length - 1 ? "、" : ""}
                                      </span>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          ) : hospital.isSubRow ? (
                            <span className="text-sm text-muted-foreground pl-2">{hospital.name}</span>
                          ) : (
                            <>
                              {hasNote && <span className="text-destructive mr-0.5" title="此醫院有備註">*</span>}
                              {hospital.name}
                            </>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {hospital.county ? (
                            <span className="text-foreground">{hospital.county}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {hospital.status && (
                            <Badge className={hospital.statusColor}>{hospital.status}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{hospital.expiry}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{hospital.extension}</TableCell>
                        <TableCell className="text-center font-medium">
                          {hospital.limit !== null ? hospital.limit : "-"}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {hospital.prevQuota !== null ? hospital.prevQuota : "-"}
                        </TableCell>
                        <TableCell className="text-center font-medium text-primary">
                          {hospital.currentQuota !== null ? hospital.currentQuota : "-"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* 不合格醫院名單 */}
        {disqualifiedHospitals.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-foreground mb-4">不合格醫院名單</h3>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-16">序號</TableHead>
                      <TableHead>醫事機構代碼</TableHead>
                      <TableHead>訓練醫院全銜</TableHead>
                      <TableHead>不合格原因</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disqualifiedHospitals.map((hospital) => (
                      <TableRow key={hospital.id}>
                        <TableCell className="text-muted-foreground">{hospital.id}</TableCell>
                        <TableCell className="text-muted-foreground">{hospital.code}</TableCell>
                        <TableCell className="font-medium">{hospital.name}</TableCell>
                        <TableCell className="text-muted-foreground">{hospital.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
              <h3 className="text-lg font-bold text-foreground mb-4">備註</h3>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {autoNotes.map((item, idx) => (
                      <div key={item.hospitalId} className="flex items-start gap-4 px-6 py-4">
                        <span className="text-base font-medium text-muted-foreground w-6 shrink-0 pt-0.5">
                          {idx + 1}.
                        </span>
                        <p className="flex-1 text-base text-foreground whitespace-pre-wrap">{item.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })()}

        {/* 審查操作區 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">審查操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 審查評語 */}
            <div className="space-y-2">
              <Label>審查評語</Label>
              <Textarea
                placeholder="請輸入審查評語或會議決議內容..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="min-h-32"
              />
            </div>

            {/* 上傳會議記錄 */}
            <div className="space-y-2">
              <Label>上傳會議記錄</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-base text-muted-foreground">
                  點擊或拖曳檔案至此處���傳
                </p>
                <p className="text-base text-muted-foreground mt-1">
                  支援 PDF、DOC、DOCX 格式
                </p>
              </div>
            </div>

            {/* 審查結果 */}
            <div className="space-y-2">
              <Label>審查結果 <span className="text-destructive">*</span></Label>
              <Select value={reviewResult} onValueChange={(v) => setReviewResult(v as typeof reviewResult)}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">
                    <span className="text-green-600 font-medium">通過</span>
                  </SelectItem>
                  <SelectItem value="needs-revision">
                    <span className="text-orange-600 font-medium">需補件</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                審查結果記錄後，由列表頁統一批次推進至下一階段。
              </p>
            </div>

            {/* 操作按鈕 */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline">
                儲存草稿
              </Button>
              <Button className="bg-[#2d3a8c] hover:bg-[#252f73]">
                確認送出
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
