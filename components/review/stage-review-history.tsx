"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download, FileText, Users } from "lucide-react"
import {
  quotaReviewStageConfig,
  type StageReviewRecord,
} from "@/lib/mock/review-hospital-quota"

/**
 * 前置階段審查結果。
 *
 * 案件走到哪個階段，就列出該階段之前每一關的結論 —— 待公告的醫事司因此看得到
 * 醫策會初審、分組會議與 RRC 大會三份紀錄，而不是只看得到分組會議。
 *
 * 紀錄全文以彈窗呈現，操作方式比照填報端退件時的「查看審查意見」
 * （components/filing/review-feedback-banner.tsx）。
 */

function decisionStyle(decision: string) {
  if (decision === "退回補正") return "border-orange-200 bg-orange-50 text-orange-700"
  if (decision === "待討論") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-green-200 bg-green-50 text-green-700"
}

function StageReviewRow({ record }: { record: StageReviewRecord }) {
  const [isOpen, setIsOpen] = useState(false)
  const isMeeting = record.kind === "meeting"
  // 初審／核定不是會議，硬套「檢視會議記錄」會誤導
  const viewLabel = isMeeting ? "檢視會議記錄" : "檢視審查意見"
  const dateLabel = isMeeting ? "會議日期" : "審查日期"

  return (
    <div className="px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`${quotaReviewStageConfig[record.stage].color} text-sm`}>
              {quotaReviewStageConfig[record.stage].label}
            </Badge>
            <span className="text-base font-medium text-foreground">{record.title}</span>
          </div>
          <p className="text-base text-gray-600">
            審查單位：<span className="font-medium text-gray-900">{record.unit}</span>
            <span className="mx-2 text-gray-300">|</span>
            {dateLabel}：<span className="font-medium text-gray-900">{record.reviewDate}</span>
            <span className="mx-2 text-gray-300">|</span>
            決議：
            <Badge variant="outline" className={`ml-1 ${decisionStyle(record.decision)}`}>
              {record.decision}
            </Badge>
          </p>
          <p className="flex items-center gap-1.5 text-sm text-gray-500">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            {record.recordFileName}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setIsOpen(true)}>
            <FileText className="h-4 w-4" />
            {viewLabel}
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            下載
          </Button>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              {viewLabel}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">審查階段</span>
                  <p className="font-medium text-foreground">
                    {quotaReviewStageConfig[record.stage].label}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">審查單位</span>
                  <p className="font-medium text-foreground">{record.unit}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{dateLabel}</span>
                  <p className="font-medium text-foreground">{record.reviewDate}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">決議</span>
                  <p className="font-medium text-foreground">{record.decision}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-medium text-foreground">{record.title}</h4>
              <div className="rounded-lg border bg-white p-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {record.recordContent}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" className="gap-1">
              <Download className="h-4 w-4" />
              下載 {record.recordFileName}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              關閉
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function StageReviewHistory({ records }: { records: StageReviewRecord[] }) {
  if (records.length === 0) return null

  return (
    <div className="mb-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
        <Users className="h-5 w-5 text-muted-foreground" />
        前置階段審查結果
        <span className="text-base font-normal text-muted-foreground">（{records.length} 筆）</span>
      </h3>
      <Card>
        <CardContent className="divide-y p-0">
          {records.map((record) => (
            <StageReviewRow key={`${record.stage}-${record.decision}`} record={record} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
