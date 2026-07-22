"use client"

// 管理端的公告檢視：除了公告本身，重點在「這份公告涵蓋哪些案件」與「發布後做了什麼」。
// 已發布的公告不直接改內容，要改就建立更正公告（保留版本鏈）。

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  History,
  Pencil,
  Table2,
  Upload,
} from "lucide-react"

import { PageContainer } from "@/components/layout/page-container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getPendingCase, getSourceConfig } from "@/lib/mock/announcement-cases"
import {
  ANNOUNCEMENT_STATUS_CONFIG,
  createCorrection,
  getAnnouncement,
  getCategoryLabel,
  republishAnnouncement,
  toRocDate,
  unpublishAnnouncement,
} from "@/lib/mock/announcements"
import { downloadAnnouncementDocument, downloadCaseList } from "@/lib/announcement-export"

export default function AnnouncementDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [tick, forceUpdate] = useState(0)

  const announcement = useMemo(() => getAnnouncement(params.id), [params.id, tick])

  if (!announcement) {
    return (
      <PageContainer>
        <Link
          href="/announcement-management"
          className="mb-4 inline-flex items-center gap-1 text-base text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" />
          返回公告清單
        </Link>
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-base text-gray-500">找不到這份公告</p>
        </div>
      </PageContainer>
    )
  }

  const a = announcement
  const correctedFrom = a.correctionOf ? getAnnouncement(a.correctionOf) : undefined
  const correctedBy = a.correctedBy ? getAnnouncement(a.correctedBy) : undefined

  const handleCorrect = () => {
    const correction = createCorrection(a.id)
    if (!correction) return
    toast.success("已建立更正版本")
    router.push(`/announcement-management/compose?id=${correction.id}`)
  }

  return (
    <PageContainer>
      <Link
        href="/announcement-management"
        className="mb-4 inline-flex items-center gap-1 text-base text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="h-4 w-4" />
        返回公告清單
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className={`text-sm ${ANNOUNCEMENT_STATUS_CONFIG[a.status].color}`}>
              {a.status}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {getCategoryLabel(a.category)}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {a.year}
            </Badge>
            {a.version > 1 && (
              <Badge variant="outline" className="text-sm">
                第 {a.version} 版
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{a.title}</h1>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => downloadAnnouncementDocument(a)}>
            <Download className="h-4 w-4" />
            匯出文稿
          </Button>
          {a.cases.length > 0 && (
            <Button variant="outline" className="gap-2" onClick={() => downloadCaseList(a)}>
              <Table2 className="h-4 w-4" />
              匯出名單
            </Button>
          )}
          {(a.status === "草稿" || a.status === "已排程") && (
            <Button asChild className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73]">
              <Link href={`/announcement-management/compose?id=${a.id}`}>
                <Pencil className="h-4 w-4" />
                編輯內容
              </Link>
            </Button>
          )}
          {a.status === "已發布" && (
            <>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  unpublishAnnouncement(a.id)
                  forceUpdate((n) => n + 1)
                  toast.success("公告已下架")
                }}
              >
                下架公告
              </Button>
              <Button className="gap-2 bg-[#2d3a8c] hover:bg-[#252f73]" onClick={handleCorrect}>
                <Pencil className="h-4 w-4" />
                建立更正公告
              </Button>
            </>
          )}
          {a.status === "已下架" && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                republishAnnouncement(a.id)
                forceUpdate((n) => n + 1)
                toast.success("公告已重新上架")
              }}
            >
              <Upload className="h-4 w-4" />
              重新上架
            </Button>
          )}
        </div>
      </div>

      {/* 版本鏈提示 */}
      {(correctedFrom || correctedBy) && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-base text-amber-900">
            {correctedFrom && (
              <p>
                本份為更正公告，更正自{" "}
                <Link
                  href={`/announcement-management/${correctedFrom.id}`}
                  className="font-medium underline"
                >
                  {correctedFrom.title}
                </Link>
              </p>
            )}
            {correctedBy && (
              <p>
                本份已由{" "}
                <Link
                  href={`/announcement-management/${correctedBy.id}`}
                  className="font-medium underline"
                >
                  {correctedBy.title}
                </Link>{" "}
                取代
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* 公文資訊 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">公文資訊</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="公文文號" value={a.docNumber || "未填"} highlight={!a.docNumber} />
              <Field label="發文日期" value={toRocDate(a.issueDate)} />
              <Field label="上架日期" value={toRocDate(a.publishDate)} />
              <Field label="生效／施行日期" value={toRocDate(a.effectiveDate)} />
              <Field label="發布單位" value={a.publisherUnit} />
              <Field label="置頂" value={a.isPinned ? "是" : "否"} />
              <Field label="涵蓋案件" value={`${a.cases.length} 筆`} />
              <Field label="附件" value={`${a.attachments.length} 件`} />
            </dl>
          </CardContent>
        </Card>

        {/* 公告內容 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">公告事項</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-base leading-relaxed text-gray-800">
              {a.content}
            </div>
          </CardContent>
        </Card>

        {/* 附件 */}
        {a.attachments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">附件（{a.attachments.length}）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {a.attachments.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
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
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-4 w-4" />
                    下載
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 涵蓋案件 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">涵蓋案件（{a.cases.length}）</CardTitle>
          </CardHeader>
          <CardContent>
            {a.cases.length === 0 ? (
              <p className="py-4 text-base text-gray-500">
                本份為醫事司自建公告，未彙整審查案件。
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>來源</TableHead>
                      <TableHead>主體</TableHead>
                      <TableHead>項目</TableHead>
                      <TableHead className="w-36">審查通過日</TableHead>
                      <TableHead className="w-32 text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {a.cases.map((c) => {
                      const source = getPendingCase(c.caseId)
                      return (
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
                            {source ? (
                              <Button asChild variant="outline" size="sm" className="gap-1">
                                <Link href={source.reviewHref}>
                                  <ExternalLink className="h-4 w-4" />
                                  檢視審查
                                </Link>
                              </Button>
                            ) : (
                              <span className="text-sm text-gray-400">案件已封存</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 歷程 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5" />
              作業歷程
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {a.history.map((h, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gray-300" />
                  <div>
                    <p className="text-base text-gray-900">{h.action}</p>
                    <p className="text-sm text-gray-500">
                      {toRocDate(h.at)}　{h.by}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className={`text-base ${highlight ? "text-amber-700" : "text-gray-900"}`}>{value}</dd>
    </div>
  )
}
