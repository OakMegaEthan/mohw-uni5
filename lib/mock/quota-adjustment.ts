import { allSocieties } from "@/lib/data/societies"
import { getHospitalQuotaDetail } from "@/lib/mock/review-hospital-quota"

// 容額微調的 mock 來源。
//
// 業務流程（見 docs/business-logic.md「容額微調」節）：
//   醫學會於系統外形成共識 → 醫學會填報（選醫院、填調整後容額、上傳附件）
//   → 醫事司審查（可退件）→ 審查通過 → 公告（與外加容額共用來源 tab）
//
// 審查鏈只有醫事司一段：不經醫策會初審、分組會議、RRC 大會。退件比照容額填報為
// 一等狀態（returnedFrom），醫學會補正重送後回醫事司續審。
//
// **總容額守恆**是本模組的核心不變量：微調只是在既有訓練醫院之間搬動容額，
// 有人增就有人減，增減相抵必為 0。醫學會送出前硬擋不平衡的案件。
//
// 參考公文（ref/婦產科及兒科微調容額的公文及附件/）顯示兩會來文格式不同：
//   婦產科：原公告 → 擬微調為（前後絕對值），14 家異動，25 → 25
//   兒科：核定容額 ＋ 申請微調容額（增減量）＋ 微調原因，總量維持 130
// 兒科格式的數字沒有方向（「1」可能是釋出也可能是招收，只能從原因欄文字判讀），
// 故系統統一收「調整後容額」，增減量與方向一律由系統推算——格式落差在系統內消失，
// 且推算結果直接就是醫事司最重視的「哪間減、哪間增」。

export type QuotaAdjustmentStage = "待送件" | "醫事司審查" | "審查通過"

export const QUOTA_ADJUSTMENT_STAGE_CONFIG: Record<
  QuotaAdjustmentStage,
  { color: string; label: string }
> = {
  待送件: { color: "bg-gray-100 text-gray-700 border-gray-200", label: "待送件" },
  醫事司審查: { color: "bg-amber-100 text-amber-800 border-amber-200", label: "醫事司審查" },
  審查通過: { color: "bg-green-100 text-green-800 border-green-200", label: "審查通過" },
}

/** 退件補正中：與階段並行的一等狀態（比照容額填報），非階段本身 */
export const ADJUSTMENT_RETURNED_BUCKET = {
  value: "returned" as const,
  label: "退件補正中",
  color: "bg-orange-100 text-orange-800 border-orange-200",
}

/** 微調的一列＝一家訓練醫院。base 為基準（原公告）容額，adjusted 為醫學會填的調整後容額。 */
export interface QuotaAdjustmentRow {
  hospitalCode: string
  hospitalName: string
  county: string
  /** 原公告容額，自容額填報帶入，不可編輯 */
  baseQuota: number
  /** 調整後容額，醫學會填 */
  adjustedQuota: number
  /** 微調原因（選填）。兒科來文有此欄、婦產科沒有 */
  reason: string
}

export interface QuotaAdjustmentAttachment {
  id: string
  name: string
  size: string
}

export interface QuotaAdjustmentHistoryEntry {
  at: string
  by: string
  action: string
}

export interface QuotaAdjustmentCase {
  id: string
  societyId: string
  societyName: string
  specialty: string
  year: string
  /** 同年度第 N 次微調（婦產科來文為「第 1 次微調」） */
  round: number
  stage: QuotaAdjustmentStage
  /** 有值＝退件補正中，值為退回自哪個階段 */
  returnedFrom: "醫事司審查" | null
  /** 民國日期字串 yyy/mm/dd（與全站顯示格式一致） */
  submittedDate: string | null
  approvedDate: string | null
  /** 只含有異動的醫院（調整後 ≠ 原公告者由畫面篩選，資料層保留醫學會挑選的全部列） */
  rows: QuotaAdjustmentRow[]
  attachments: QuotaAdjustmentAttachment[]
  /** 醫事司審查意見 */
  reviewComment: string
  history: QuotaAdjustmentHistoryEntry[]
}

// ── 基準容額：自容額填報帶入 ──────────────────────────────────

export interface BaselineHospital {
  code: string
  name: string
  county: string
  quota: number
}

/**
 * 該醫學會可微調的訓練醫院基準名單。
 * 取自容額填報的醫院列，排除聯合申請的 sub-row（容額為 null、由主訓機構統籌）。
 * mock 以容額填報的 currentQuota 當作「原公告容額」。
 */
export function getBaselineHospitals(societyId: string): BaselineHospital[] {
  const detail = getHospitalQuotaDetail(societyId)
  if (!detail) return []
  return detail.hospitals
    .filter((h) => !h.isSubRow && h.currentQuota != null)
    .map((h) => ({
      code: h.code,
      name: h.name,
      county: h.county ?? "",
      quota: h.currentQuota as number,
    }))
}

// ── 守恆計算 ────────────────────────────────────────────────

export interface AdjustmentBalance {
  /** 調增的總數（正值加總） */
  increased: number
  /** 調減的總數（負值加總的絕對值） */
  decreased: number
  /** 淨變動，必須為 0 才可送出 */
  net: number
  /** 實際有異動的醫院家數 */
  changedCount: number
}

export function rowDelta(r: QuotaAdjustmentRow): number {
  return r.adjustedQuota - r.baseQuota
}

export function getBalance(rows: QuotaAdjustmentRow[]): AdjustmentBalance {
  let increased = 0
  let decreased = 0
  let changedCount = 0
  rows.forEach((r) => {
    const d = rowDelta(r)
    if (d > 0) increased += d
    if (d < 0) decreased += -d
    if (d !== 0) changedCount += 1
  })
  return { increased, decreased, net: increased - decreased, changedCount }
}

/** 可送出的條件：至少一家異動，且增減相抵為 0 */
export function isBalanced(rows: QuotaAdjustmentRow[]): boolean {
  const b = getBalance(rows)
  return b.changedCount > 0 && b.net === 0
}

// ── mock 案件 ──────────────────────────────────────────────

const SOCIETY = (id: string) => allSocieties.find((s) => s.id === id)!

/** 依基準名單造出微調列：deltas 指定「第幾家醫院調整多少」，其餘不動 */
function buildRows(
  societyId: string,
  deltas: Array<{ index: number; delta: number; reason?: string }>,
): QuotaAdjustmentRow[] {
  const base = getBaselineHospitals(societyId)
  const byIndex = new Map(deltas.map((d) => [d.index, d]))
  return base.map((h, i) => {
    const d = byIndex.get(i)
    return {
      hospitalCode: h.code,
      hospitalName: h.name,
      county: h.county,
      baseQuota: h.quota,
      adjustedQuota: h.quota + (d?.delta ?? 0),
      reason: d?.reason ?? "",
    }
  })
}

// 兒科（id 4）：比照來文，2 家異動、總量不變（一家釋出、一家招收）
// 婦產科（id 5）：比照來文，多家異動、總量不變
// 內科（id 2）：待送件草稿，供填報頁 demo
const cases: QuotaAdjustmentCase[] = [
  {
    id: "adj-004-1",
    societyId: "4",
    societyName: SOCIETY("4").name,
    specialty: SOCIETY("4").specialty,
    year: "115 年度",
    round: 1,
    stage: "審查通過",
    returnedFrom: null,
    submittedDate: "115/06/04",
    approvedDate: "115/06/18",
    rows: buildRows("4", [
      { index: 0, delta: -1, reason: "釋出容額" },
      { index: 1, delta: 1, reason: "招收住院醫師" },
    ]),
    attachments: [
      { id: "adj4-1", name: "訓練容量微調一覽表.pdf", size: "0.4 MB" },
      { id: "adj4-2", name: "115年度兒科專科醫師訓練容量表.pdf", size: "1.1 MB" },
    ],
    reviewComment: "增減相抵為 0，總容額維持不變，名單與認定合格醫院一致，同意備查並辦理公告。",
    history: [
      { at: "115/06/04", by: "臺灣兒科醫學會", action: "送出容額微調申請" },
      { at: "115/06/18", by: "醫事司", action: "審查通過" },
    ],
  },
  {
    id: "adj-005-1",
    societyId: "5",
    societyName: SOCIETY("5").name,
    specialty: SOCIETY("5").specialty,
    year: "115 年度",
    round: 1,
    stage: "醫事司審查",
    returnedFrom: null,
    submittedDate: "115/06/01",
    approvedDate: null,
    rows: buildRows("5", [
      { index: 0, delta: 1, reason: "配合實際招收情況調增" },
      { index: 1, delta: 1, reason: "配合實際招收情況調增" },
      { index: 2, delta: -2, reason: "本年度未招收，釋出全部容額" },
    ]),
    attachments: [
      { id: "adj5-1", name: "訓練容量修正對照表.pdf", size: "0.5 MB" },
      { id: "adj5-2", name: "更新後婦產科專科醫師訓練醫院認定合格名單.pdf", size: "1.6 MB" },
    ],
    reviewComment: "",
    history: [{ at: "115/06/01", by: "台灣婦產科醫學會", action: "送出容額微調申請" }],
  },
  {
    id: "adj-002-1",
    societyId: "2",
    societyName: SOCIETY("2").name,
    specialty: SOCIETY("2").specialty,
    year: "115 年度",
    round: 1,
    stage: "待送件",
    returnedFrom: null,
    submittedDate: null,
    approvedDate: null,
    rows: buildRows("2", []),
    attachments: [],
    reviewComment: "",
    history: [],
  },
]

// ── 查詢與動作 ──────────────────────────────────────────────

export function getQuotaAdjustmentCases(): QuotaAdjustmentCase[] {
  return cases
}

export function getQuotaAdjustmentCase(id: string): QuotaAdjustmentCase | undefined {
  return cases.find((c) => c.id === id)
}

/** 送出審查（待送件／退件補正中 → 醫事司審查） */
export function submitAdjustment(id: string, rows: QuotaAdjustmentRow[], date: string): void {
  const c = getQuotaAdjustmentCase(id)
  if (!c) return
  c.rows = rows
  c.stage = "醫事司審查"
  c.returnedFrom = null
  c.submittedDate = date
  c.history.push({ at: date, by: c.societyName, action: "送出容額微調申請" })
}

/** 醫事司退件（醫事司審查 → 退件補正中） */
export function returnAdjustment(id: string, comment: string, date: string): void {
  const c = getQuotaAdjustmentCase(id)
  if (!c) return
  c.returnedFrom = "醫事司審查"
  c.reviewComment = comment
  c.history.push({ at: date, by: "醫事司", action: "退件補正" })
}

/** 醫事司審查通過（終點；交棒公告管理） */
export function approveAdjustment(id: string, comment: string, date: string): void {
  const c = getQuotaAdjustmentCase(id)
  if (!c) return
  c.stage = "審查通過"
  c.returnedFrom = null
  c.reviewComment = comment
  c.approvedDate = date
  c.history.push({ at: date, by: "醫事司", action: "審查通過" })
}
