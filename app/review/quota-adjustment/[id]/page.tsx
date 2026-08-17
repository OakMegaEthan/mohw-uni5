"use client"

// 容額微調審查詳情（醫事司）。審查通過即為終點，交棒公告管理。
//
// 版面順序刻意由「結論」到「細節」：先給調增／調減的結餘，再給只列異動醫院的對照表，
// 最後才是完整名單與附件——醫事司審核時最重視的是「哪間減、哪間增」。
//
// 審查通過後為真唯讀：把審查操作卡整張不 render（不是 disable），比照容額填報審查詳情。

import { use, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowDown, ArrowLeft, ArrowUp, Check, FileText, Info } from "lucide-react"

import { PageContainer } from "@/components/layout/page-container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AdjustmentReasonHint } from "@/components/filing/adjustment-reason-hint"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ADJUSTMENT_RETURNED_BUCKET,
  QUOTA_ADJUSTMENT_STAGE_CONFIG,
  approveAdjustment,
  getBalance,
  getQuotaAdjustmentCase,
  returnAdjustment,
  rowDelta,
} from "@/lib/mock/quota-adjustment"

const TODAY_ROC = "115/06/20"

export default function QuotaAdjustmentReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const reviewCase = getQuotaAdjustmentCase(id)

  const [comment, setComment] = useState(reviewCase?.reviewComment ?? "")
  const [stage, setStage] = useState(reviewCase?.stage)
  const [returned, setReturned] = useState(reviewCase?.returnedFrom ?? null)

  const balance = useMemo(() => getBalance(reviewCase?.rows ?? []), [reviewCase])
  const changedRows = useMemo(
    () => (reviewCase?.rows ?? []).filter((r) => rowDelta(r) !== 0),
    [reviewCase],
  )

  if (!reviewCase) {
    return (
      <PageContainer>
        <BackLink />
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-base text-gray-500">找不到此案件</p>
        </div>
      </PageContainer>
    )
  }

  const isPassed = stage === "審查通過"
  const isReturned = returned !== null

  const handleApprove = () => {
    approveAdjustment(reviewCase.id, comment, TODAY_ROC)
    setStage("審查通過")
    setReturned(null)
    toast.success("審查通過", { description: "案件已交棒公告管理，可製作公告文件" })
    setTimeout(() => router.push("/review/quota-adjustment"), 0)
  }

  const handleReturn = () => {
    if (!comment.trim()) {
      toast.error("請填寫退件意見")
      return
    }
    returnAdjustment(reviewCase.id, comment, TODAY_ROC)
    setReturned("醫事司審查")
    toast.success("已退件", { description: "案件退回醫學會補正，補正重送後回醫事司續審" })
    setTimeout(() => router.push("/review/quota-adjustment"), 0)
  }

  return (
    <PageContainer>
      <BackLink />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {reviewCase.societyName}　容額微調審查
          </h1>
          <p className="mt-1 text-base text-gray-600">
            {reviewCase.specialty}　{reviewCase.year}　第 {reviewCase.round} 次微調
            {reviewCase.submittedDate && `　送出日期：${reviewCase.submittedDate}`}
          </p>
        </div>
        {isReturned ? (
          <Badge variant="outline" className={ADJUSTMENT_RETURNED_BUCKET.color}>
            {ADJUSTMENT_RETURNED_BUCKET.label}
          </Badge>
        ) : (
          <Badge variant="outline" className={QUOTA_ADJUSTMENT_STAGE_CONFIG[stage!].color}>
            {QUOTA_ADJUSTMENT_STAGE_CONFIG[stage!].label}
          </Badge>
        )}
      </div>

      {isPassed && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4">
          <Check className="h-5 w-5 shrink-0 text-green-700" />
          <span className="text-base font-medium text-green-800">
            本案審查通過，已交棒公告管理（可於「公告文件製作」的外加/微調容額製作公告文件）
          </span>
        </div>
      )}

      <div className="space-y-6">
        {/* 一、結餘：醫事司最重視的資訊放最上面 */}
        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="flex flex-wrap items-center gap-x-10 gap-y-3 py-5">
            <div>
              <p className="text-sm text-gray-500">調增合計</p>
              <p className="flex items-center gap-1 text-2xl font-bold text-blue-700">
                <ArrowUp className="h-5 w-5" />＋{balance.increased}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">調減合計</p>
              <p className="flex items-center gap-1 text-2xl font-bold text-orange-700">
                <ArrowDown className="h-5 w-5" />－{balance.decreased}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">淨變動</p>
              <p
                className={`text-2xl font-bold ${
                  balance.net === 0 ? "text-green-700" : "text-red-600"
                }`}
              >
                {balance.net}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">異動家數</p>
              <p className="text-2xl font-bold text-gray-900">{balance.changedCount}</p>
            </div>
            <div className="ml-auto flex items-center gap-2 text-base">
              {balance.net === 0 ? (
                <span className="flex items-center gap-2 font-medium text-green-800">
                  <Check className="h-5 w-5" />
                  總容額不變（送出前已檢核）
                </span>
              ) : (
                <span className="font-medium text-red-700">總容額有變動，請確認</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 二、異動對照表：只列有變動的醫院 */}
        <Card>
          <CardHeader>
            {/* 名稱與醫學會匯出、隨紙本公文檢附的那份文件一致，避免同一張表兩個名字 */}
            <CardTitle className="text-lg">
              一、容額異動修正對照表（{changedRows.length} 家）
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>訓練醫院</TableHead>
                    <TableHead className="w-24">所在地</TableHead>
                    <TableHead className="w-28 text-right">原公告</TableHead>
                    <TableHead className="w-28 text-right">調整後</TableHead>
                    <TableHead className="w-24 text-right">增減</TableHead>
                    <TableHead className="w-64">
                      微調原因
                      <AdjustmentReasonHint />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {changedRows.map((r) => {
                    const d = rowDelta(r)
                    return (
                      <TableRow key={r.hospitalCode} className="h-14">
                        <TableCell className="text-base font-medium text-gray-900">
                          {r.hospitalName}
                        </TableCell>
                        <TableCell className="text-base text-gray-600">{r.county}</TableCell>
                        <TableCell className="text-right text-base text-gray-600">
                          {r.baseQuota}
                        </TableCell>
                        <TableCell className="text-right text-base font-medium text-gray-900">
                          {r.adjustedQuota}
                        </TableCell>
                        <TableCell className="text-right text-base font-medium">
                          {d > 0 ? (
                            <span className="text-blue-700">＋{d}</span>
                          ) : (
                            <span className="text-orange-700">－{-d}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-base text-gray-700">{r.reason || "—"}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 三、完整名單 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              二、調整後完整容額名單（{reviewCase.rows.length} 家）
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>訓練醫院</TableHead>
                    <TableHead className="w-24">所在地</TableHead>
                    <TableHead className="w-28 text-right">原公告</TableHead>
                    <TableHead className="w-28 text-right">調整後</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewCase.rows.map((r) => {
                    const d = rowDelta(r)
                    return (
                      <TableRow
                        key={r.hospitalCode}
                        className={d !== 0 ? "bg-blue-50/40" : undefined}
                      >
                        <TableCell className="text-base text-gray-900">{r.hospitalName}</TableCell>
                        <TableCell className="text-base text-gray-600">{r.county}</TableCell>
                        <TableCell className="text-right text-base text-gray-600">
                          {r.baseQuota}
                        </TableCell>
                        <TableCell className="text-right text-base font-medium text-gray-900">
                          {r.adjustedQuota}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 四、附件 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">三、附件（{reviewCase.attachments.length}）</CardTitle>
          </CardHeader>
          <CardContent>
            {reviewCase.attachments.length === 0 ? (
              <p className="py-4 text-base text-gray-500">醫學會未檢附附件</p>
            ) : (
              <div className="space-y-2">
                {reviewCase.attachments.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-base font-medium text-gray-900">{f.name}</p>
                      <p className="text-sm text-gray-500">{f.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 五、審查歷程 */}
        {reviewCase.history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">四、審查歷程</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {reviewCase.history.map((h, i) => (
                  <li key={i} className="flex items-center gap-3 text-base text-gray-700">
                    <span className="w-24 shrink-0 text-gray-500">{h.at}</span>
                    <span className="w-40 shrink-0">{h.by}</span>
                    <span>{h.action}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 六、審查操作：審查通過後整張不 render（真唯讀） */}
        {!isPassed && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">五、審查</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isReturned && (
                <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                  <span className="text-base text-orange-900">
                    本案已退件，等待醫學會補正重送。重送後回醫事司續審，不重走整條鏈。
                  </span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="comment" className="text-base">
                  審查意見{isReturned ? "" : "（退件時必填）"}
                </Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="就容額異動內容之審查意見…"
                  className="min-h-28 text-base"
                />
              </div>
              {!isReturned && (
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Button variant="outline" onClick={handleReturn}>
                    退件補正
                  </Button>
                  <Button
                    onClick={handleApprove}
                    className="bg-[#2d3a8c] text-white hover:bg-[#252f73]"
                  >
                    審查通過
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  )
}

function BackLink() {
  return (
    <Link
      href="/review/quota-adjustment"
      className="mb-4 inline-flex items-center gap-1 text-base text-blue-600 hover:text-blue-800"
    >
      <ArrowLeft className="h-4 w-4" />
      返回容額微調審查
    </Link>
  )
}
