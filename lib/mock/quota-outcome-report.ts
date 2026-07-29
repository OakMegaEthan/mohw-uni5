import { allSocieties } from "@/lib/data/societies"
import {
  OUTCOME_REPORT_SUB_CONFIG,
  type OutcomeReportSubStatus,
} from "@/lib/mock/quota-filing-stage"

// 容額成果報告審查（醫事司視角）的 mock 來源。
//
// 醫學會就各申請醫院的評估結果上傳容額成果報告（容額申請的前置依據，與 RRC 無關），
// 與審查階段時間解耦（待送件起可上傳），直接送醫事司。醫事司確認歸檔或退回補件，不經醫策會。
// 子狀態沿用 quota-filing-stage 的 OutcomeReportSubStatus，兩端一致。
// 醫事司列表只呈現已送出（待確認）與後續狀態，待上傳者尚未送達，不出現。

export { OUTCOME_REPORT_SUB_CONFIG, type OutcomeReportSubStatus }

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
