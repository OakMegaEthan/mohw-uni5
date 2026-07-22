// 容額填報案件的階段模型（醫學會填報視角）。
//
// 完整生命週期（見 docs/business-logic.md）：
//   待送件 → 醫策會初審 → 分組會議 → RRC大會 → 待公告 → 已公告
//
// 退件為一等狀態，可自任一審查階段退回醫學會。退件記錄 returnedFrom（退回自哪個階段），
// 醫學會補正重送後，案件回到該階段續審，不重走整條鏈（resumeStage 規則）。
//
// 從醫學會（填報）視角，審查各子階段皆為唯讀「審查中」；可編輯僅在待送件與退件。

export type QuotaFilingStage = "待送件" | "醫策會初審" | "分組會議" | "RRC大會" | "待公告" | "已公告"

// 有序階段鏈，供進度指示器使用
export const QUOTA_FILING_STAGES: QuotaFilingStage[] = [
  "待送件",
  "醫策會初審",
  "分組會議",
  "RRC大會",
  "待公告",
  "已公告",
]

// 各審查階段對應的負責單位（退件時顯示「退回自 X」用）
export const QUOTA_FILING_STAGE_UNIT: Record<QuotaFilingStage, string> = {
  待送件: "醫學會",
  醫策會初審: "醫策會",
  分組會議: "醫策會",
  RRC大會: "RRC 大會",
  待公告: "醫事司",
  已公告: "醫事司",
}

/** 醫學會可編輯申請內容的階段：待送件，或已退件補正中。 */
export function isQuotaFilingEditable(stage: QuotaFilingStage, returned: boolean): boolean {
  return stage === "待送件" || returned
}

export function isValidQuotaFilingStage(value: string): value is QuotaFilingStage {
  return (QUOTA_FILING_STAGES as string[]).includes(value)
}

// ── 容額成果報告子狀態 ──────────────────────────────────────────
// 案件進待公告後，醫學會需上傳「容額成果報告」（RRC 審查後的審查細節補充，非執行成效）。
// 直接送醫事司，不經醫策會。醫事司確認歸檔或退回補件。子狀態獨立於公告進度。
//   待上傳 → 已送出（待醫事司確認）→ 已歸檔 ／ 退回補件（醫學會重新上傳）

export type OutcomeReportSubStatus = "待上傳" | "已送出" | "已歸檔" | "退回補件"

export const OUTCOME_REPORT_SUB_CONFIG: Record<OutcomeReportSubStatus, { color: string; label: string }> = {
  待上傳: { color: "bg-gray-100 text-gray-600 border-gray-200", label: "待上傳" },
  已送出: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "待確認" },
  已歸檔: { color: "bg-green-100 text-green-700 border-green-200", label: "已歸檔" },
  退回補件: { color: "bg-orange-100 text-orange-700 border-orange-200", label: "退回補件" },
}

export function isValidOutcomeReportSubStatus(value: string): value is OutcomeReportSubStatus {
  return Object.keys(OUTCOME_REPORT_SUB_CONFIG).includes(value)
}

// 成果報告退回補件時，醫事司於容額成果報告審查頁填寫的意見。
// 與案件層級的「退件」不同：案件退件是醫策會／RRC／醫事司對容額申請本身的退回，
// 附審查會議紀錄全文；此處僅為醫事司對補充報告的單則意見，故直接內嵌呈現。
export const MOCK_OUTCOME_REPORT_RETURN = {
  reviewer: "醫事司",
  returnedDate: "115/03/06",
  comment:
    "所送容額成果報告之審查細節未涵蓋全部訓練醫院，計缺漏 3 家（詳如附件標示）。另請補附各訓練醫院之容額分配對照表，以利核對 RRC 審查結論。請補齊後重新送出。",
}
