// 容額填報案件的階段模型（醫學會填報視角）。
//
// 完整生命週期（見 docs/business-logic.md「公告管理」節）：
//   待送件 → 醫策會初審 → 分組會議 → RRC大會 → 醫事司審查 → 審查通過
//
// 「審查通過」是審查鏈的終點、醫事司點擊，也是審查與公告的交棒點：此後案件離開審查作業區，
// 由公告管理接手（其公告端狀態 待公告 → 公告編製中 → 已公告 掛在公告模組，不在這條鏈上）。
// 「醫事司審查」為 RRC 後、審查通過前，醫事司做非容額決策的最後把關（錯字、法規引用等），可退件。
//
// 退件為一等狀態，可自任一審查階段退回醫學會。退件記錄 returnedFrom（退回自哪個階段），
// 醫學會補正重送後，案件回到該階段續審，不重走整條鏈（resumeStage 規則）。
//
// 從醫學會（填報）視角，審查各子階段皆為唯讀「審查中」；可編輯僅在待送件與退件。

export type QuotaFilingStage =
  | "待送件"
  | "醫策會初審"
  | "分組會議"
  | "RRC大會"
  | "醫事司審查"
  | "審查通過"

// 有序階段鏈，供進度指示器使用
export const QUOTA_FILING_STAGES: QuotaFilingStage[] = [
  "待送件",
  "醫策會初審",
  "分組會議",
  "RRC大會",
  "醫事司審查",
  "審查通過",
]

// 各審查階段對應的負責單位（退件時顯示「退回自 X」用）
export const QUOTA_FILING_STAGE_UNIT: Record<QuotaFilingStage, string> = {
  待送件: "醫學會",
  醫策會初審: "醫策會",
  分組會議: "醫策會",
  RRC大會: "RRC 大會",
  醫事司審查: "醫事司",
  審查通過: "醫事司",
}

/** 醫學會可編輯申請內容的階段：待送件，或已退件補正中。 */
export function isQuotaFilingEditable(stage: QuotaFilingStage, returned: boolean): boolean {
  return stage === "待送件" || returned
}

export function isValidQuotaFilingStage(value: string): value is QuotaFilingStage {
  return (QUOTA_FILING_STAGES as string[]).includes(value)
}
