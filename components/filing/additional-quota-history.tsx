"use client"

import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getApplicationHistory, type AdditionalQuotaApplication } from "@/lib/mock/additional-quota"

/**
 * 歷年申請與核定紀錄：同院同專科在各年度的其他申請案，供醫事司判斷本次該核定多少容額。
 *
 * 以年度分頁而非攤平成一串，因為「當年度是否已經申請過」與「前一年度給了多少」
 * 是兩種不同的判斷；分頁讓使用者一次只看一個年度。
 *
 * 不含成果報告——報告於案件公告執行滿一年後才提交，本年度作業時尚未產生。
 */

/** 審查結果一律由 stage 與 approvedQuota 推導，不另存「是否同意」欄位（狀態機無「審查未通過」）。 */
function reviewOutcome(a: AdditionalQuotaApplication): { label: string; className: string } {
  if (a.stage !== "審查通過") {
    return { label: "審查中", className: "bg-blue-100 text-blue-700 border-blue-200" }
  }
  if (a.approvedQuota === 0) {
    return { label: "未同意外加", className: "bg-gray-100 text-gray-600 border-gray-200" }
  }
  return { label: `同意外加 · 核定 ${a.approvedQuota} 名`, className: "bg-green-100 text-green-700 border-green-200" }
}

function HistoryEntry({ application }: { application: AdditionalQuotaApplication }) {
  const outcome = reviewOutcome(application)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="text-base text-gray-600">
          {application.incomingDate}
          <span className="mx-2 text-gray-300">·</span>
          {application.incomingDocNumber}
        </div>
        <Badge variant="outline" className={`shrink-0 ${outcome.className}`}>
          {outcome.label}
        </Badge>
      </div>

      <p className="mt-2 text-base text-gray-700">
        申請人數 <strong className="text-gray-900">{application.requestedQuota}</strong> 名
      </p>

      <dl className="mt-3 space-y-2">
        <div>
          <dt className="text-base font-medium text-gray-500">申請緣由</dt>
          <dd className="mt-0.5 whitespace-pre-wrap text-base text-gray-900">{application.requestReason}</dd>
        </div>
        {application.reviewComment && (
          <div>
            <dt className="text-base font-medium text-gray-500">審查意見</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-base text-gray-900">{application.reviewComment}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}

export function AdditionalQuotaHistory({ application }: { application: AdditionalQuotaApplication }) {
  const history = getApplicationHistory(application.hospitalName, application.specialty, application.id)
  const [activeYear, setActiveYear] = useState(history[0]?.year ?? "")
  const active = history.find((h) => h.year === activeYear)

  return (
    <Card>
      <CardHeader>
        <CardTitle>歷年申請與核定紀錄</CardTitle>
        <p className="mt-1 text-base text-gray-500">
          {application.hospitalName}（{application.specialty}）於各年度的其他申請案，供判斷本次核定容額參考
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-6 border-b border-gray-200">
          {history.map((h) => (
            <button
              key={h.year}
              onClick={() => setActiveYear(h.year)}
              className={`relative -mb-px flex items-center border-b-2 px-1 pb-3 text-base font-medium transition-colors ${
                activeYear === h.year
                  ? "border-[#2d3a8c] text-[#2d3a8c]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {h.year}
              <Badge variant="secondary" className="ml-1.5 h-6 px-2 text-base">
                {h.applications.length}
              </Badge>
            </button>
          ))}
        </div>

        {active && active.applications.length > 0 ? (
          <div className="space-y-3">
            {active.applications.map((a) => (
              <HistoryEntry key={a.id} application={a} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-8 text-center text-base text-gray-500">
            {activeYear}無其他申請紀錄
          </p>
        )}
      </CardContent>
    </Card>
  )
}
