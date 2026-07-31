"use client"

// 待公告案件工作台。
//
// 三條審查主線審查通過後，案件落到這裡等醫事司辦理公告。依客戶確認的「製作→發布」模型，
// 每案有兩條獨立的下一步（見 docs/business-logic.md）：
//   1) 製作公告檔案（官網公告文件，per 醫學會，文號手動輸入）→ 已製作，可重用
//   2) 發系統內公告（引用已製作的檔案發布）→ 檔案被引用即「已公告」
// 「去官網公告」＝把已製作檔案的 PDF 拿去官網（系統外，不追蹤）。
// 一次審查會議後可能同時湧入上百筆，故是可篩選、可批次的工作台，非通知鈴鐺。

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  CalendarClock,
  ExternalLink,
  FilePlus2,
  FileText,
  Inbox,
  RotateCcw,
  Search,
  Send,
} from "lucide-react"

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
  CASE_DOC_STATUS_CONFIG,
  PENDING_SOURCES,
  deferCases,
  getCaseDocStatus,
  getPendingCasesBySource,
  getPendingCountBySource,
  getTotalPendingCount,
  officialCorrectionCount,
  produceOfficialDocs,
  restoreCases,
  type CaseDocStatus,
  type PendingCase,
  type PendingSourceModule,
} from "@/lib/mock/announcement-cases"
import { TODAY_ISO, toRocDate } from "@/lib/mock/announcements"

const STATUS_FILTERS: Array<{ value: CaseDocStatus | "all"; label: string }> = [
  { value: "all", label: "全部" },
  { value: "待製作", label: "待製作" },
  { value: "已製作", label: "已製作（待發布）" },
  { value: "已公告", label: "已公告" },
  { value: "已延後", label: "已延後" },
]

export default function PendingCasesPage() {
  const router = useRouter()
  const [source, setSource] = useState<PendingSourceModule>("submissions")
  const [keyword, setKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState<CaseDocStatus | "all">("all")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [produceOpen, setProduceOpen] = useState(false)
  const [produceDate, setProduceDate] = useState(TODAY_ISO)
  const [produceDocNumber, setProduceDocNumber] = useState("")
  const [deferOpen, setDeferOpen] = useState(false)
  const [deferReason, setDeferReason] = useState("")
  const [tick, forceUpdate] = useState(0)

  const sourceConfig = PENDING_SOURCES.find((s) => s.value === source)!
  const counts = useMemo(() => getPendingCountBySource(), [tick])
  const totalPending = useMemo(() => getTotalPendingCount(), [tick])

  const allCases = useMemo(() => getPendingCasesBySource(source), [source, tick])

  const rows = useMemo(() => {
    return allCases
      .filter((c) => (statusFilter === "all" ? true : getCaseDocStatus(c) === statusFilter))
      .filter((c) =>
        keyword.trim() === ""
          ? true
          : `${c.subject}${c.detail}`.toLowerCase().includes(keyword.trim().toLowerCase()),
      )
      .sort((a, b) => a.approvedDate.localeCompare(b.approvedDate))
  }, [allCases, statusFilter, keyword])

  const stats = useMemo(() => {
    const by = (s: CaseDocStatus) => allCases.filter((c) => getCaseDocStatus(c) === s).length
    return { 待製作: by("待製作"), 已製作: by("已製作"), 已公告: by("已公告"), 已延後: by("已延後") }
  }, [allCases])

  // 已公告不可再選；其餘（待製作／已製作／已延後）可選
  const selectableRows = rows.filter((c) => getCaseDocStatus(c) !== "已公告")
  const selectableIds = selectableRows.map((c) => c.id)
  const selected = selectedIds.filter((id) => selectableIds.includes(id))
  const allSelected = selectableIds.length > 0 && selected.length === selectableIds.length

  const selectedCases = useMemo(
    () => allCases.filter((c) => selected.includes(c.id)),
    [allCases, selected],
  )
  // 各批次動作的實際適用對象（依狀態）
  const toProduce = selectedCases.filter((c) => getCaseDocStatus(c) === "待製作")
  const toPublish = selectedCases.filter((c) => getCaseDocStatus(c) === "已製作")
  const toDefer = selectedCases.filter((c) => getCaseDocStatus(c) === "待製作" || getCaseDocStatus(c) === "已製作")
  const toRestore = selectedCases.filter((c) => getCaseDocStatus(c) === "已延後")

  const switchSource = (next: PendingSourceModule) => {
    setSource(next)
    setSelectedIds([])
    setStatusFilter("all")
    setKeyword("")
  }

  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  const toggleAll = () => setSelectedIds(allSelected ? [] : selectableIds)

  const handleProduce = () => {
    if (!produceDocNumber.trim()) return
    produceOfficialDocs(toProduce.map((c) => c.id), produceDate, produceDocNumber.trim())
    setProduceOpen(false)
    setProduceDocNumber("")
    setSelectedIds([])
    forceUpdate((n) => n + 1)
  }

  const handlePublish = () => {
    router.push(
      `/announcement-management/compose?cases=${toPublish.map((c) => c.id).join(",")}&source=${source}`,
    )
  }

  const handleDefer = () => {
    deferCases(toDefer.map((c) => c.id), deferReason.trim() || "未填寫原因")
    setDeferOpen(false)
    setDeferReason("")
    setSelectedIds([])
    forceUpdate((n) => n + 1)
  }

  const handleRestore = () => {
    restoreCases(toRestore.map((c) => c.id))
    setSelectedIds([])
    forceUpdate((n) => n + 1)
  }

  return (
    <PageContainer>
      <PageHeader title="公告管理" description="製作公告檔案、發系統內公告，並準備官網公告文書" />
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

      {/* 本來源概況 */}
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <StatCard label="待製作" value={stats.待製作} tone="amber" />
        <StatCard label="已製作（待發布）" value={stats.已製作} tone="blue" />
        <StatCard label="已公告" value={stats.已公告} tone="green" />
        <StatCard label="已延後" value={stats.已延後} tone="gray" />
      </div>

      {/* 篩選 */}
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
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CaseDocStatus | "all")}>
          <SelectTrigger className="h-10 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-base text-gray-500">共 {rows.length} 筆</span>
      </div>

      {/* 批次動作列 */}
      {selected.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-[#2d3a8c]/30 bg-[#2d3a8c]/5 px-4 py-3">
          <span className="text-base font-medium text-[#2d3a8c]">已選取 {selected.length} 筆</span>
          {toProduce.length > 0 && (
            <Button
              onClick={() => {
                setProduceDate(TODAY_ISO)
                setProduceDocNumber("")
                setProduceOpen(true)
              }}
              className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73]"
            >
              <FilePlus2 className="h-4 w-4" />
              製作公告檔案（{toProduce.length}）
            </Button>
          )}
          {toPublish.length > 0 && (
            <Button onClick={handlePublish} variant="outline" className="gap-2">
              <Send className="h-4 w-4" />
              發系統內公告（{toPublish.length}）
            </Button>
          )}
          {toRestore.length > 0 && (
            <Button onClick={handleRestore} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              還原（{toRestore.length}）
            </Button>
          )}
          {toDefer.length > 0 && (
            <Button variant="outline" className="gap-2" onClick={() => setDeferOpen(true)}>
              <CalendarClock className="h-4 w-4" />
              延後（{toDefer.length}）
            </Button>
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
              <TableHead className="w-32">審查通過日</TableHead>
              <TableHead className="w-48">官網公告文件</TableHead>
              <TableHead className="w-32">系統內公告</TableHead>
              <TableHead className="w-28 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <Inbox className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-base text-gray-500">目前沒有符合條件的案件</p>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c) => {
                const st = getCaseDocStatus(c)
                const selectable = st !== "已公告"
                const corr = officialCorrectionCount(c)
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
                    <TableCell className="text-base text-gray-600">{toRocDate(c.approvedDate)}</TableCell>
                    <TableCell>
                      {c.officialDoc ? (
                        <div className="flex flex-col gap-0.5">
                          <Badge className="w-fit border-green-200 bg-green-100 text-sm text-green-800">
                            已製作{corr > 0 ? `（第 ${corr} 次修正）` : ""}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {c.officialDoc.entries[c.officialDoc.entries.length - 1].docNumber}
                          </span>
                        </div>
                      ) : c.deferReason ? (
                        <Badge className="border-gray-200 bg-gray-100 text-sm text-gray-500">已延後</Badge>
                      ) : (
                        <Badge className="border-amber-200 bg-amber-100 text-sm text-amber-800">未製作</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.publishedPostId ? (
                        <Badge className="border-green-200 bg-green-100 text-sm text-green-800">已發布</Badge>
                      ) : (
                        <Badge className="border-gray-200 bg-gray-100 text-sm text-gray-500">未發布</Badge>
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

      {/* 製作公告檔案：輸入發文日期＋文號（手動），預覽套版後製作 */}
      <Dialog open={produceOpen} onOpenChange={setProduceOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>製作公告檔案</DialogTitle>
            <DialogDescription className="text-base">
              為選取的 {toProduce.length} 筆案件各產生一份官網公告文件（{sourceConfig.subjectLabel}為單位）。
              產出／下載為後端作業，此處僅套版預覽。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="produce-date" className="text-base">
                  發文日期
                </Label>
                <Input
                  id="produce-date"
                  type="date"
                  value={produceDate}
                  onChange={(e) => setProduceDate(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="produce-docnum" className="text-base">
                  公文文號 *
                </Label>
                <Input
                  id="produce-docnum"
                  value={produceDocNumber}
                  onChange={(e) => setProduceDocNumber(e.target.value)}
                  className="h-11"
                  placeholder="例：衛部醫字第 1151661796 號"
                />
              </div>
            </div>

            {/* 套版預覽（比照 ref 認定合格名單表頭） */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <p className="mb-2 text-sm text-gray-500">預覽（每筆案件各一份）</p>
              <p className="text-center text-lg font-bold text-gray-900">
                衛生福利部 {toProduce[0]?.year ?? "115 年度"}
                {toProduce[0]?.subject ?? "○○醫學會"} 訓練醫院認定合格名單及訓練容量
              </p>
              <p className="mt-1 text-right text-base text-gray-700">
                {toRocDate(produceDate)}　{produceDocNumber || "（未填文號）"} 號公告
              </p>
              <div className="mt-3 rounded border border-dashed border-gray-300 bg-gray-50 py-6 text-center text-sm text-gray-400">
                醫院名稱／所在地／訓練容量／資格效期 名單表（由系統帶入審查結果）
              </div>
            </div>

            <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200">
              {toProduce.map((c) => (
                <div key={c.id} className="flex items-center gap-2 border-b px-3 py-2 last:border-b-0">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-base text-gray-800">
                    {c.subject}　{c.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProduceOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleProduce}
              disabled={!produceDocNumber.trim()}
              className="bg-[#2d3a8c] hover:bg-[#252f73]"
            >
              製作 {toProduce.length} 份
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 延後 */}
      <Dialog open={deferOpen} onOpenChange={setDeferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>延後至下批</DialogTitle>
            <DialogDescription className="text-base">
              選取的 {toDefer.length} 筆案件本批不辦理，仍留在工作台，可隨時還原。
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
              placeholder="例：待醫學會補正容額數字後再併入下批"
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
  tone: "amber" | "blue" | "green" | "gray"
}) {
  const toneClass = {
    amber: "text-amber-600",
    blue: "text-blue-600",
    green: "text-green-600",
    gray: "text-gray-500",
  }[tone]
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className={`text-base ${toneClass}`}>{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
