"use client"

import { useMemo, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  QUOTA_YEARS,
  getQuotaSettlement,
  type AdditionalQuotaApplication,
  type QuotaTimelineEntry,
  type QuotaYearSettlement,
} from "@/lib/mock/additional-quota"
import { getAccreditation } from "@/lib/mock/hospital-quota-history"

/**
 * 該院該專科的縱貫紀錄，供醫事司判斷本次該核定多少外加容額。
 *
 * 主軸是**事件類型**而非年度：
 * - 認定與容額申請紀錄 —— 機構資格與逐年的基準容額
 * - 容額調整紀錄 —— 基準之後的每一次異動（外加容額＋容額微調）
 *
 * 年度是 filter 不是 tab，且**預設「全部年度」**——這個區塊是回顧面，
 * 要看的是跨年度的趨勢；列表頁預設當年度是因為那是工作面，兩者性質不同。
 */

const ALL_YEARS = "all"

// ── 共用 ────────────────────────────────────────────────────

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <Badge variant="outline" className="shrink-0 border-gray-200 bg-gray-100 text-gray-600">
        未異動
      </Badge>
    )
  }
  const up = delta > 0
  return (
    <Badge
      variant="outline"
      className={`shrink-0 ${up ? "border-green-200 bg-green-100 text-green-700" : "border-orange-200 bg-orange-100 text-orange-700"}`}
    >
      {up ? "+" : "−"}
      {Math.abs(delta)} 名
    </Badge>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-base font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-base text-gray-900">{children}</dd>
    </div>
  )
}

// ── Tab 1：認定與容額申請紀錄 ───────────────────────────────

function AccreditationSummary({ application }: { application: AdditionalQuotaApplication }) {
  const a = getAccreditation(application.hospitalName, application.specialty)

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
      <h4 className="text-base font-bold text-gray-900">現行認定資格</h4>
      <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <Field label="資格效期">
          {a.startYear}/08/01 ～ {a.endYear}/07/31
          {a.extension && (
            <span className="ml-2 text-gray-600">
              （已展延 {a.extension.years} 年，至 {a.extension.untilYear}/07/31）
            </span>
          )}
        </Field>
        <Field label="可收訓容額">{a.trainingLimit} 名</Field>
        <Field label="申請類型">{a.applicationType}</Field>
        <Field label="合作機構">{a.partners.length > 0 ? a.partners.join("、") : "—"}</Field>
      </dl>
      <p className="mt-3 text-base text-gray-500">
        認定資格為多年期，不隨年度變動；下方為逐年的容額核定。
      </p>
    </div>
  )
}

function AnnualApprovalCard({ settlement }: { settlement: QuotaYearSettlement }) {
  const { base } = settlement

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="text-base font-medium text-gray-900">{base.year}</div>
        <Badge variant="outline" className="shrink-0 border-green-200 bg-green-100 text-green-700">
          認定{base.result} · 核定 {base.approvedQuota} 名
        </Badge>
      </div>
      <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <Field label="申請醫學會">{base.societyName}</Field>
        <Field label="核定日期">{base.approvedDate}</Field>
        <Field label="建議分配">{base.proposedQuota} 名</Field>
        <Field label="審查核定">{base.approvedQuota} 名</Field>
      </dl>
    </div>
  )
}

// ── Tab 2：容額調整紀錄 ─────────────────────────────────────

function SettlementBar({ settlement }: { settlement: QuotaYearSettlement }) {
  // 待審查的案件不改變容額，不計入異動次數
  const effective = settlement.entries.filter((e) => e.delta !== 0).length

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-base text-gray-700">
        <span className="font-medium">{settlement.year}</span>
        <span className="mx-2 text-gray-300">·</span>
        核定 <strong className="text-gray-900">{settlement.base.approvedQuota}</strong> 名
        <span className="mx-2 text-gray-400">→</span>
        經 <strong className="text-gray-900">{effective}</strong> 次異動
        <span className="mx-2 text-gray-400">→</span>
        目前 <strong className="text-lg text-[#2d3a8c]">{settlement.finalQuota}</strong> 名
      </p>
    </div>
  )
}

function TimelineEntryCard({ entry, currentId }: { entry: QuotaTimelineEntry; currentId: string }) {
  const isAdditional = entry.kind === "外加容額"
  const app = entry.application
  const adj = entry.adjustment
  const isCurrentCase = app?.id === currentId

  return (
    <div
      className={`rounded-lg border p-4 ${
        isCurrentCase ? "border-[#2d3a8c] bg-blue-50/40" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Badge
            variant="outline"
            className={
              isAdditional
                ? "border-indigo-200 bg-indigo-100 text-indigo-700"
                : "border-purple-200 bg-purple-100 text-purple-700"
            }
          >
            {entry.kind}
          </Badge>
          <span className="text-base text-gray-600">{entry.date}</span>
          {app && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-base text-gray-600">{app.incomingDocNumber}</span>
            </>
          )}
          {adj && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-base text-gray-600">第 {adj.round} 次微調</span>
            </>
          )}
          {isCurrentCase && (
            <Badge variant="outline" className="border-[#2d3a8c] bg-white text-[#2d3a8c]">
              本案
            </Badge>
          )}
        </div>
        <DeltaBadge delta={entry.delta} />
      </div>

      <p className="mt-2 text-base text-gray-700">
        {entry.before} 名
        <span className="mx-2 text-gray-400">→</span>
        <strong className="text-gray-900">{entry.after} 名</strong>
        {app && app.stage === "待審查" && (
          <span className="ml-2 text-gray-500">（審查中，尚未計入）</span>
        )}
      </p>

      <dl className="mt-3 space-y-2">
        {app && (
          <>
            <Field label="申請人數">{app.requestedQuota} 名</Field>
            <Field label="分類原則">{app.classificationPrinciple}</Field>
            <Field label="申請緣由">{app.requestReason}</Field>
            {app.reviewComment && <Field label="審查意見">{app.reviewComment}</Field>}
          </>
        )}
        {adj && (
          <>
            <Field label="提出醫學會">{adj.societyName}</Field>
            <Field label="微調原因">{adj.reason}</Field>
            <Field label="審查意見">{adj.reviewComment}</Field>
          </>
        )}
      </dl>
    </div>
  )
}

// ── 區塊本體 ────────────────────────────────────────────────

type HistoryTab = "accreditation" | "adjustment"

export function AdditionalQuotaHistory({ application }: { application: AdditionalQuotaApplication }) {
  const [tab, setTab] = useState<HistoryTab>("accreditation")
  const [year, setYear] = useState<string>(ALL_YEARS)

  const settlements = useMemo(
    () =>
      QUOTA_YEARS.map((y) => getQuotaSettlement(application.hospitalName, application.specialty, y)),
    [application.hospitalName, application.specialty],
  )

  const visible = year === ALL_YEARS ? settlements : settlements.filter((s) => s.year === year)

  const tabs: { value: HistoryTab; label: string; count: number }[] = [
    { value: "accreditation", label: "認定與容額申請紀錄", count: visible.length },
    {
      value: "adjustment",
      label: "容額調整紀錄",
      count: visible.reduce((n, s) => n + s.entries.length, 0),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>歷年紀錄</CardTitle>
        <p className="mt-1 text-base text-gray-500">
          {application.hospitalName}（{application.specialty}）的認定資格、逐年核定容額與歷次異動，
          供判斷本次核定容額參考
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-gray-200">
          <div className="flex items-center gap-6">
            {tabs.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`relative -mb-px flex items-center border-b-2 px-1 pb-3 text-base font-medium transition-colors ${
                  tab === t.value
                    ? "border-[#2d3a8c] text-[#2d3a8c]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
                <Badge variant="secondary" className="ml-1.5 h-6 px-2 text-base">
                  {t.count}
                </Badge>
              </button>
            ))}
          </div>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="mb-2 h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_YEARS}>全部年度</SelectItem>
              {QUOTA_YEARS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {tab === "accreditation" ? (
          <div className="space-y-3">
            <AccreditationSummary application={application} />
            {visible.map((s) => (
              <AnnualApprovalCard key={s.year} settlement={s} />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {visible.map((s) => (
              <div key={s.year} className="space-y-3">
                <SettlementBar settlement={s} />
                {s.entries.length > 0 ? (
                  // 由新到舊：最近一次異動最相關
                  [...s.entries]
                    .reverse()
                    .map((e, i) => (
                      <TimelineEntryCard
                        key={`${e.kind}-${e.date}-${i}`}
                        entry={e}
                        currentId={application.id}
                      />
                    ))
                ) : (
                  <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-8 text-center text-base text-gray-500">
                    {s.year}無容額異動紀錄
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
