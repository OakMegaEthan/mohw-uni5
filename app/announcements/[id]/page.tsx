"use client"

import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Building2, FileText, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getAnnouncementDetail, getCategoryLabel } from "@/lib/mock/announcements"

export default function AnnouncementDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const announcement = getAnnouncementDetail(params.id)

  if (!announcement) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:py-8 max-w-6xl">
      {/* 返回按鈕 */}
      <div className="mb-4 sm:mb-6">
        <Link href="/announcements">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">返回公告列表</span>
            <span className="sm:hidden">返回</span>
          </Button>
        </Link>
      </div>

      {/* 公告標題區 */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <Badge variant="outline" className="w-fit text-sm sm:text-sm">
              {getCategoryLabel(announcement.category)}
            </Badge>
            <CardTitle className="text-xl sm:text-3xl leading-tight">{announcement.title}</CardTitle>
            <CardDescription className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm sm:text-base">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                發布日期：{announcement.publishDate}
              </span>
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                發布單位：{announcement.publisherUnit}
              </span>
              {announcement.effectiveDate && (
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  生效日期：{announcement.effectiveDate}
                </span>
              )}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {/* 公告內容 */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">公告內容</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="prose prose-sm max-w-none text-sm sm:text-base">
            <div className="whitespace-pre-wrap leading-relaxed">{announcement.content}</div>
          </div>
        </CardContent>
      </Card>

      {/* 附件下載 */}
      {announcement.attachments && announcement.attachments.length > 0 && (
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              相關附件 ({announcement.attachments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-2 sm:space-y-3">
              {announcement.attachments.map((attachment: any) => (
                <div
                  key={attachment.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate text-sm sm:text-base">{attachment.name}</p>
                      <p className="text-sm sm:text-sm text-muted-foreground">
                        {attachment.size} · 上傳日期：{attachment.uploadDate}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 w-full sm:w-auto sm:flex-shrink-0 bg-transparent"
                  >
                    <Download className="h-4 w-4" />
                    下載
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 相關公告 */}
      {announcement.relatedAnnouncements && announcement.relatedAnnouncements.length > 0 && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">相關公告</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-2">
              {announcement.relatedAnnouncements.map((related: any) => (
                <Link key={related.id} href={`/announcements/${related.id}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-start sm:items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 sm:mt-0" />
                      <span className="font-medium text-sm sm:text-base">{related.title}</span>
                    </div>
                    <span className="text-sm sm:text-sm text-muted-foreground sm:flex-shrink-0 ml-7 sm:ml-0">
                      {related.date}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
