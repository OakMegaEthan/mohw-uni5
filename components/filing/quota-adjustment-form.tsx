"use client"

// 容額微調案件表單（醫學會端）。列表／新增之後的實際填寫畫面。
//
// 醫學會「選取要調整的訓練醫院」→ 填調整後容額 → 上傳附件 → 送審。
// 可選的機構僅限該醫學會容額填報送過的訓練機構（微調只能在已認定合格的機構之間搬動）。
//
// 聯合申請的合作機構隨主訓機構自動帶入呈現：它沒有自己的容額（掛在主訓機構上），
// 故唯讀、不計入守恆——但要讓審查者看得到這個容額涵蓋哪些機構。

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Download,
  FileText,
  Info,
  Plus,
  Upload,
  X,
} from "lucide-react"

import { PageContainer } from "@/components/layout/page-container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  QUOTA_ADJUSTMENT_STAGE_CONFIG,
  expandSelection,
  getBalance,
  getEffectiveBaseline,
  getQuotaAdjustmentCase,
  isBalanced,
  isSelectableHospital,
  rowDelta,
  submitAdjustment,
  type QuotaAdjustmentAttachment,
  type QuotaAdjustmentRow,
} from "@/lib/mock/quota-adjustment"

const TODAY_ROC = "115/06/20"

/** 聯合申請／合併認定的機構標記，沿用容額填報的語彙 */
function OrgBadges({ row }: { row: QuotaAdjustmentRow }) {
  return (
    <span className="ml-2 inline-flex gap-1 align-middle">
      {row.applicationType === "joint" && !row.isSubRow && (
        <Badge className="border-blue-200 bg-blue-50 text-xs text-blue-700">主訓機構</Badge>
      )}
      {row.isSubRow && (
        <Badge className="border-slate-200 bg-slate-100 text-xs text-slate-600">合作機構</Badge>
      )}
      {row.isMerged && (
        <Badge className="border-amber-200 bg-amber-50 text-xs text-amber-700">合併認定</Badge>
      )}
    </span>
  )
}

export function QuotaAdjustmentForm({ caseId }: { caseId: string }) {
  const router = useRouter()
  const current = getQuotaAdjustmentCase(caseId)

  const [rows, setRows] = useState<QuotaAdjustmentRow[]>(
    current ? current.rows.map((r) => ({ ...r })) : [],
  )
  const [attachments, setAttachments] = useState<QuotaAdjustmentAttachment[]>(
    current ? current.attachments.map((f) => ({ ...f })) : [],
  )
  const [stage, setStage] = useState(current?.stage)
  const [returned, setReturned] = useState(current?.returnedFrom ?? null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSelected, setPickerSelected] = useState<string[]>([])
  // 匯入名單：比照容額填報的流程（先選匯入方式 → 才顯示範例下載與上傳區）。
  // mock 僅示意 UI，不做實際解析。
  const [importOpen, setImportOpen] = useState(false)
  const [importMode, setImportMode] = useState<"append" | "replace" | null>(null)

  const baseline = useMemo(
    () => (current ? getEffectiveBaseline(current.societyId, current.year) : []),
    [current],
  )

  // 可加選的機構：主訓／單獨申請且尚未在表格內（合作機構隨主訓機構帶入，不可單獨選）
  const candidates = useMemo(() => {
    const inTable = new Set(rows.map((r) => r.hospitalCode))
    return baseline.filter((h) => isSelectableHospital(h) && !inTable.has(h.code))
  }, [baseline, rows])

  const balance = useMemo(() => getBalance(rows), [rows])
  const canSubmit = isBalanced(rows)

  if (!current) {
    return (
      <PageContainer>
        <BackLink />
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-base text-gray-500">找不到此案件</p>
        </div>
      </PageContainer>
    )
  }

  const editable = stage === "待送件" || returned !== null

  const setQuota = (code: string, value: string) => {
    const n = value === "" ? 0 : Number(value)
    if (Number.isNaN(n) || n < 0) return
    setRows((prev) => prev.map((r) => (r.hospitalCode === code ? { ...r, adjustedQuota: n } : r)))
  }
  const setReason = (code: string, value: string) =>
    setRows((prev) => prev.map((r) => (r.hospitalCode === code ? { ...r, reason: value } : r)))

  /** 移除主訓機構時，其合作機構一併移除（合作機構不會單獨存在） */
  const removeRow = (row: QuotaAdjustmentRow) =>
    setRows((prev) =>
      prev.filter((r) =>
        row.groupId ? r.groupId !== row.groupId : r.hospitalCode !== row.hospitalCode,
      ),
    )

  const confirmPicker = () => {
    const added = expandSelection(baseline, pickerSelected)
    setRows((prev) => [...prev, ...added])
    setPickerOpen(false)
    setPickerSelected([])
    toast.success(`已加入 ${added.length} 家機構`)
  }

  const handleUpload = () =>
    setAttachments((prev) => [
      ...prev,
      { id: `up-${Date.now()}`, name: `容額微調附件${prev.length + 1}.pdf`, size: "0.8 MB" },
    ])

  const handleSubmit = () => {
    if (!canSubmit) return
    submitAdjustment(current.id, rows, TODAY_ROC)
    setStage("醫事司審查")
    setReturned(null)
    toast.success("已送出容額微調申請", { description: "案件已進入醫事司審查" })
    setTimeout(() => router.push("/filing/quota-adjustment"), 0)
  }

  return (
    <PageContainer>
      <BackLink />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{current.societyName}　容額微調</h1>
          <p className="mt-1 text-base text-gray-600">
            {current.specialty}　{current.year}　第 {current.round} 次微調
            {current.submittedDate && `　送出日期：${current.submittedDate}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {returned && (
            <Badge className="border-orange-200 bg-orange-100 text-orange-800">退件補正中</Badge>
          )}
          <Badge variant="outline" className={QUOTA_ADJUSTMENT_STAGE_CONFIG[stage!].color}>
            {QUOTA_ADJUSTMENT_STAGE_CONFIG[stage!].label}
          </Badge>
        </div>
      </div>

      {returned && current.reviewComment && (
        <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <p className="mb-1 text-base font-medium text-orange-900">醫事司退件意見</p>
          <p className="text-base text-orange-900">{current.reviewComment}</p>
        </div>
      )}

      {!editable && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <Info className="h-5 w-5 shrink-0 text-blue-600" />
          <span className="text-base text-blue-900">案件已送出，審查期間不可修改，僅供檢視。</span>
        </div>
      )}

      <div className="space-y-6">
        {/* 增減結餘：常駐在表格上方，隨時看得到還差多少 */}
        <Card
          className={canSubmit ? "border-green-200 bg-green-50/40" : "border-amber-200 bg-amber-50/40"}
        >
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
              <p className="text-sm text-gray-500">淨變動（須為 0）</p>
              <p
                className={`text-2xl font-bold ${balance.net === 0 ? "text-green-700" : "text-red-600"}`}
              >
                {balance.net > 0 ? "＋" : balance.net < 0 ? "－" : ""}
                {Math.abs(balance.net)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">異動家數</p>
              <p className="text-2xl font-bold text-gray-900">{balance.changedCount}</p>
            </div>
            <div className="ml-auto max-w-md text-base">
              {canSubmit ? (
                <span className="flex items-center gap-2 font-medium text-green-800">
                  <Check className="h-5 w-5" />
                  增減相抵，總容額不變{editable && "，可送出"}
                </span>
              ) : balance.changedCount === 0 ? (
                <span className="text-amber-800">
                  {rows.length === 0 ? "請先加選要調整的訓練醫院" : "尚未調整任何醫院的容額"}
                </span>
              ) : (
                <span className="text-red-700">
                  目前{balance.net > 0 ? "多出" : "短少"} {Math.abs(balance.net)} 名。
                  {balance.net > 0 ? "請調減其他醫院" : "請調增其他醫院"}
                  {editable && candidates.length > 0 && "，必要時可再加選機構"}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 訓練醫院容額 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">一、要調整的訓練醫院（{rows.length}）</CardTitle>
            {editable && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => {
                    setImportMode(null)
                    setImportOpen(true)
                  }}
                >
                  <Upload className="h-4 w-4" />
                  匯入名單
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => {
                    setPickerSelected([])
                    setPickerOpen(true)
                  }}
                  disabled={candidates.length === 0}
                >
                  <Plus className="h-4 w-4" />
                  加選訓練醫院
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {rows.length === 0 ? (
              <p className="px-6 py-12 text-center text-base text-gray-500">
                尚未加選訓練醫院。可選範圍為本會容額填報送過的訓練機構。
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>訓練醫院</TableHead>
                      <TableHead className="w-24">所在地</TableHead>
                      {/* 自容額填報審核通過後的可收訓容額上限帶入，供檢視調整是否在上限內 */}
                      <TableHead className="w-28 text-right">可收訓容額</TableHead>
                      <TableHead className="w-28 text-right">原公告容額</TableHead>
                      <TableHead className="w-32 text-right">調整後容額</TableHead>
                      <TableHead className="w-24 text-right">增減</TableHead>
                      <TableHead className="w-56">微調原因</TableHead>
                      {editable && <TableHead className="w-16" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => {
                      const d = rowDelta(r)
                      return (
                        <TableRow
                          key={r.hospitalCode}
                          className={d !== 0 ? "bg-blue-50/40" : undefined}
                        >
                          <TableCell className="text-base text-gray-900">
                            <span className={r.isSubRow ? "pl-5 text-gray-700" : "font-medium"}>
                              {r.hospitalName}
                            </span>
                            <OrgBadges row={r} />
                          </TableCell>
                          <TableCell className="text-base text-gray-600">{r.county}</TableCell>
                          {/* 合作機構沒有自己的容額與上限，兩欄皆顯示「—」 */}
                          <TableCell className="text-right text-base text-gray-600">
                            {r.isSubRow ? "—" : r.trainingLimit}
                          </TableCell>
                          <TableCell className="text-right text-base text-gray-600">
                            {r.isSubRow ? "—" : r.baseQuota}
                          </TableCell>
                          <TableCell className="text-right">
                            {r.isSubRow ? (
                              <span className="text-base text-gray-400">—</span>
                            ) : editable ? (
                              <Input
                                type="number"
                                min={0}
                                value={r.adjustedQuota}
                                onChange={(e) => setQuota(r.hospitalCode, e.target.value)}
                                className="h-10 w-24 text-right text-base"
                                aria-label={`${r.hospitalName} 調整後容額`}
                              />
                            ) : (
                              <span className="text-base font-medium text-gray-900">
                                {r.adjustedQuota}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-base font-medium">
                            {r.isSubRow || d === 0 ? (
                              <span className="text-gray-400">—</span>
                            ) : d > 0 ? (
                              <span className="text-blue-700">＋{d}</span>
                            ) : (
                              <span className="text-orange-700">－{-d}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {r.isSubRow ? (
                              <span className="text-base text-gray-400">—</span>
                            ) : editable ? (
                              <Input
                                value={r.reason}
                                onChange={(e) => setReason(r.hospitalCode, e.target.value)}
                                placeholder={d === 0 ? "" : "例：釋出容額／招收住院醫師"}
                                disabled={d === 0}
                                className="h-10 text-base"
                                aria-label={`${r.hospitalName} 微調原因`}
                              />
                            ) : (
                              <span className="text-base text-gray-700">{r.reason || "—"}</span>
                            )}
                          </TableCell>
                          {editable && (
                            <TableCell>
                              {!r.isSubRow && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeRow(r)}
                                  aria-label={`移除 ${r.hospitalName}`}
                                >
                                  <X className="h-4 w-4 text-gray-500" />
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 附件 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">二、附件（{attachments.length}）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base text-muted-foreground">
              比照來文檢附微調對照表與更新後之認定合格名單。
            </p>
            {editable && (
              <div
                onClick={handleUpload}
                className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-gray-400"
              >
                <Upload className="mx-auto mb-3 h-10 w-10 text-gray-400" />
                <p className="text-base text-gray-600">點擊上傳附件</p>
                <p className="text-sm text-gray-500">支援 PDF、Word、Excel</p>
              </div>
            )}
            {attachments.length === 0 ? (
              <p className="py-4 text-center text-base text-gray-500">尚未上傳附件</p>
            ) : (
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
                        <p className="text-sm text-gray-500">{f.size}</p>
                      </div>
                    </div>
                    {editable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setAttachments((prev) => prev.filter((x) => x.id !== f.id))
                        }
                        aria-label={`移除 ${f.name}`}
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {editable && (
          <div className="flex flex-wrap items-center justify-end gap-3 pb-4">
            {!canSubmit && (
              <p className="mr-auto text-base text-amber-700">
                {rows.length === 0
                  ? "請先加選訓練醫院"
                  : balance.changedCount === 0
                    ? "請至少調整一家醫院的容額"
                    : "增減必須相抵（淨變動為 0）才能送出"}
              </p>
            )}
            <Button variant="outline" onClick={() => toast.success("已儲存草稿")}>
              儲存草稿
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="bg-[#2d3a8c] hover:bg-[#252f73]"
            >
              送出審查（{balance.changedCount} 家異動）
            </Button>
          </div>
        )}
      </div>

      {/* 加選訓練醫院：範圍限本會容額填報送過的機構 */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>加選訓練醫院</DialogTitle>
            <DialogDescription className="text-base">
              可選範圍為 {current.societyName} 容額填報送過的訓練機構。
              聯合申請的合作機構會隨主訓機構一併帶入（其容額掛在主訓機構上）。
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-80 overflow-auto rounded-lg border border-gray-200">
            {candidates.length === 0 ? (
              <p className="py-12 text-center text-base text-gray-500">
                沒有可加選的訓練醫院。
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12" />
                    <TableHead>訓練醫院</TableHead>
                    <TableHead className="w-24">所在地</TableHead>
                    <TableHead className="w-28 text-right">原公告容額</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((h) => {
                    const checked = pickerSelected.includes(h.code)
                    return (
                      <TableRow
                        key={h.code}
                        className="h-14 cursor-pointer"
                        onClick={() =>
                          setPickerSelected((prev) =>
                            checked ? prev.filter((c) => c !== h.code) : [...prev, h.code],
                          )
                        }
                      >
                        <TableCell>
                          <Checkbox checked={checked} aria-label={`選取 ${h.name}`} />
                        </TableCell>
                        <TableCell className="text-base text-gray-900">
                          {h.name}
                          {h.applicationType === "joint" && (
                            <Badge className="ml-2 border-blue-200 bg-blue-50 text-xs text-blue-700">
                              主訓機構
                            </Badge>
                          )}
                          {h.isMerged && (
                            <Badge className="ml-1 border-amber-200 bg-amber-50 text-xs text-amber-700">
                              合併認定
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-base text-gray-600">{h.county}</TableCell>
                        <TableCell className="text-right text-base text-gray-700">
                          {h.quota}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPickerOpen(false)}>
              取消
            </Button>
            <Button
              onClick={confirmPicker}
              disabled={pickerSelected.length === 0}
              className="bg-[#2d3a8c] hover:bg-[#252f73]"
            >
              加入 {pickerSelected.length} 家
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 匯入名單：流程比照容額填報（先選匯入方式，選完才顯示範例下載與上傳區）。
          mock 僅示意 UI，不做檔案解析與資料寫入。 */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>匯入名單</DialogTitle>
            <DialogDescription className="text-base">
              以 Excel 批次帶入要調整的訓練醫院與調整後容額，免逐家加選與輸入。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div>
              <Label className="mb-3 block text-base font-medium">匯入方式</Label>
              <RadioGroup
                value={importMode ?? ""}
                onValueChange={(v) => setImportMode(v as "append" | "replace")}
                className="space-y-2.5"
              >
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                    importMode === "append"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem value="append" className="mt-0.5 shrink-0" />
                  <div>
                    <div className="text-base font-medium">附加至現有清單</div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      將檔案中的訓練醫院新增至目前清單末尾，已加選的醫院與其容額不受影響
                    </div>
                  </div>
                </label>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                    importMode === "replace"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem value="replace" className="mt-0.5 shrink-0" />
                  <div>
                    <div className="text-base font-medium">覆蓋現有清單</div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      以檔案內容完整取代目前清單，已加選的醫院與其容額將全部清除
                    </div>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {importMode && (
              <div className="space-y-4 border-t pt-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="mb-3 text-sm text-muted-foreground">
                    請先下載範例文件，依格式填寫「訓練醫院、調整後容額、微調原因」後再上傳。
                    可匯入的醫院僅限本會容額填報送過的訓練機構。
                  </p>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    下載範例文件 (.xlsx)
                  </Button>
                </div>
                <div>
                  <Label className="mb-2 block text-base font-medium">選擇檔案</Label>
                  <div className="cursor-pointer rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50">
                    <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-base text-muted-foreground">點擊或拖曳檔案至此處上傳</p>
                    <p className="mt-1 text-sm text-muted-foreground">支援 .xlsx, .xls 格式</p>
                    <Input type="file" className="hidden" accept=".xlsx,.xls" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              取消
            </Button>
            <Button
              disabled={!importMode}
              className="bg-[#2d3a8c] text-white hover:bg-[#252f73]"
              onClick={() => {
                setImportOpen(false)
                toast.info("匯入由後端解析檔案後帶入（mock 示意）")
              }}
            >
              上傳
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-6">
        <Label className="text-sm text-muted-foreground">
          送出後案件直接進醫事司審查，不經醫策會初審、分組會議與 RRC 大會。
        </Label>
      </div>
    </PageContainer>
  )
}

function BackLink() {
  return (
    <Link
      href="/filing/quota-adjustment"
      className="mb-4 inline-flex items-center gap-1 text-base text-blue-600 hover:text-blue-800"
    >
      <ArrowLeft className="h-4 w-4" />
      返回容額微調
    </Link>
  )
}
