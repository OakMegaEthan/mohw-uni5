"use client"

// 待公告案件工作台。
//
// 三條審查主線審查完成後，案件都落到這裡等醫事司辦理公告。一次審查會議後可能同時湧入
// 上百筆（文件填報最多 6 文件類型 × 25 醫學會），故不是通知鈴鐺而是可篩選、可批次的工作台。
// 主要動作是「勾選多筆 → 彙整為一份公告」，案件與公告是多對一。

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CalendarClock, ExternalLink, FileStack, Inbox, RotateCcw, Search } from "lucide-react"

import { PageContainer, PageHeader } from "@/components/layout/page-container"
import { AnnouncementModuleTabs } from "@/components/announcement/module-tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  PENDING_CASE_STATUS_CONFIG,
  PENDING_SOURCES,
  deferCases,
  getPendingCasesBySource,
  getPendingCountBySource,
  getTotalPendingCount,
  restoreCases,
  type PendingSourceModule,
} from "@/lib/mock/announcement-cases"
import { toRocDate } from "@/lib/mock/announcements"

export default function PendingCasesPage() {
  const router = useRouter()
  const [source, setSource] = useState<PendingSourceModule>("submissions")
  const [keyword, setKeyword] = useState("")
  const [detailFilter, setDetailFilter] = useState("all")
  const [showDeferred, setShowDeferred] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deferOpen, setDeferOpen] = useState(false)
  const [deferReason, setDeferReason] = useState("")
  const [tick, forceUpdate] = useState(0)

  const sourceConfig = PENDING_SOURCES.find((s) => s.value === source)!
  const counts = useMemo(() => getPendingCountBySource(), [tick])
  const totalPending = useMemo(() => getTotalPendingCount(), [tick])

  const allCases = useMemo(() => getPendingCasesBySource(source), [source, tick])

  // 第三欄（文件類型／分科／年度）的可選值，直接由案件資料推導
  const detailOptions = useMemo(
    () => [...new Set(allCases.map((c) => c.detail))].sort(),
    [allCases],
  )

  const rows = useMemo(() => {
    return allCases
      .filter((c) => (showDeferred ? c.status === "已延後" : c.status !== "已延後"))
      .filter((c) => (detailFilter === "all" ? true : c.detail === detailFilter))
      .filter((c) =>
        keyword.trim() === ""
          ? true
          : `${c.subject}${c.detail}`.toLowerCase().includes(keyword.trim().toLowerCase()),
      )
      .sort((a, b) => a.approvedDate.localeCompare(b.approvedDate))
  }, [allCases, showDeferred, detailFilter, keyword])

  // 可勾選的：一般檢視下只有「待公告」；已延後檢視下全部（用於還原）
  const selectableIds = useMemo(
    () => rows.filter((c) => c.status === "待公告" || c.status === "已延後").map((c) => c.id),
    [rows],
  )
  const selected = selectedIds.filter((id) => selectableIds.includes(id))
  const allSelected = selectableIds.length > 0 && selected.length === selectableIds.length

  const stats = useMemo(() => {
    return {
      pending: allCases.filter((c) => c.status === "待公告").length,
      drafting: allCases.filter((c) => c.status === "公告編製中").length,
      deferred: allCases.filter((c) => c.status === "已延後").length,
    }
  }, [allCases])

  const switchSource = (next: PendingSourceModule) => {
    setSource(next)
    setSelectedIds([])
    setDetailFilter("all")
    setKeyword("")
    setShowDeferred(false)
  }

  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))

  const toggleAll = () => setSelectedIds(allSelected ? [] : selectableIds)

  const handleCompose = () => {
    router.push(`/announcement-management/compose?cases=${selected.join(",")}&source=${source}`)
  }

  const handleDefer = () => {
    deferCases(selected, deferReason.trim() || "未填寫原因")
    setDeferOpen(false)
    setDeferReason("")
    setSelectedIds([])
    forceUpdate((n) => n + 1)
  }

  const handleRestore = () => {
    restoreCases(selected)
    setSelectedIds([])
    forceUpdate((n) => n + 1)
  }

  return (
    <PageContainer>
      <PageHeader
        title="公告管理"
        description="彙整審查完成的案件、編製公告文稿並對外發布"
      />
      <AnnouncementModuleTabs pendingCount={totalPending} />

      {/* 來源切換：三條審查主線的公告文書格式不同，不跨來源併批 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {PENDING_SOURCES.map((s) => {
          const active = s.value === source
          return (
            <button
              key={s.value}
              onClick={() => switchSource(s.value)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-base transition-colors ${
                active
                  ? "border-[#2d3a8c] bg-[#2d3a8c] text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              {s.label}
              <Badge
                className={`text-sm ${
                  active
                    ? "border-white/30 bg-white/20 text-white"
                    : "border-amber-200 bg-amber-100 text-amber-800"
                }`}
              >
                {counts[s.value]}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* 本來源的案件概況 */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="待公告" value={stats.pending} tone="amber" />
        <StatCard label="公告編製中" value={stats.drafting} tone="blue" />
        <StatCard label="已延後" value={stats.deferred} tone="gray" />
      </div>

      {/* 篩選工具列 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={`搜尋${sourceConfig.subjectLabel}或${sourceConfig.detailLabel}`}
            className="h-10 w-72 pl-9"
          />
        </div>
        <Select value={detailFilter} onValueChange={setDetailFilter}>
          <SelectTrigger className="h-10 w-56">
            <SelectValue placeholder={sourceConfig.detailLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部{sourceConfig.detailLabel}</SelectItem>
            {detailOptions.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-base text-gray-700">
          <Checkbox
            checked={showDeferred}
            onCheckedChange={(v) => {
              setShowDeferred(Boolean(v))
              setSelectedIds([])
            }}
          />
          只看已延後
        </label>
        <span className="ml-auto text-base text-gray-500">共 {rows.length} 筆</span>
      </div>

      {/* 選取後的批次動作列 */}
      {selected.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-[#2d3a8c]/30 bg-[#2d3a8c]/5 px-4 py-3">
          <span className="text-base font-medium text-[#2d3a8c]">已選取 {selected.length} 筆</span>
          {showDeferred ? (
            <Button onClick={handleRestore} className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73]">
              <RotateCcw className="h-4 w-4" />
              還原至待公告
            </Button>
          ) : (
            <>
              <Button onClick={handleCompose} className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73]">
                <FileStack className="h-4 w-4" />
                彙整為公告
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setDeferOpen(true)}>
                <CalendarClock className="h-4 w-4" />
                延後至下批
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={() => setSelectedIds([])}>
            清除選取
          </Button>
        </div>
      )}

      {/* 案件表格 */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  disabled={selectableIds.length === 0}
                  aria-label="全選"
                />
              </TableHead>
              <TableHead>{sourceConfig.subjectLabel}</TableHead>
              <TableHead>{sourceConfig.detailLabel}</TableHead>
              <TableHead className="w-36">審查通過日</TableHead>
              <TableHead className="w-36">狀態</TableHead>
              <TableHead className="w-32 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center">
                  <Inbox className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-base text-gray-500">
                    {showDeferred ? "沒有已延後的案件" : "目前沒有待辦的公告案件"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c) => {
                const selectable = c.status === "待公告" || c.status === "已延後"
                return (
                  <TableRow key={c.id} className="h-14">
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(c.id)}
                        onCheckedChange={() => toggle(c.id)}
                        disabled={!selectable}
                        aria-label={`選取 ${c.subject}`}
                      />
                    </TableCell>
                    <TableCell className="text-base font-medium text-gray-900">{c.subject}</TableCell>
                    <TableCell className="text-base text-gray-700">{c.detail}</TableCell>
                    <TableCell className="text-base text-gray-600">
                      {toRocDate(c.approvedDate)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-sm ${PENDING_CASE_STATUS_CONFIG[c.status].color}`}>
                        {c.status}
                      </Badge>
                      {c.status === "已延後" && c.deferReason && (
                        <p className="mt-1 text-sm text-gray-500">{c.deferReason}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm" className="gap-1">
                        <Link href={c.reviewHref}>
                          <ExternalLink className="h-4 w-4" />
                          檢視審查
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

      {/* 延後：取代舊版那顆會靜默丟棄案件的 X 鈕，需填原因且可還原 */}
      <Dialog open={deferOpen} onOpenChange={setDeferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>延後至下批公告</DialogTitle>
            <DialogDescription className="text-base">
              已選取的 {selected.length} 筆案件本批不列入公告，仍留在待公告池，可隨時還原。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="defer-reason" className="text-base">
              延後原因
            </Label>
            <Textarea
              id="defer-reason"
              value={deferReason}
              onChange={(e) => setDeferReason(e.target.value)}
              rows={3}
              placeholder="例：待醫學會補正容額數字後再併入下批公告"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeferOpen(false)}>
              取消
            </Button>
            <Button onClick={handleDefer} className="bg-[#2d3a8c] hover:bg-[#252f73]">
              確認延後
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "amber" | "blue" | "gray"
}) {
  const toneClass = {
    amber: "text-amber-600",
    blue: "text-blue-600",
    gray: "text-gray-500",
  }[tone]

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className={`text-base ${toneClass}`}>{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
