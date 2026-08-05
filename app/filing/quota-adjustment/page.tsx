"use client"

// 容額微調列表（醫學會端）。一個醫學會同年度可能有多次微調，故案件是一等物件、需要列表。
//
// mock 說明：實際系統會依登入的醫學會過濾，此處列出全部醫學會的案件以便展示各種狀態，
// 與外加容額列表的處理一致。

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowDown, ArrowLeft, ArrowUp, ChevronRight, Inbox, Plus, Search } from "lucide-react"

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

type Tab = "all" | "待送件" | "醫事司審查" | "審查通過"

const TABS: Array<{ value: Tab; label: string }> = [
  { value: "all", label: "全部" },
  { value: "待送件", label: "待送件" },
  { value: "醫事司審查", label: "審查中" },
  { value: "審查通過", label: "已通過" },
]

function matchesTab(c: QuotaAdjustmentCase, tab: Tab): boolean {
  if (tab === "all") return true
  // 退件補正中的案件回到醫學會手上，歸在「待送件」（待補正重送）
  if (tab === "待送件") return c.stage === "待送件" || c.returnedFrom !== null
  if (tab === "醫事司審查") return c.stage === "醫事司審查" && c.returnedFrom === null
  return c.stage === "審查通過"
}

export default function QuotaAdjustmentListPage() {
  const [tab, setTab] = useState<Tab>("all")
  const [keyword, setKeyword] = useState("")
  const cases = getQuotaAdjustmentCases()

  const counts = useMemo(() => {
    const c = {} as Record<Tab, number>
    TABS.forEach((t) => (c[t.value] = cases.filter((x) => matchesTab(x, t.value)).length))
    return c
  }, [cases])

  const rows = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    return cases
      .filter((c) => matchesTab(c, tab))
      .filter((c) =>
        q === "" ? true : `${c.societyName}${c.specialty}`.toLowerCase().includes(q),
      )
      .sort((a, b) => (b.submittedDate ?? "9").localeCompare(a.submittedDate ?? "9"))
  }, [cases, tab, keyword])

  return (
    <PageContainer>
      <Link
        href="/filing"
        className="mb-4 inline-flex items-center gap-1 text-base text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="h-4 w-4" />
        返回填報專區
      </Link>

      <PageHeader
        title="容額微調"
        description="在既有訓練醫院之間調整訓練容額。總容額不變——有醫院調增，就要有醫院調減"
      >
        <Button asChild className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73]">
          <Link href="/filing/quota-adjustment/new">
            <Plus className="h-4 w-4" />
            新增容額微調
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-4 flex items-center gap-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`relative -mb-px flex items-center gap-2 border-b-2 px-1 pb-3 text-base font-medium transition-colors ${
              tab === t.value
                ? "border-[#2d3a8c] text-[#2d3a8c]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            <Badge variant="secondary" className="text-sm">
              {counts[t.value]}
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
            placeholder="搜尋醫學會或科別"
            className="h-10 w-72 pl-9"
          />
        </div>
        <span className="ml-auto text-base text-gray-500">共 {rows.length} 筆</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>醫學會</TableHead>
              <TableHead className="w-24">科別</TableHead>
              <TableHead className="w-28">年度</TableHead>
              <TableHead className="w-20 text-center">次數</TableHead>
              <TableHead className="w-24 text-right">異動家數</TableHead>
              <TableHead className="w-40 text-center">調增／調減</TableHead>
              <TableHead className="w-32">送出日期</TableHead>
              <TableHead className="w-32">狀態</TableHead>
              <TableHead className="w-28 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center">
                  <Inbox className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-base text-gray-500">此分頁目前沒有案件</p>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c) => {
                const b = getBalance(c.rows)
                const editable = c.stage === "待送件" || c.returnedFrom !== null
                return (
                  <TableRow key={c.id} className="h-14">
                    <TableCell className="text-base font-medium text-gray-900">
                      {c.societyName}
                    </TableCell>
                    <TableCell className="text-base text-gray-700">{c.specialty}</TableCell>
                    <TableCell className="text-base text-gray-600">{c.year}</TableCell>
                    <TableCell className="text-center text-base text-gray-600">
                      第 {c.round} 次
                    </TableCell>
                    <TableCell className="text-right text-base text-gray-700">
                      {b.changedCount > 0 ? `${b.changedCount} 家` : "—"}
                    </TableCell>
                    <TableCell>
                      {b.changedCount === 0 ? (
                        <p className="text-center text-base text-gray-400">—</p>
                      ) : (
                        <div className="flex items-center justify-center gap-3 text-base font-medium">
                          <span className="flex items-center gap-0.5 text-blue-700">
                            <ArrowUp className="h-4 w-4" />＋{b.increased}
                          </span>
                          <span className="flex items-center gap-0.5 text-orange-700">
                            <ArrowDown className="h-4 w-4" />－{b.decreased}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-base text-gray-600">
                      {c.submittedDate ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge
                          variant="outline"
                          className={QUOTA_ADJUSTMENT_STAGE_CONFIG[c.stage].color}
                        >
                          {QUOTA_ADJUSTMENT_STAGE_CONFIG[c.stage].label}
                        </Badge>
                        {c.returnedFrom && (
                          <Badge variant="outline" className={ADJUSTMENT_RETURNED_BUCKET.color}>
                            退件
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm" className="gap-1">
                        <Link href={`/filing/quota-adjustment/${c.id}`}>
                          {editable ? "填寫" : "檢視"}
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
