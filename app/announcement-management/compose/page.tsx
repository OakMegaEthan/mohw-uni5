"use client"

// 公告編製（組稿）。一份公告彙整多筆案件，故不是「填一張表」而是「組一份稿」：
//   來源案件 → 公告內容（可插入自動生成的名單表）→ 附件（自案件帶入＋自行上傳）→ 預覽
//
// 三種進入方式：
//   ?cases=id1,id2&source=xxx  自待公告工作台彙整
//   ?id=a-100                  編輯既有草稿
//   （無參數）                  醫事司自建公告（作業時程、說明會通知等）
//
// 公文文號為人工輸入字串，沒有文號不得發布（客戶確認）。案件在「儲存草稿」時才鎖定為
// 公告編製中，避免使用者只是點進來看看就把案件鎖住。

import { Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  FileText,
  Info,
  Plus,
  Table2,
  Upload,
  X,
} from "lucide-react"

import { PageContainer } from "@/components/layout/page-container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  attachCasesToDraft,
  getPendingCasesByIds,
  getSourceConfig,
  markCasesAnnounced,
  PENDING_SOURCES,
  type PendingCase,
} from "@/lib/mock/announcement-cases"
import {
  ANNOUNCEMENT_CATEGORIES,
  TODAY_ISO,
  createDraft,
  getAnnouncement,
  getCategoryLabel,
  publishAnnouncement,
  toRocDate,
  updateAnnouncement,
  type Announcement,
  type AnnouncementAttachment,
  type AnnouncementCategory,
  type AnnouncementCaseRef,
} from "@/lib/mock/announcements"
import { downloadAnnouncementDocument, downloadCaseList } from "@/lib/announcement-export"

const YEAR_OPTIONS = ["115 年度", "116 年度", "114 年度"]

export default function ComposePage() {
  return (
    <Suspense fallback={<PageContainer>載入中…</PageContainer>}>
      <ComposeInner />
    </Suspense>
  )
}

function ComposeInner() {
  const router = useRouter()
  const params = useSearchParams()

  const editingId = params.get("id")
  const existing = editingId ? getAnnouncement(editingId) : undefined
  const sourceParam = params.get("source")
  const caseIds = useMemo(
    () => (params.get("cases") ?? "").split(",").filter(Boolean),
    [params],
  )

  // 自工作台帶入的案件（編輯既有草稿時，改用草稿內的案件快照）
  const initialCases: AnnouncementCaseRef[] = useMemo(() => {
    if (existing) return existing.cases.map((c) => ({ ...c }))
    return getPendingCasesByIds(caseIds).map(toCaseRef)
  }, [existing, caseIds])

  const defaultCategory = (existing?.category ??
    PENDING_SOURCES.find((s) => s.value === sourceParam)?.category ??
    "general") as AnnouncementCategory

  const [draftId, setDraftId] = useState<string | null>(editingId)
  const [cases, setCases] = useState<AnnouncementCaseRef[]>(initialCases)
  const [title, setTitle] = useState(
    existing?.title ?? suggestTitle(defaultCategory, existing?.year ?? "115 年度"),
  )
  const [category, setCategory] = useState<AnnouncementCategory>(defaultCategory)
  const [year, setYear] = useState(existing?.year ?? "115 年度")
  const [docNumber, setDocNumber] = useState(existing?.docNumber ?? "")
  const [issueDate, setIssueDate] = useState(existing?.issueDate ?? "")
  const [publishDate, setPublishDate] = useState(existing?.publishDate ?? "")
  const [effectiveDate, setEffectiveDate] = useState(existing?.effectiveDate ?? "")
  const [isPinned, setIsPinned] = useState(existing?.isPinned ?? false)
  const [content, setContent] = useState(existing?.content ?? "")
  const [attachments, setAttachments] = useState<AnnouncementAttachment[]>(
    existing?.attachments.map((f) => ({ ...f })) ?? [],
  )

  // 來源案件既有的檔案，可勾選帶入（快照：帶入後案件端再異動不影響已發布公告）
  const caseAttachmentCandidates = useMemo(
    () =>
      cases.map((c) => ({
        id: `case-${c.caseId}`,
        name: `${c.subject}_${c.detail}_審查結果.pdf`,
        size: "1.2 MB",
        fromCase: c.caseId,
      })),
    [cases],
  )

  // 一份公告混到多種項目（文件類型／分科）時提醒：公告文書通常一種項目一份
  const mixedDetails = useMemo(() => [...new Set(cases.map((c) => c.detail))], [cases])

  const isScheduled = Boolean(publishDate && publishDate > TODAY_ISO)
  const canPublishNow = docNumber.trim().length > 0 && title.trim().length > 0 && content.trim().length > 0

  const previewAnnouncement = (): Announcement => ({
    id: draftId ?? "preview",
    title,
    category,
    year,
    status: "草稿",
    docNumber,
    issueDate: issueDate || null,
    publishDate: publishDate || null,
    effectiveDate: effectiveDate || null,
    isPinned,
    content,
    attachments,
    cases,
    publisher: "醫事司",
    publisherUnit: "醫事司第五科",
    correctionOf: existing?.correctionOf ?? null,
    correctedBy: null,
    version: existing?.version ?? 1,
    history: [],
    createdAt: TODAY_ISO,
  })

  const collectInput = () => ({
    title,
    category,
    year,
    docNumber,
    issueDate: issueDate || null,
    publishDate: publishDate || null,
    effectiveDate: effectiveDate || null,
    isPinned,
    content,
    attachments,
    cases,
    correctionOf: existing?.correctionOf ?? null,
  })

  /** 儲存草稿並鎖定案件；回傳草稿 id */
  const persist = (): string => {
    if (draftId) {
      updateAnnouncement(draftId, collectInput())
      attachCasesToDraft(cases.map((c) => c.caseId), draftId)
      return draftId
    }
    const draft = createDraft(collectInput())
    setDraftId(draft.id)
    attachCasesToDraft(cases.map((c) => c.caseId), draft.id)
    return draft.id
  }

  const handleSaveDraft = () => {
    if (!title.trim()) {
      toast.error("請先填寫公告標題")
      return
    }
    const id = persist()
    toast.success("草稿已儲存", {
      description: cases.length
        ? `涵蓋 ${cases.length} 筆案件，狀態已轉為「公告編製中」`
        : "可稍後回來繼續編輯",
    })
    router.push(`/announcement-management/${id}`)
  }

  const handlePublish = () => {
    if (!canPublishNow) {
      toast.error("尚不能發布", { description: "標題、內容與公文文號皆為必填" })
      return
    }
    const id = persist()
    publishAnnouncement(id)
    if (!isScheduled) markCasesAnnounced(cases.map((c) => c.caseId), id)
    toast.success(isScheduled ? `已排程於 ${toRocDate(publishDate)} 上架` : "公告已發布", {
      description: cases.length ? `${cases.length} 筆案件已回寫公告資訊` : undefined,
    })
    router.push(`/announcement-management/${id}`)
  }

  const handleInsertCaseTable = () => {
    if (cases.length === 0) {
      toast.error("目前沒有涵蓋案件")
      return
    }
    setContent((prev) => `${prev.trimEnd()}\n\n${buildCaseTableText(cases)}\n`)
    toast.success("已插入涵蓋案件名單")
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setAttachments((prev) => [
      ...prev,
      ...files.map((f, i) => ({
        id: `up-${Date.now()}-${i}`,
        name: f.name,
        size: `${(f.size / 1024 / 1024).toFixed(2)} MB`,
      })),
    ])
  }

  const toggleCaseAttachment = (candidate: AnnouncementAttachment) => {
    setAttachments((prev) =>
      prev.some((f) => f.id === candidate.id)
        ? prev.filter((f) => f.id !== candidate.id)
        : [...prev, candidate],
    )
  }

  return (
    <PageContainer>
      <Link
        href="/announcement-management/pending"
        className="mb-4 inline-flex items-center gap-1 text-base text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="h-4 w-4" />
        返回待公告案件
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {existing?.correctionOf ? "編製更正公告" : "公告編製"}
          </h1>
          <p className="mt-1 text-base text-gray-600">
            {cases.length > 0
              ? `本份公告彙整 ${cases.length} 筆審查完成案件`
              : "醫事司自建公告（未彙整案件）"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => downloadAnnouncementDocument(previewAnnouncement())}
          >
            <Download className="h-4 w-4" />
            匯出文稿
          </Button>
          {cases.length > 0 && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => downloadCaseList(previewAnnouncement())}
            >
              <Table2 className="h-4 w-4" />
              匯出名單
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* 一、來源案件 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">一、涵蓋案件（{cases.length}）</CardTitle>
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link href="/announcement-management/pending">
                <Plus className="h-4 w-4" />
                自工作台加選
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {cases.length === 0 ? (
              <p className="py-4 text-base text-gray-500">
                未彙整案件。此份為醫事司自建公告（例如作業時程、說明會通知）。
              </p>
            ) : (
              <div className="space-y-3">
                {mixedDetails.length > 1 && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <p className="text-base text-amber-900">
                      本份公告涵蓋 {mixedDetails.length} 種項目（{mixedDetails.join("、")}）。
                      公告文書通常一種項目一份，請確認是否要拆成多份公告。
                    </p>
                  </div>
                )}
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>來源</TableHead>
                        <TableHead>主體</TableHead>
                        <TableHead>項目</TableHead>
                        <TableHead className="w-36">審查通過日</TableHead>
                        <TableHead className="w-20 text-right">移除</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cases.map((c) => (
                        <TableRow key={c.caseId} className="h-14">
                          <TableCell>
                            <Badge variant="outline" className="text-sm">
                              {getSourceConfig(c.sourceModule).label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-base font-medium text-gray-900">
                            {c.subject}
                          </TableCell>
                          <TableCell className="text-base text-gray-700">{c.detail}</TableCell>
                          <TableCell className="text-base text-gray-600">
                            {toRocDate(c.approvedDate)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setCases((prev) => prev.filter((x) => x.caseId !== c.caseId))
                              }
                              aria-label={`移除 ${c.subject}`}
                            >
                              <X className="h-4 w-4 text-gray-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 二、公告內容 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">二、公告內容</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base">
                公告標題 *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11"
                placeholder="例：115 年度專科醫師訓練計畫認定基準修訂公告"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-base">公告類別 *</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as AnnouncementCategory)}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANNOUNCEMENT_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-base">年度 *</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content" className="text-base">
                  公告事項 *
                </Label>
                {cases.length > 0 && (
                  <Button variant="outline" size="sm" className="gap-1" onClick={handleInsertCaseTable}>
                    <Table2 className="h-4 w-4" />
                    插入涵蓋案件名單
                  </Button>
                )}
              </div>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={14}
                className="text-base leading-relaxed"
                placeholder={"一、公告依據：\n\n二、公告事項：\n\n三、生效日期："}
              />
              <p className="text-sm text-gray-500">已輸入 {content.length} 字元</p>
            </div>
          </CardContent>
        </Card>

        {/* 三、公文資訊 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">三、公文資訊與發布設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doc-number" className="text-base">
                公文文號 *
              </Label>
              <Input
                id="doc-number"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="h-11"
                placeholder="例：衛部醫字第 1151660321 號"
              />
              <p className="flex items-start gap-1.5 text-sm text-gray-500">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                文號由公文系統核發，本系統僅記錄不做驗證。<span className="font-medium">沒有文號不得發布。</span>
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="issue-date" className="text-base">
                  發文日期
                </Label>
                <Input
                  id="issue-date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publish-date" className="text-base">
                  上架日期
                </Label>
                <Input
                  id="publish-date"
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  className="h-11"
                />
                <p className="text-sm text-gray-500">
                  {isScheduled ? "未來日期：發布後為「已排程」，屆期才於前台出現" : "留空＝立即上架"}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="effective-date" className="text-base">
                  生效／施行日期
                </Label>
                <Input
                  id="effective-date"
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <label className="flex w-fit cursor-pointer items-center gap-2 text-base text-gray-700">
              <Checkbox checked={isPinned} onCheckedChange={(v) => setIsPinned(Boolean(v))} />
              設為置頂公告
            </label>
          </CardContent>
        </Card>

        {/* 四、附件 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">四、附件（{attachments.length}）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {caseAttachmentCandidates.length > 0 && (
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="mb-3 text-base font-medium text-gray-900">自來源案件帶入</p>
                <div className="space-y-2">
                  {caseAttachmentCandidates.map((f) => (
                    <label
                      key={f.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={attachments.some((a) => a.id === f.id)}
                        onCheckedChange={() => toggleCaseAttachment(f)}
                      />
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="flex-1 text-base text-gray-900">{f.name}</span>
                      <span className="text-sm text-gray-500">{f.size}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  帶入的是快照。公告發布後，案件端檔案再異動不會改動已發布的公告附件。
                </p>
              </div>
            )}

            <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-gray-400">
              <input type="file" id="file-upload" multiple onChange={handleUpload} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto mb-3 h-10 w-10 text-gray-400" />
                <p className="text-base text-gray-600">點擊上傳其他附件</p>
                <p className="text-sm text-gray-500">支援 PDF、Word、Excel</p>
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-base font-medium text-gray-900">{f.name}</p>
                        <p className="text-sm text-gray-500">
                          {f.size}
                          {f.fromCase && " · 自來源案件帶入"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== f.id))}
                      aria-label={`移除 ${f.name}`}
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 五、預覽 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">五、預覽</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {getCategoryLabel(category)}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {year}
                </Badge>
                {isPinned && (
                  <Badge className="border-amber-200 bg-amber-100 text-sm text-amber-800">置頂</Badge>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{title || "（未填標題）"}</h2>
              <div className="mt-2 flex flex-wrap gap-4 text-base text-gray-600">
                <span>發文日期：{toRocDate(issueDate || null)}</span>
                <span>發文字號：{docNumber || "（未填）"}</span>
                {effectiveDate && <span>生效日期：{toRocDate(effectiveDate)}</span>}
              </div>
              <div className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-gray-800">
                {content || "（未填內容）"}
              </div>
              {attachments.length > 0 && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <p className="mb-2 text-base font-medium text-gray-900">附件</p>
                  <ul className="space-y-1">
                    {attachments.map((f) => (
                      <li key={f.id} className="text-base text-blue-600">
                        {f.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 操作 */}
        <div className="flex flex-wrap items-center justify-end gap-3 pb-4">
          {!canPublishNow && (
            <p className="mr-auto text-base text-amber-700">
              {docNumber.trim() ? "標題與內容為必填" : "填入公文文號後才能發布"}
            </p>
          )}
          <Button asChild variant="outline">
            <Link href="/announcement-management/pending">取消</Link>
          </Button>
          <Button variant="outline" onClick={handleSaveDraft}>
            儲存草稿
          </Button>
          <Button
            onClick={handlePublish}
            disabled={!canPublishNow}
            className="bg-[#2d3a8c] hover:bg-[#252f73]"
          >
            {isScheduled ? "排程上架" : "發布公告"}
          </Button>
        </div>
      </div>
    </PageContainer>
  )
}

function toCaseRef(c: PendingCase): AnnouncementCaseRef {
  return {
    caseId: c.id,
    sourceModule: c.sourceModule,
    subject: c.subject,
    detail: c.detail,
    approvedDate: c.approvedDate,
  }
}

function suggestTitle(category: AnnouncementCategory, year: string): string {
  return `${year}${getCategoryLabel(category)}公告`
}

/** 以純文字表格插入內文，供醫事司直接貼進公文 */
function buildCaseTableText(cases: AnnouncementCaseRef[]): string {
  const lines = cases.map((c, i) => `${String(i + 1).padStart(2, "0")}. ${c.subject}　${c.detail}`)
  return [`附表：本公告涵蓋案件共 ${cases.length} 筆`, ...lines].join("\n")
}
