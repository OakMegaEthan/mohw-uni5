"use client"

// 容額微調審查（醫事司視角）。
//
// 微調的審查鏈只有醫事司一段：醫學會送出後直接進此頁，不經醫策會初審／分組會議／RRC 大會。
// 終點是「審查通過」，比照其他三線交棒公告管理（見 docs/business-logic.md）。
//
// 醫事司視角：跨醫學會，故列表以科別辨識案件（醫學會名稱與科別一對一，科別較短且足以識別）。
// 同一科可能有多次微調，故「次數」是必要欄位。
// 增減的細節在詳情頁的異動對照表，列表層級不重複攤開。

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChevronRight, Inbox, Search } from "lucide-react"

import { PageContainer, PageHeader } from "@/components/layout/page-container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ADJUSTMENT_RETURNED_BUCKET,
  QUOTA_ADJUSTMENT_STAGE_CONFIG,
  getBalance,
  getQuotaAdjustmentCases,
  type QuotaAdjustmentCase,
} from "@/lib/mock/quota-adjustment"

type Bucket = "醫事司審查" | "returned" | "審查通過"

const BUCKETS: Array<{ value: Bucket; label: string }> = [
  { value: "醫事司審查", label: "待審查" },
  { value: "returned", label: ADJUSTMENT_RETURNED_BUCKET.label },
  { value: "審查通過", label: "已審結" },
]

/** 案件歸在哪個分頁：退件是與階段並行的一等狀態，優先於階段 */
function bucketOf(c: QuotaAdjustmentCase): Bucket | null {
  if (c.returnedFrom) return "returned"
  if (c.stage === "醫事司審查") return "醫事司審查"
  if (c.stage === "審查通過") return "審查通過"
  return null // 待送件：醫學會端尚未送出，審查端不呈現
}

export default function QuotaAdjustmentReviewPage() {
  const [bucket, setBucket] = useState<Bucket>("醫事司審查")
  const [keyword, setKeyword] = useState("")
  const [tick] = useState(0)

  const cases = useMemo(() => getQuotaAdjustmentCases(), [tick])

  const counts = useMemo(() => {
    const c = { 醫事司審查: 0, returned: 0, 審查通過: 0 } as Record<Bucket, number>
    cases.forEach((x) => {
      const b = bucketOf(x)
      if (b) c[b] += 1
    })
    return c
  }, [cases])

  const rows = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    return cases
      .filter((c) => bucketOf(c) === bucket)
      .filter((c) => (q === "" ? true : c.specialty.toLowerCase().includes(q)))
      .sort((a, b) => (a.submittedDate ?? "").localeCompare(b.submittedDate ?? ""))
  }, [cases, bucket, keyword])

  return (
    <PageContainer>
      <PageHeader
        title="容額微調審查"
        description="醫學會於既有訓練醫院之間調整容額，總數不變。此鏈只有醫事司一段審查"
      />

      <div className="mb-4 flex items-center gap-6 border-b border-gray-200">
        {BUCKETS.map((b) => (
          <button
            key={b.value}
            onClick={() => setBucket(b.value)}
            className={`relative -mb-px flex items-center gap-2 border-b-2 px-1 pb-3 text-base font-medium transition-colors ${
              bucket === b.value
                ? "border-[#2d3a8c] text-[#2d3a8c]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {b.label}
            <Badge variant="secondary" className="text-sm">
              {counts[b.value]}
            </Badge>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜尋科別"
            className="h-10 w-72 pl-9"
          />
        </div>
        <span className="ml-auto text-base text-gray-500">共 {rows.length} 筆</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>科別</TableHead>
              <TableHead className="w-28">年度</TableHead>
              <TableHead className="w-24 text-center">次數</TableHead>
              <TableHead className="w-28 text-right">異動家數</TableHead>
              <TableHead className="w-32">送出日期</TableHead>
              <TableHead className="w-28">狀態</TableHead>
              <TableHead className="w-28 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <Inbox className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-base text-gray-500">此分頁目前沒有案件</p>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c) => {
                const b = getBalance(c.rows)
                return (
                  <TableRow key={c.id} className="h-14">
                    <TableCell className="text-base font-medium text-gray-900">
                      {c.specialty}
                    </TableCell>
                    <TableCell className="text-base text-gray-600">{c.year}</TableCell>
                    <TableCell className="text-center text-base text-gray-600">
                      第 {c.round} 次
                    </TableCell>
                    <TableCell className="text-right text-base text-gray-700">
                      {b.changedCount} 家
                    </TableCell>
                    <TableCell className="text-base text-gray-600">
                      {c.submittedDate ?? "—"}
                    </TableCell>
                    <TableCell>
                      {c.returnedFrom ? (
                        <Badge variant="outline" className={ADJUSTMENT_RETURNED_BUCKET.color}>
                          {ADJUSTMENT_RETURNED_BUCKET.label}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className={QUOTA_ADJUSTMENT_STAGE_CONFIG[c.stage].color}
                        >
                          {QUOTA_ADJUSTMENT_STAGE_CONFIG[c.stage].label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm" className="gap-1">
                        <Link href={`/review/quota-adjustment/${c.id}`}>
                          {c.stage === "審查通過" ? "檢視" : "審查"}
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </PageContainer>
  )
}
