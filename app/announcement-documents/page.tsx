"use client"

// 公告文件製作（獨立模組）。本模組的對象是「案件」，產出「官網公告文件」（文號掛案件層級）。
// 站內公告是另一個模組（/announcement-management），對象是「一篇公告」，引用本模組產出的檔案。
// 兩者曾以頁內 tab 併為一個「公告管理」模組，因對象不同、層級過深而拆開（見 announcement-module-plan.md 八節）。
//
// 依客戶確認的 IA：以「本模組的作業階段」引導。兩層結構：
//   來源 tab（文件/容額/外加，格式不同不併批）× 階段分頁（待製作 → 已製作）
// 每階段一個明確的下一步：
//   待製作 → 製作公告檔案（輸入文號、套版預覽）
//   已製作 → 帶入「新增站內公告」；且可下載檔案去官網公告
//
// 「是否已發站內公告」不再獨立成一個分頁（2026-08-05 調整）：那是站內公告模組的狀態，
// 拿來切分本模組的作業階段會讓層級變深。改以表格的「系統內公告」欄表達——有日期＝已公告，
// 無＝尚未發布。本工作台仍需呈現它：拆成兩個模組後沒有 tab 可跳過去對照，使用者要能在此
// 自答「這案還缺哪一步」。勿當成未清乾淨的耦合移除。
//
// 已公告的案件不可再被勾選帶入站內公告（會覆蓋既有的 publishedPostId），故其列不給勾選框。

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Download, ExternalLink, FilePlus2, FileText, Inbox, Search, Send } from "lucide-react"

import { PageContainer, PageHeader } from "@/components/layout/page-container"
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
import {
  CASE_KIND_CONFIG,
  PENDING_SOURCES,
  getCaseDocStatus,
  getPendingCasesBySource,
  getPendingCountBySource,
  officialCorrectionCount,
  produceOfficialDocs,
  type PendingCase,
  type PendingCaseKind,
  type PendingSourceModule,
} from "@/lib/mock/announcement-cases"
import { TODAY_ISO, toRocDate } from "@/lib/mock/announcements"

/** 工作台的作業階段。已製作涵蓋資料層的「已製作」與「已公告」——是否已發站內公告改為欄位。 */
type WorkbenchStage = "待製作" | "已製作"

const STAGES: Array<{ value: WorkbenchStage; label: string }> = [
  { value: "待製作", label: "待製作" },
  { value: "已製作", label: "已製作" },
]

/** 案件屬於哪個作業階段（資料層的已公告併入已製作） */
function toWorkbenchStage(c: PendingCase): WorkbenchStage {
  return getCaseDocStatus(c) === "待製作" ? "待製作" : "已製作"
}

/**
 * 各來源的「次要欄」（科別為主體欄後的第二欄）。
 * 外加/微調容額的主體不只一種——外加是訓練醫院、微調是醫學會，故用中性的「申請單位」。
 */
function secondaryLabel(source: PendingSourceModule): string {
  return source === "submissions" ? "文件類型" : source === "quota-filing" ? "年度" : "申請單位"
}
function secondaryValue(c: PendingCase): string {
  return c.sourceModule === "additional-quota" ? c.subject : c.detail
}

/** 外加/微調容額 tab 混了兩種案件類型，需要欄位與篩選；其餘來源只有一種、不必顯示 */
function hasMixedKinds(source: PendingSourceModule): boolean {
  return source === "additional-quota"
}

export default function AnnouncementDocumentsPage() {
  const router = useRouter()
  const [source, setSource] = useState<PendingSourceModule>("submissions")
  const [stage, setStage] = useState<WorkbenchStage>("待製作")
  const [keyword, setKeyword] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState("all")
  const [kindFilter, setKindFilter] = useState<PendingCaseKind | "all">("all")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [produceOpen, setProduceOpen] = useState(false)
  const [produceDate, setProduceDate] = useState(TODAY_ISO)
  const [produceDocNumber, setProduceDocNumber] = useState("")
  const [tick, forceUpdate] = useState(0)

  const counts = useMemo(() => getPendingCountBySource(), [tick])

  const allCases = useMemo(() => getPendingCasesBySource(source), [source, tick])

  // 本來源各階段筆數（供階段分頁 badge）。已製作含已公告，與該分頁的列數一致。
  const stageCounts = useMemo(() => {
    const c = { 待製作: 0, 已製作: 0 } as Record<WorkbenchStage, number>
    allCases.forEach((x) => (c[toWorkbenchStage(x)] += 1))
    return c
  }, [allCases])

  const specialtyOptions = useMemo(
    () => [...new Set(allCases.map((c) => c.specialty))].sort(),
    [allCases],
  )

  const rows = useMemo(() => {
    return allCases
      .filter((c) => toWorkbenchStage(c) === stage)
      .filter((c) => (specialtyFilter === "all" ? true : c.specialty === specialtyFilter))
      .filter((c) => (kindFilter === "all" ? true : c.caseKind === kindFilter))
      .filter((c) =>
        keyword.trim() === ""
          ? true
          : `${c.specialty}${secondaryValue(c)}`.toLowerCase().includes(keyword.trim().toLowerCase()),
      )
      .sort((a, b) => a.approvedDate.localeCompare(b.approvedDate))
  }, [allCases, stage, specialtyFilter, kindFilter, keyword])

  // 待製作全部可勾（批次製作）；已製作分頁只有「尚未發站內公告」的可勾（帶入站內公告）
  const isSelectable = (c: PendingCase) => stage === "待製作" || !c.publishedPostId
  const selectableIds = rows.filter(isSelectable).map((c) => c.id)
  const selected = selectedIds.filter((id) => selectableIds.includes(id))
  const allSelected = selectableIds.length > 0 && selected.length === selectableIds.length

  const selectedCases = useMemo(() => rows.filter((c) => selected.includes(c.id)), [rows, selected])

  // 公告文件內容依案件類型而異：外加＝某院某分科增 N 名；微調＝某醫學會容額調整對照表
  const selectedKinds = useMemo(
    () => [...new Set(selectedCases.map((c) => c.caseKind))],
    [selectedCases],
  )
  const mixedKindsSelected = selectedKinds.length > 1
  const previewKind = selectedKinds[0] ?? "quota"
  const firstCase = selectedCases[0]
  const previewTitle =
    previewKind === "adjustment"
      ? `衛生福利部 ${firstCase?.year ?? "115 年度"}${firstCase?.specialty ?? "○○科"} 專科醫師訓練醫院訓練容量微調`
      : previewKind === "additional"
        ? `衛生福利部 ${firstCase?.year ?? "115 年度"}${firstCase?.specialty ?? "○○科"} 專科醫師訓練醫院外加訓練容額`
        : `衛生福利部 ${firstCase?.year ?? "115 年度"}${firstCase?.specialty ?? "○○科"} 訓練醫院認定合格名單及訓練容量`
  const previewBody =
    previewKind === "adjustment"
      ? "醫院名稱／所在地／原公告容額／調整後容額／增減 對照表（由系統帶入微調結果）"
      : previewKind === "additional"
        ? "醫院名稱／所在地／分類原則／核定外加容額 表（由系統帶入審查結果）"
        : "醫院名稱／所在地／訓練容量／資格效期 名單表（由系統帶入審查結果）"

  const switchSource = (next: PendingSourceModule) => {
    setSource(next)
    setSelectedIds([])
    setSpecialtyFilter("all")
    setKindFilter("all")
    setKeyword("")
  }
  const switchStage = (next: WorkbenchStage) => {
    setStage(next)
    setSelectedIds([])
  }

  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  const toggleAll = () => setSelectedIds(allSelected ? [] : selectableIds)

  const handleProduce = () => {
    if (!produceDocNumber.trim()) return
    produceOfficialDocs(selected, produceDate, produceDocNumber.trim())
    setProduceOpen(false)
    setProduceDocNumber("")
    setSelectedIds([])
    forceUpdate((n) => n + 1)
    toast.success(`已製作 ${selected.length} 份公告檔案`)
  }

  const handleCompose = () => {
    router.push(`/announcement-management/compose?cases=${selected.join(",")}&source=${source}`)
  }

  const handleDownload = (c: PendingCase) =>
    toast.info(`${c.specialty} 公告檔案下載由後端產出（mock 示意）`)

  return (
    <PageContainer>
      <PageHeader
        title="公告文件製作"
        description="為審查通過的案件製作官網公告文件（每案一份、文號人工輸入），完成後可帶入站內公告"
      />

      {/* 第一層：來源（格式不同，不併批） */}
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

      {/* 第二層：作業階段 */}
      <div className="mb-4 flex items-center gap-6 border-b border-gray-200">
        {STAGES.map((st) => {
          const active = st.value === stage
          return (
            <button
              key={st.value}
              onClick={() => switchStage(st.value)}
              className={`relative -mb-px flex items-center gap-2 border-b-2 px-1 pb-3 text-base font-medium transition-colors ${
                active
                  ? "border-[#2d3a8c] text-[#2d3a8c]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {st.label}
              <Badge variant="secondary" className="text-sm">
                {stageCounts[st.value]}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* 篩選 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={`搜尋科別或${secondaryLabel(source)}`}
            className="h-10 w-72 pl-9"
          />
        </div>
        <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
          <SelectTrigger className="h-10 w-44">
            <SelectValue placeholder="科別" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部科別</SelectItem>
            {specialtyOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasMixedKinds(source) && (
          <Select
            value={kindFilter}
            onValueChange={(v) => setKindFilter(v as PendingCaseKind | "all")}
          >
            <SelectTrigger className="h-10 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部類型</SelectItem>
              <SelectItem value="additional">{CASE_KIND_CONFIG.additional.label}</SelectItem>
              <SelectItem value="adjustment">{CASE_KIND_CONFIG.adjustment.label}</SelectItem>
            </SelectContent>
          </Select>
        )}
        <span className="ml-auto text-base text-gray-500">共 {rows.length} 筆</span>
      </div>

      {/* 批次動作列（依階段給單一明確動作） */}
      {selected.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-[#2d3a8c]/30 bg-[#2d3a8c]/5 px-4 py-3">
          <span className="text-base font-medium text-[#2d3a8c]">已選取 {selected.length} 筆</span>
          {stage === "待製作" && (
            <Button
              onClick={() => {
                setProduceDate(TODAY_ISO)
                setProduceDocNumber("")
                setProduceOpen(true)
              }}
              className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73]"
            >
              <FilePlus2 className="h-4 w-4" />
              製作公告檔案（{selected.length}）
            </Button>
          )}
          {stage === "已製作" && (
            <Button onClick={handleCompose} className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73]">
              <Send className="h-4 w-4" />
              帶入站內公告（{selected.length}）
            </Button>
          )}
          <Button variant="ghost" onClick={() => setSelectedIds([])}>
            清除選取
          </Button>
        </div>
      )}

      {/* 表格：欄位依階段調整 */}
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
              <TableHead>科別</TableHead>
              {hasMixedKinds(source) && <TableHead className="w-28">類型</TableHead>}
              <TableHead>{secondaryLabel(source)}</TableHead>
              <TableHead className="w-32">審查通過日</TableHead>
              {stage === "已製作" && <TableHead className="w-56">公告文號</TableHead>}
              {stage === "已製作" && <TableHead className="w-36">系統內公告</TableHead>}
              <TableHead className="w-56 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center">
                  <Inbox className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-base text-gray-500">此階段目前沒有案件</p>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c) => {
                const corr = officialCorrectionCount(c)
                const lastEntry = c.officialDoc?.entries[c.officialDoc.entries.length - 1]
                return (
                  <TableRow key={c.id} className="h-14">
                    <TableCell>
                      {isSelectable(c) && (
                        <Checkbox
                          checked={selected.includes(c.id)}
                          onCheckedChange={() => toggle(c.id)}
                          aria-label={`選取 ${c.specialty}`}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-base font-medium text-gray-900">{c.specialty}</TableCell>
                    {hasMixedKinds(source) && (
                      <TableCell>
                        <Badge variant="outline" className={CASE_KIND_CONFIG[c.caseKind].color}>
                          {CASE_KIND_CONFIG[c.caseKind].label}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-base text-gray-700">{secondaryValue(c)}</TableCell>
                    <TableCell className="text-base text-gray-600">{toRocDate(c.approvedDate)}</TableCell>
                    {stage === "已製作" && (
                      <TableCell className="text-base text-gray-700">
                        {lastEntry?.docNumber}
                        {corr > 0 && (
                          <Badge className="ml-1.5 border-blue-200 bg-blue-50 text-sm text-blue-700">
                            第 {corr} 次修正
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    {stage === "已製作" && (
                      <TableCell className="text-base">
                        {c.publishedDate ? (
                          <span className="text-gray-600">{toRocDate(c.publishedDate)}</span>
                        ) : (
                          <Badge className="border-amber-200 bg-amber-100 text-sm text-amber-800">
                            待發布
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {stage === "已製作" && (
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => handleDownload(c)}>
                            <Download className="h-4 w-4" />
                            下載
                          </Button>
                        )}
                        <Button asChild variant="outline" size="sm" className="gap-1">
                          <Link href={c.reviewHref}>
                            <ExternalLink className="h-4 w-4" />
                            檢視審查
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 製作公告檔案：輸入發文日期＋文號（手動），套版預覽後製作 */}
      <Dialog open={produceOpen} onOpenChange={setProduceOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>製作公告檔案</DialogTitle>
            <DialogDescription className="text-base">
              為選取的 {selected.length} 筆案件各產生一份官網公告文件（以科別為單位）。
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

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <p className="mb-2 text-sm text-gray-500">預覽（每筆案件各一份）</p>
              <p className="text-center text-lg font-bold text-gray-900">{previewTitle}</p>
              <p className="mt-1 text-right text-base text-gray-700">
                {toRocDate(produceDate)}　{produceDocNumber || "（未填文號）"} 號公告
              </p>
              <div className="mt-3 rounded border border-dashed border-gray-300 bg-gray-50 py-6 text-center text-sm text-gray-400">
                {previewBody}
              </div>
              {mixedKindsSelected && (
                <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  本次同時選了外加容額與容額微調，兩者公告文件格式不同，將各自依類型套版。
                </p>
              )}
            </div>

            <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200">
              {selectedCases.map((c) => (
                <div key={c.id} className="flex items-center gap-2 border-b px-3 py-2 last:border-b-0">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-base text-gray-800">
                    {c.specialty}　{secondaryValue(c)}
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
              製作 {selected.length} 份
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
