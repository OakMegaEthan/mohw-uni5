// 待公告案件池：三條審查主線的終點都回到醫事司，由公告管理模組彙整成公告。
//
// 案件不是自己長出來的，而是從既有三個模組「衍生」而來（見 docs/announcement-module-plan.md）：
//   文件填報審查 /review/submissions        案件粒度＝文件類型 × 醫學會（最多 6 × 25）
//   容額填報審查 /review/hospital-quota     案件粒度＝醫學會
//   外加容額     /filing/additional-quota   案件粒度＝申請項目 uid（院 × 分科）
//   容額微調     /review/quota-adjustment   案件粒度＝醫學會 × 年度 × 第 N 次
// 後兩者同屬「外加/微調容額」這個來源 tab（07-31 決策 #2）。
//
// 公告端採「製作→發布」模型（見 docs/business-logic.md）。每案的公告進度：
//   待製作（無公告檔案）→ 已製作（官網公告文件已產出、有文號）→ 已公告（檔案被已發布的系統內公告引用）
// 工作台以此三階段分頁引導使用者的作業；已製作／已公告的檔案全程可下載（去官網另行公告）。

import {
  documentTypes,
  getDocumentSubmissions,
  getSocieties,
} from "@/lib/mock/review-submissions"
import { mockHospitalQuotaSocieties } from "@/lib/mock/review-hospital-quota"
import { getAdditionalQuotaApplications } from "@/lib/mock/additional-quota"
import { getBalance, getQuotaAdjustmentCases } from "@/lib/mock/quota-adjustment"
import { allSocieties } from "@/lib/data/societies"

/** 醫學會 id → 專科，供工作台「科別」欄帶出（#1：醫學會欄改科別） */
const SPECIALTY_BY_SOCIETY_ID = new Map(allSocieties.map((s) => [s.id, s.specialty]))

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
    // 外加容額與容額微調同屬一個文件分類（07-31 決策 #2），共用此來源 tab
    value: "additional-quota",
    label: "外加/微調容額",
    category: "additional-quota",
    subjectLabel: "申請單位",
    detailLabel: "申請分科",
  },
]

export function getSourceConfig(module: PendingSourceModule) {
  return PENDING_SOURCES.find((s) => s.value === module)!
}

/** 官網公告文件（公告檔案）表頭的一行文號（原始或歷次修正），比照 ref 認定合格名單表頭堆疊 */
export interface DocNumberEntry {
  /** 發文日期，ISO */
  date: string
  /** 人工輸入的公文文號字串（不自動配字尾） */
  docNumber: string
  /** true＝修正（表頭「…號公告修正」），false＝原始（「…號公告」） */
  isCorrection: boolean
}

/**
 * 公告檔案（官網公告文件），以醫學會／案件為單位。
 * 審查通過後於「待製作」清單製作；製作完成即為可重用檔案，發系統內公告時可引用它。
 * 文號與修正歷程掛在案件層級（非公告批次）。
 */
export interface OfficialDoc {
  /** 文號堆疊：[0] 原始，其後歷次修正；長度-1 ＝「第 N 次修正」 */
  entries: DocNumberEntry[]
  /** 首次製作日，ISO */
  producedDate: string
}

export interface PendingCase {
  id: string
  sourceModule: PendingSourceModule
  /** 案件主體：醫學會名稱或醫院名稱 */
  subject: string
  /** 科別（工作台主體欄以此呈現）：醫學會來源＝該會專科，外加容額＝申請分科 */
  specialty: string
  /** 次要識別：文件類型／申請分科／年度 */
  detail: string
  /** 供公告標題與名單表帶入用的完整案由 */
  title: string
  year: string
  /** 審查通過（進入待製作）的日期，ISO */
  approvedDate: string
  /** 回到來源模組檢視審查的連結 */
  reviewHref: string
  /** 公告檔案（官網公告文件）：null＝待製作，有值＝已製作 */
  officialDoc: OfficialDoc | null
  /** 引用此檔案並已發布的系統內公告 id：有值＝已公告（被公告流程引用過） */
  publishedPostId: string | null
  /** 系統內公告發布日，ISO（已公告才有），供工作台呈現 */
  publishedDate: string | null
}

/** 案件的公告進度（狀態衍生）：已公告 ＞ 已製作 ＞ 待製作。三者對應工作台的三個階段分頁。 */
export type CaseDocStatus = "待製作" | "已製作" | "已公告"

export const CASE_DOC_STATUS_CONFIG: Record<CaseDocStatus, { color: string; label: string }> = {
  待製作: { color: "bg-amber-100 text-amber-800 border-amber-200", label: "待製作" },
  已製作: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "已製作（待發布）" },
  已公告: { color: "bg-green-100 text-green-800 border-green-200", label: "已公告" },
}

export function getCaseDocStatus(c: PendingCase): CaseDocStatus {
  if (c.publishedPostId) return "已公告"
  if (c.officialDoc) return "已製作"
  return "待製作"
}

/** 公告檔案的修正次數（0＝原始，未製作回 -1） */
export function officialCorrectionCount(c: PendingCase): number {
  return c.officialDoc ? c.officialDoc.entries.length - 1 : -1
}

/** 案件是否已公告（＝公告檔案被某篇已發布系統內公告引用過）。外加容額成果報告據此反查。 */
export function isCaseAnnounced(c: PendingCase): boolean {
  return c.publishedPostId != null
}

// ── 由三個來源模組衍生初始案件池 ────────────────────────────────

function buildFromSubmissions(): PendingCase[] {
  const societies = getSocieties()
  const cases: PendingCase[] = []

  documentTypes.forEach((docType) => {
    getDocumentSubmissions(docType.id)
      .filter((s) => s.stage === "passed")
      .forEach((s) => {
        const society = societies.find((soc) => soc.id === s.societyId)
        if (!society) return
        cases.push({
          id: `sub-${docType.id}-${s.societyId}`,
          sourceModule: "submissions",
          subject: society.name,
          specialty: SPECIALTY_BY_SOCIETY_ID.get(s.societyId) ?? society.name,
          detail: docType.name,
          title: `${society.name}　${docType.name}`,
          year: "115 年度",
          approvedDate: s.lastUpdated ?? s.uploadedDate ?? "2026-01-15",
          reviewHref: `/review/${s.societyId}?docType=${docType.id}&stage=${s.stage}`,
          officialDoc: null,
          publishedPostId: null,
          publishedDate: null,
        })
      })
  })

  return cases
}

function buildFromQuotaFiling(): PendingCase[] {
  return mockHospitalQuotaSocieties
    .filter((s) => s.stage === "審查通過" && s.returnedFrom === null)
    .map((s) => ({
      id: `quota-${s.id}`,
      sourceModule: "quota-filing" as const,
      subject: s.name,
      specialty: SPECIALTY_BY_SOCIETY_ID.get(s.id) ?? s.name,
      detail: s.year,
      title: `${s.name}　${s.year}訓練醫院容額分配`,
      year: s.year,
      approvedDate: rocToIso(s.submittedDate) ?? "2026-01-10",
      reviewHref: `/review/hospital-quota/${s.id}`,
      officialDoc: null,
      publishedPostId: null,
      publishedDate: null,
    }))
}

function buildFromAdditionalQuota(): PendingCase[] {
  // 審查通過的外加容額案件皆進池；是否已公告由公告檔案是否被引用決定（見 seedInitialDocStates）
  return getAdditionalQuotaApplications()
    .filter((a) => a.stage === "審查通過")
    .map((a) => ({
      id: `aq-case-${a.id}`,
      sourceModule: "additional-quota" as const,
      subject: a.hospitalName,
      specialty: a.specialty,
      detail: a.specialty,
      title: `${a.hospitalName}　${a.specialty}外加容額 ${a.approvedQuota ?? 0} 名`,
      year: "115 年度",
      approvedDate: rocToIso(a.incomingDate) ?? "2026-01-08",
      reviewHref: `/filing/additional-quota/${a.id}`,
      officialDoc: null,
      publishedPostId: null,
      publishedDate: null,
    }))
}

function buildFromQuotaAdjustment(): PendingCase[] {
  // 容額微調與外加容額共用來源 tab；主體為醫學會（微調是會內既有醫院之間搬動容額）
  return getQuotaAdjustmentCases()
    .filter((c) => c.stage === "審查通過" && c.returnedFrom === null)
    .map((c) => {
      const b = getBalance(c.rows)
      return {
        id: `adj-case-${c.id}`,
        sourceModule: "additional-quota" as const,
        subject: c.societyName,
        specialty: c.specialty,
        detail: `第 ${c.round} 次微調`,
        title: `${c.societyName}　${c.year}訓練容額第 ${c.round} 次微調（${b.changedCount} 家異動）`,
        year: c.year,
        approvedDate: rocToIso(c.approvedDate) ?? "2026-06-18",
        reviewHref: `/review/quota-adjustment/${c.id}`,
        officialDoc: null,
        publishedPostId: null,
        publishedDate: null,
      }
    })
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
  ...buildFromQuotaAdjustment(),
]

// 種入初始的公告檔案進度，讓「已製作／已公告」與外加容額成果報告有展示資料。
// 規則為確定性（依 index／id），不依賴來源模組的公告欄位。
function seedInitialDocStates() {
  const produce = (c: PendingCase, date: string, docNumber: string) => {
    c.officialDoc = { entries: [{ date, docNumber, isCorrection: false }], producedDate: date }
  }
  const publish = (c: PendingCase, postId: string, date: string) => {
    c.publishedPostId = postId
    c.publishedDate = date
  }

  // 容額填報（3 案）：1 已公告、1 已製作、1 待製作
  const quota = pendingCases.filter((c) => c.sourceModule === "quota-filing")
  if (quota[0]) {
    produce(quota[0], "2026-03-05", "衛部醫字第 1151660208 號")
    publish(quota[0], "seed-post-quota-1", "2026-03-08")
  }
  if (quota[1]) produce(quota[1], "2026-03-06", "衛部醫字第 1151660251 號")

  // 文件填報：前 6 案已製作，其中前 3 案已發布（已公告）
  const subs = pendingCases.filter((c) => c.sourceModule === "submissions")
  subs.slice(0, 6).forEach((c, i) => {
    produce(c, "2026-03-10", `衛部醫字第 11516603${String(30 + i).padStart(2, "0")} 號`)
    if (i < 3) publish(c, "seed-post-doc-1", "2026-03-12")
  })

  // 外加容額：id 序號為偶數者已公告（含部分「支援偏鄉」，供成果報告反查）
  const aq = pendingCases.filter((c) => c.sourceModule === "additional-quota")
  aq.forEach((c) => {
    const seq = Number(c.id.replace(/\D/g, "")) || 0
    if (seq % 2 === 0) {
      produce(c, "2026-02-28", `衛部醫字第 11516701${String((seq % 90) + 10).padStart(2, "0")} 號`)
      publish(c, "seed-post-aq-1", "2026-03-02")
    }
  })
}
seedInitialDocStates()

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

/** 各來源尚待處理（待製作或已製作、尚未公告）的筆數，供來源 tab badge 使用 */
export function getPendingCountBySource(): Record<PendingSourceModule, number> {
  const counts = { submissions: 0, "quota-filing": 0, "additional-quota": 0 } as Record<
    PendingSourceModule,
    number
  >
  pendingCases.forEach((c) => {
    const s = getCaseDocStatus(c)
    if (s === "待製作" || s === "已製作") counts[c.sourceModule] += 1
  })
  return counts
}

/**
 * 各階段的案件筆數，供首頁兩個公告模組入口的 badge 使用：
 * 「公告文件製作」看 待製作、「站內公告管理」看 已製作（待發布）。
 */
export function getCaseDocStatusCounts(): Record<CaseDocStatus, number> {
  const counts = { 待製作: 0, 已製作: 0, 已公告: 0 } as Record<CaseDocStatus, number>
  pendingCases.forEach((c) => (counts[getCaseDocStatus(c)] += 1))
  return counts
}

export function getTotalPendingCount(): number {
  return pendingCases.filter((c) => {
    const s = getCaseDocStatus(c)
    return s === "待製作" || s === "已製作"
  }).length
}

// ── 公告檔案模型的動作（Phase A）──────────────────────────────
// 製作公告檔案（待製作 → 已製作）、更正（疊文號）、發系統內公告引用檔案（已製作 → 已公告）。

/** 製作公告檔案：為所選案件建立官網公告文件，文號為手動輸入字串（不自動配字尾）。 */
export function produceOfficialDocs(caseIds: string[], date: string, docNumber: string): void {
  pendingCases.forEach((c) => {
    if (caseIds.includes(c.id) && !c.officialDoc) {
      c.officialDoc = {
        entries: [{ date, docNumber, isCorrection: false }],
        producedDate: date,
      }
    }
  })
}

/** 更正公告檔案：在該案件文件表頭疊一行修正文號（第 N 次修正）。 */
export function addOfficialCorrection(caseId: string, date: string, docNumber: string): void {
  const c = getPendingCase(caseId)
  if (c?.officialDoc) {
    c.officialDoc.entries.push({ date, docNumber, isCorrection: true })
  }
}

/** 發系統內公告：引用所選（已製作）案件的公告檔案，回填 publishedPostId／日期＝已公告。 */
export function publishReferencedCases(caseIds: string[], postId: string, publishDate: string): void {
  pendingCases.forEach((c) => {
    if (caseIds.includes(c.id) && c.officialDoc) {
      c.publishedPostId = postId
      c.publishedDate = publishDate
    }
  })
}

/** 已製作但尚未發布的案件（可被系統內公告引用） */
export function getProducedUnpublishedCases(): PendingCase[] {
  return pendingCases.filter((c) => c.officialDoc && !c.publishedPostId)
}
