import { allSocieties } from "@/lib/data/societies"

// 容額成果報告審查（醫事司視角）的 mock 來源。
//
// 醫學會就各申請醫院的評估結果上傳容額成果報告（容額申請的前置依據，與 RRC 無關），
// 與審查階段時間解耦（待送件起可上傳），直接送醫事司。醫事司確認歸檔或退回補件，不經醫策會。
// 醫事司列表只呈現已送出（待確認）與後續狀態，待上傳者尚未送達，不出現。
//
// 子狀態原本住在 quota-filing-stage.ts（容額填報階段語彙的單一來源），但兩條流程時間解耦、
// 生命週期各自獨立，型別綁在那裡會讓容額填報看起來像是成果報告的擁有者。已移來此處，
// 容額填報端改為單向 import 本檔。

// ── 容額成果報告子狀態 ──────────────────────────────────────────
// 「容額成果報告」＝醫學會對各申請醫院的評估結果（容額申請的前置依據，非執行成效、與 RRC 無關）。
// 與審查階段時間解耦，待送件起全程可上傳；直接送醫事司，不經醫策會，確認歸檔或退回補件。
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

export interface QuotaOutcomeReportFile {
  id: string
  name: string
  size: string
}

export interface QuotaOutcomeReportCase {
  societyId: string
  societyName: string
  status: Exclude<OutcomeReportSubStatus, "待上傳">
  submittedDate: string
  reports: QuotaOutcomeReportFile[]
  // 退回補件時的意見
  returnComment: string
  archivedDate: string | null
}

function buildReports(name: string): QuotaOutcomeReportFile[] {
  return [
    { id: `${name}-1`, name: `${name}_容額成果報告_審查細節.pdf`, size: "2.6 MB" },
    { id: `${name}-2`, name: `${name}_容額成果報告_附件_訓練醫院明細.xlsx`, size: "1.1 MB" },
  ]
}

// 取部分醫學會，分布於已送出／已歸檔／退回補件
const STATUSES: Array<Exclude<OutcomeReportSubStatus, "待上傳">> = [
  "已送出",
  "已送出",
  "退回補件",
  "已歸檔",
  "已送出",
  "已歸檔",
  "已送出",
  "退回補件",
  "已歸檔",
  "已送出",
]

const CASES: QuotaOutcomeReportCase[] = allSocieties.slice(0, STATUSES.length).map((society, i) => {
  const status = STATUSES[i]
  return {
    societyId: society.id,
    societyName: society.name,
    status,
    submittedDate: `115/0${1 + (i % 3)}/${10 + i}`,
    reports: buildReports(society.name),
    returnComment:
      status === "退回補件"
        ? `${society.name}所送容額成果報告之審查細節未涵蓋全部訓練醫院，請補齊後重新送出。`
        : "",
    archivedDate: status === "已歸檔" ? `115/0${2 + (i % 2)}/28` : null,
  }
})

export function getQuotaOutcomeReportCases(): QuotaOutcomeReportCase[] {
  return CASES
}

export function getQuotaOutcomeReportCase(societyId: string): QuotaOutcomeReportCase | undefined {
  return CASES.find((c) => c.societyId === societyId)
}
