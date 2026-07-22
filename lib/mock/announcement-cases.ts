// 待公告案件池：三條審查主線的終點都回到醫事司，由公告管理模組彙整成公告。
//
// 案件不是自己長出來的，而是從既有三個模組「衍生」而來（見 docs/announcement-module-plan.md）：
//   文件填報審查 /review/submissions      案件粒度＝文件類型 × 醫學會（最多 6 × 25）
//   容額填報審查 /review/hospital-quota   案件粒度＝醫學會
//   外加容額     /filing/additional-quota 案件粒度＝申請項目 uid（院 × 分科）
//
// 案件 → 公告是「多對一」：一份公告彙整多筆案件（例如一份認定基準公告涵蓋 25 個醫學會）。
// 因此案件除了來源模組給的階段外，還需要公告端的狀態：
//   待公告 → 公告編製中（已被某份草稿收錄，鎖定避免重複收錄）→ 已公告
// 另有「已延後」：本批不公告、留待下批，可還原。這取代舊版那顆會靜默丟棄案件的 X 鈕。

import {
  documentTypes,
  getDocumentSubmissions,
  getSocieties,
} from "@/lib/mock/review-submissions"
import { mockHospitalQuotaSocieties } from "@/lib/mock/review-hospital-quota"
import { getAdditionalQuotaApplications } from "@/lib/mock/additional-quota"

export type PendingSourceModule = "submissions" | "quota-filing" | "additional-quota"

export const PENDING_SOURCES: Array<{
  value: PendingSourceModule
  label: string
  /** 該來源的案件彙整成公告時的預設公告類別 */
  category: string
  /** 第二欄的欄名（各來源的主體不同） */
  subjectLabel: string
  /** 第三欄的欄名 */
  detailLabel: string
}> = [
  {
    value: "submissions",
    label: "文件填報審查",
    category: "training-document",
    subjectLabel: "醫學會",
    detailLabel: "文件類型",
  },
  {
    value: "quota-filing",
    label: "容額填報審查",
    category: "hospital-quota",
    subjectLabel: "醫學會",
    detailLabel: "年度",
  },
  {
    value: "additional-quota",
    label: "外加容額",
    category: "additional-quota",
    subjectLabel: "訓練醫院",
    detailLabel: "申請分科",
  },
]

export function getSourceConfig(module: PendingSourceModule) {
  return PENDING_SOURCES.find((s) => s.value === module)!
}

export type PendingCaseStatus = "待公告" | "公告編製中" | "已延後" | "已公告"

export const PENDING_CASE_STATUS_CONFIG: Record<PendingCaseStatus, { color: string }> = {
  待公告: { color: "bg-amber-100 text-amber-800 border-amber-200" },
  公告編製中: { color: "bg-blue-100 text-blue-800 border-blue-200" },
  已延後: { color: "bg-gray-100 text-gray-600 border-gray-200" },
  已公告: { color: "bg-green-100 text-green-800 border-green-200" },
}

export interface PendingCase {
  id: string
  sourceModule: PendingSourceModule
  /** 案件主體：醫學會名稱或醫院名稱 */
  subject: string
  /** 次要識別：文件類型／申請分科／年度 */
  detail: string
  /** 供公告標題與名單表帶入用的完整案由 */
  title: string
  year: string
  /** 審查通過（進入待公告）的日期，ISO */
  approvedDate: string
  status: PendingCaseStatus
  /** 已被哪份公告草稿收錄 */
  draftId: string | null
  /** 已由哪份公告發布 */
  announcementId: string | null
  deferReason: string | null
  /** 回到來源模組檢視審查的連結 */
  reviewHref: string
}

// ── 由三個來源模組衍生初始案件池 ────────────────────────────────

function buildFromSubmissions(): PendingCase[] {
  const societies = getSocieties()
  const cases: PendingCase[] = []

  documentTypes.forEach((docType) => {
    getDocumentSubmissions(docType.id)
      .filter((s) => s.stage === "pending-announcement")
      .forEach((s) => {
        const society = societies.find((soc) => soc.id === s.societyId)
        if (!society) return
        cases.push({
          id: `sub-${docType.id}-${s.societyId}`,
          sourceModule: "submissions",
          subject: society.name,
          detail: docType.name,
          title: `${society.name}　${docType.name}`,
          year: "115 年度",
          approvedDate: s.lastUpdated ?? s.uploadedDate ?? "2026-01-15",
          status: "待公告",
          draftId: null,
          announcementId: null,
          deferReason: null,
          reviewHref: `/review/${s.societyId}?docType=${docType.id}&stage=${s.stage}`,
        })
      })
  })

  return cases
}

function buildFromQuotaFiling(): PendingCase[] {
  return mockHospitalQuotaSocieties
    .filter((s) => s.stage === "待公告" && s.returnedFrom === null)
    .map((s) => ({
      id: `quota-${s.id}`,
      sourceModule: "quota-filing" as const,
      subject: s.name,
      detail: s.year,
      title: `${s.name}　${s.year}訓練醫院容額分配`,
      year: s.year,
      approvedDate: rocToIso(s.submittedDate) ?? "2026-01-10",
      status: "待公告" as const,
      draftId: null,
      announcementId: null,
      deferReason: null,
      reviewHref: `/review/hospital-quota/${s.id}`,
    }))
}

function buildFromAdditionalQuota(): PendingCase[] {
  return getAdditionalQuotaApplications()
    .filter((a) => a.stage === "待公告")
    .map((a) => ({
      id: `aq-case-${a.id}`,
      sourceModule: "additional-quota" as const,
      subject: a.hospitalName,
      detail: a.specialty,
      title: `${a.hospitalName}　${a.specialty}外加容額 ${a.approvedQuota ?? 0} 名`,
      year: "115 年度",
      approvedDate: rocToIso(a.incomingDate) ?? "2026-01-08",
      status: "待公告" as const,
      draftId: null,
      announcementId: null,
      deferReason: null,
      reviewHref: `/filing/additional-quota/${a.id}`,
    }))
}

/** 民國 "115/01/05" → 西元 "2026-01-05"；格式不符時回 null */
function rocToIso(value: string | null): string | null {
  if (!value) return null
  const m = value.match(/^(\d{3})\/(\d{2})\/(\d{2})$/)
  if (!m) return value.includes("-") ? value : null
  return `${Number(m[1]) + 1911}-${m[2]}-${m[3]}`
}

// module-level singleton：頁面間導航（compose → pending）不會丟失，與 quota-notes-store 同模式
const pendingCases: PendingCase[] = [
  ...buildFromSubmissions(),
  ...buildFromQuotaFiling(),
  ...buildFromAdditionalQuota(),
]

// ── 查詢 ────────────────────────────────────────────────────

export function getPendingCases(): PendingCase[] {
  return pendingCases
}

export function getPendingCasesBySource(module: PendingSourceModule): PendingCase[] {
  return pendingCases.filter((c) => c.sourceModule === module)
}

export function getPendingCase(id: string): PendingCase | undefined {
  return pendingCases.find((c) => c.id === id)
}

export function getPendingCasesByIds(ids: string[]): PendingCase[] {
  return ids.map((id) => getPendingCase(id)).filter((c): c is PendingCase => Boolean(c))
}

/** 各來源尚待處理（待公告）的筆數，供 tab badge 使用 */
export function getPendingCountBySource(): Record<PendingSourceModule, number> {
  const counts = { submissions: 0, "quota-filing": 0, "additional-quota": 0 } as Record<
    PendingSourceModule,
    number
  >
  pendingCases.forEach((c) => {
    if (c.status === "待公告") counts[c.sourceModule] += 1
  })
  return counts
}

export function getTotalPendingCount(): number {
  return pendingCases.filter((c) => c.status === "待公告").length
}

// ── 狀態變更 ──────────────────────────────────────────────────

/** 收錄進草稿：鎖定案件，避免被另一份草稿重複收錄 */
export function attachCasesToDraft(caseIds: string[], draftId: string): void {
  pendingCases.forEach((c) => {
    if (caseIds.includes(c.id) && c.status !== "已公告") {
      c.status = "公告編製中"
      c.draftId = draftId
    }
  })
}

/** 自草稿移除（或草稿刪除）：釋回待公告池 */
export function detachCasesFromDraft(caseIds: string[]): void {
  pendingCases.forEach((c) => {
    if (caseIds.includes(c.id) && c.status === "公告編製中") {
      c.status = "待公告"
      c.draftId = null
    }
  })
}

/** 草稿被刪除時，釋回其收錄的全部案件 */
export function releaseDraftCases(draftId: string): void {
  pendingCases.forEach((c) => {
    if (c.draftId === draftId && c.status === "公告編製中") {
      c.status = "待公告"
      c.draftId = null
    }
  })
}

/** 公告發布：回寫案件為已公告 */
export function markCasesAnnounced(caseIds: string[], announcementId: string): void {
  pendingCases.forEach((c) => {
    if (caseIds.includes(c.id)) {
      c.status = "已公告"
      c.announcementId = announcementId
      c.draftId = null
    }
  })
}

/** 延後至下批（取代舊版的「忽略」），可還原 */
export function deferCases(caseIds: string[], reason: string): void {
  pendingCases.forEach((c) => {
    if (caseIds.includes(c.id) && c.status === "待公告") {
      c.status = "已延後"
      c.deferReason = reason
    }
  })
}

export function restoreCases(caseIds: string[]): void {
  pendingCases.forEach((c) => {
    if (caseIds.includes(c.id) && c.status === "已延後") {
      c.status = "待公告"
      c.deferReason = null
    }
  })
}
