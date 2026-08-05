"use client"

// 容額微調（醫學會填報端）。
//
// 醫學會於系統外形成共識後，在此選取要調整的訓練醫院、填調整後容額、上傳附件，
// 送出後直接進醫事司審查（不經醫策會初審／分組會議／RRC 大會）。
//
// 核心不變量：微調只在既有訓練醫院之間搬動容額，增減相抵必為 0。**不平衡不得送出**，
// 畫面即時顯示調增／調減／淨變動，讓使用者邊填邊看得到差額。
//
// 基準容額（原公告）自容額填報帶入、不可編輯；醫學會只填「調整後容額」，
// 增減量由系統算——兩份參考公文的格式落差因此在系統內消失（見 lib/mock/quota-adjustment.ts）。
//
// mock 慣例：以 URL param `case` 切換要示範的案件（待送件／待審／已通過），比照容額填報頁。

import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, ArrowDown, ArrowUp, Check, FileText, Info, Upload, X } from "lucide-react"

import { PageContainer, PageHeader } from "@/components/layout/page-container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  QUOTA_ADJUSTMENT_STAGE_CONFIG,
  getBalance,
  getQuotaAdjustmentCase,
  getQuotaAdjustmentCases,
  isBalanced,
  rowDelta,
  submitAdjustment,
  type QuotaAdjustmentAttachment,
  type QuotaAdjustmentRow,
} from "@/lib/mock/quota-adjustment"

export default function QuotaAdjustmentPage() {
  return (
    <Suspense fallback={<PageContainer>載入中…</PageContainer>}>
      <QuotaAdjustmentContent />
    </Suspense>
  )
}

function QuotaAdjustmentContent() {
  const params = useSearchParams()
  const allCases = getQuotaAdjustmentCases()
  const caseId = params.get("case") || allCases[0]?.id || ""
  const current = getQuotaAdjustmentCase(caseId) ?? allCases[0]

  if (!current) {
    return (
      <PageContainer>
        <PageHeader title="容額微調" description="尚無可填報的案件" />
      </PageContainer>
    )
  }

  return <AdjustmentForm key={current.id} caseId={current.id} />
}

function AdjustmentForm({ caseId }: { caseId: string }) {
  const allCases = getQuotaAdjustmentCases()
  const current = getQuotaAdjustmentCase(caseId)!

  const [rows, setRows] = useState<QuotaAdjustmentRow[]>(current.rows.map((r) => ({ ...r })))
  const [attachments, setAttachments] = useState<QuotaAdjustmentAttachment[]>(
    current.attachments.map((f) => ({ ...f })),
  )
  const [stage, setStage] = useState(current.stage)
  const [returned, setReturned] = useState(current.returnedFrom)

  // 待送件、或退件補正中才可編輯；送審後為唯讀
  const editable = stage === "待送件" || returned !== null

  const balance = useMemo(() => getBalance(rows), [rows])
  const canSubmit = isBalanced(rows)

  const setQuota = (code: string, value: string) => {
    const n = value === "" ? 0 : Number(value)
    if (Number.isNaN(n) || n < 0) return
    setRows((prev) => prev.map((r) => (r.hospitalCode === code ? { ...r, adjustedQuota: n } : r)))
  }
  const setReason = (code: string, value: string) =>
    setRows((prev) => prev.map((r) => (r.hospitalCode === code ? { ...r, reason: value } : r)))
  const resetRow = (code: string) =>
    setRows((prev) =>
      prev.map((r) => (r.hospitalCode === code ? { ...r, adjustedQuota: r.baseQuota, reason: "" } : r)),
    )

  const handleUpload = () =>
    setAttachments((prev) => [
      ...prev,
      { id: `up-${Date.now()}`, name: `容額微調附件${prev.length + 1}.pdf`, size: "0.8 MB" },
    ])
  const handleRemove = (id: string) => setAttachments((prev) => prev.filter((f) => f.id !== id))

  const handleSubmit = () => {
    if (!canSubmit) return
    submitAdjustment(current.id, rows, "115/06/20")
    setStage("醫事司審查")
    setReturned(null)
    toast.success("已送出容額微調申請", { description: "案件已進入醫事司審查" })
  }

  const changed = rows.filter((r) => rowDelta(r) !== 0)

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
        {/* mock：切換示範案件 */}
        <Select
          value={current.id}
          onValueChange={(v) => {
            window.location.href = `/filing/quota-adjustment?case=${v}`
          }}
        >
          <SelectTrigger className="h-10 w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allCases.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.societyName}（{c.stage}）
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge variant="outline" className={QUOTA_ADJUSTMENT_STAGE_CONFIG[stage].color}>
          {QUOTA_ADJUSTMENT_STAGE_CONFIG[stage].label}
        </Badge>
        {returned && (
          <Badge className="border-orange-200 bg-orange-100 text-orange-800">退件補正中</Badge>
        )}
        <span className="text-base text-gray-600">
          {current.societyName}　{current.year}　第 {current.round} 次微調
        </span>
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
          <span className="text-base text-blue-900">
            案件已送出，審查期間不可修改，僅供檢視。
          </span>
        </div>
      )}

      <div className="space-y-6">
        {/* 一、增減結餘：擺在表格上方，讓使用者邊填邊看得到差額 */}
        <Card className={canSubmit ? "border-green-200 bg-green-50/40" : "border-amber-200 bg-amber-50/40"}>
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
                className={`text-2xl font-bold ${
                  balance.net === 0 ? "text-green-700" : "text-red-600"
                }`}
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
                <span className="text-amber-800">尚未調整任何醫院的容額</span>
              ) : (
                <span className="text-red-700">
                  目前{balance.net > 0 ? "多出" : "短少"} {Math.abs(balance.net)} 名，
                  請調整至淨變動為 0 才能送出
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 二、訓練醫院容額 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">一、訓練醫院容額（{rows.length} 家）</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>訓練醫院</TableHead>
                    <TableHead className="w-24">所在地</TableHead>
                    <TableHead className="w-28 text-right">原公告容額</TableHead>
                    <TableHead className="w-32 text-right">調整後容額</TableHead>
                    <TableHead className="w-24 text-right">增減</TableHead>
                    <TableHead className="w-64">微調原因</TableHead>
                    {editable && <TableHead className="w-16" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const d = rowDelta(r)
                    return (
                      <TableRow key={r.hospitalCode} className={d !== 0 ? "bg-blue-50/40" : undefined}>
                        <TableCell className="text-base font-medium text-gray-900">
                          {r.hospitalName}
                        </TableCell>
                        <TableCell className="text-base text-gray-600">{r.county}</TableCell>
                        <TableCell className="text-right text-base text-gray-600">
                          {r.baseQuota}
                        </TableCell>
                        <TableCell className="text-right">
                          {editable ? (
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
                          {d === 0 ? (
                            <span className="text-gray-400">—</span>
                          ) : d > 0 ? (
                            <span className="text-blue-700">＋{d}</span>
                          ) : (
                            <span className="text-orange-700">－{-d}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editable ? (
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
                            {d !== 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resetRow(r.hospitalCode)}
                                aria-label={`還原 ${r.hospitalName}`}
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
          </CardContent>
        </Card>

        {/* 三、附件 */}
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
                  <div key={f.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
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
                        onClick={() => handleRemove(f.id)}
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

        {/* 四、送出 */}
        {editable && (
          <div className="flex flex-wrap items-center justify-end gap-3 pb-4">
            {!canSubmit && (
              <p className="mr-auto text-base text-amber-700">
                {balance.changedCount === 0
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
              送出審查（{changed.length} 家異動）
            </Button>
          </div>
        )}
      </div>

      <div className="mb-2 mt-6">
        <Label className="text-sm text-muted-foreground">
          送出後案件直接進醫事司審查，不經醫策會初審、分組會議與 RRC 大會。
        </Label>
      </div>
    </PageContainer>
  )
}
