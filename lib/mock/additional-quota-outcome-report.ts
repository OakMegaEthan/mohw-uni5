import {
  getAdditionalQuotaApplication,
  principleRequiresReport,
} from "@/lib/mock/additional-quota"
import { getPendingCasesBySource, isCaseAnnounced } from "@/lib/mock/announcement-cases"

/** 民國日期字串：西元 ISO → 民國 yyy/mm/dd */
function isoToRoc(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${Number(m[1]) - 1911}/${m[2]}/${m[3]}` : iso
}

// 外加容額成果報告的 mock 來源（醫事司＋醫策會共用的獨立模組）。
//
// 訓練醫院於外加容額案件公告執行滿一年後，系統外發函給醫事司與醫策會。兩單位系統外
// 協調分工，實際由其中一方擇一負責審查、留下評論後儲存歸檔（非兩者皆填）。無
// 「不通過／退回」狀態；審查完成即歸檔，作為該院日後再申請外加容額時的審查依據。
//
// 適用案件：分類原則「需成果報告」開啟、且已公告的外加容額案件。
// （公告滿一年的時點於實際系統判斷；mock 以已公告 + 需報告近似之。）

export type OutcomeReportReviewStatus = "待審查" | "已歸檔"

export const AQ_OUTCOME_STATUS_CONFIG: Record<OutcomeReportReviewStatus, { color: string; label: string }> = {
  待審查: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "待審查" },
  已歸檔: { color: "bg-green-100 text-green-700 border-green-200", label: "已歸檔" },
}

export interface AqOutcomeReportFile {
  id: string
  name: string
  size: string
}

export interface AqOutcomeReportCase {
  // 對應的外加容額申請案 id
  applicationId: string
  hospitalName: string
  specialty: string
  classificationPrinciple: string
  announcementDate: string
  // 承自申請案，供查找與交叉對照（與外加容額管理的欄位一致）
  ministryDocNumber: string
  announcementNumber: string
  // 該案核定的外加容額數；成果報告即檢視這些容額的執行情形
  approvedQuota: number
  status: OutcomeReportReviewStatus
  // 訓練醫院提交的成果報告（系統外發函，於系統登錄）
  reports: AqOutcomeReportFile[]
  // 審查評論：醫事司或醫策會擇一單位填寫（非兩者皆填），故評論與填寫單位一對一
  reviewerUnit: ReviewerUnit | null
  comment: string
  archivedDate: string | null
}

export type ReviewerUnit = "MOHW" | "JCT"

export const REVIEWER_UNIT_LABELS: Record<ReviewerUnit, string> = {
  MOHW: "醫事司",
  JCT: "醫策會",
}

function buildReports(hospitalName: string, specialty: string): AqOutcomeReportFile[] {
  return [
    { id: `${hospitalName}-${specialty}-1`, name: `${hospitalName}_${specialty}_外加容額成果報告.pdf`, size: "3.4 MB" },
    { id: `${hospitalName}-${specialty}-2`, name: `${hospitalName}_${specialty}_訓練成效佐證資料.pdf`, size: "2.0 MB" },
  ]
}

// 反查公告管理：外加容額案件的公告檔案被引用發布過（isCaseAnnounced）＝已公告；
// 再交叉申請案的分類原則是否需報告。公告文號／日期取自案件的公告檔案（officialDoc），
// 不再讀申請案身上的公告欄位（全線一致，公告資料由公告管理獨佔）。
const CASES: AqOutcomeReportCase[] = getPendingCasesBySource("additional-quota")
  .filter(isCaseAnnounced)
  .map((c) => ({ c, app: getAdditionalQuotaApplication(c.id.replace("aq-case-", "")) }))
  .filter(({ app }) => app && principleRequiresReport(app.classificationPrinciple))
  .map(({ c, app }, i) => {
    const a = app!
    const firstEntry = c.officialDoc!.entries[0]
    const status: OutcomeReportReviewStatus = i % 2 === 0 ? "待審查" : "已歸檔"
    const archived = status === "已歸檔"
    return {
      applicationId: a.id,
      hospitalName: a.hospitalName,
      specialty: a.specialty,
      classificationPrinciple: a.classificationPrinciple,
      announcementDate: isoToRoc(firstEntry.date),
      ministryDocNumber: a.ministryDocNumber,
      announcementNumber: firstEntry.docNumber,
      approvedQuota: a.approvedQuota ?? 0,
      status,
      reports: buildReports(a.hospitalName, a.specialty),
      reviewerUnit: archived ? (i % 4 === 1 ? "JCT" : "MOHW") : null,
      comment: !archived
        ? ""
        : i % 4 === 1
          ? `經醫策會就訓練品質面向審視，${a.specialty}核心課程與師資配置達標，建議留存供後續申請參酌。`
          : `${a.hospitalName}${a.specialty}外加容額執行一年，訓練成效符合預期，成果報告內容完整，同意歸檔備查。`,
      archivedDate: archived ? "116/03/15" : null,
    }
  })

export function getAqOutcomeReportCases(): AqOutcomeReportCase[] {
  return CASES
}

export function getAqOutcomeReportCase(applicationId: string): AqOutcomeReportCase | undefined {
  return CASES.find((c) => c.applicationId === applicationId)
}
