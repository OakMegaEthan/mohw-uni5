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
// 訓練醫院於外加容額案件公告執行滿一年後，系統外發函給醫事司與醫策會（訓練醫院不進系統）。
// **系統自動算出滿一年的案件、直接列為待辦**，由醫事司或醫策會其中一方進系統，
// 把報告檔案與審查評論**一次登錄完成**（非兩段式：沒有先上傳、後審查的分離）。
// 無「不通過／退回」狀態；登錄後即為終點，作為該院日後再申請外加容額時的審查依據。
//
// 適用案件：分類原則「需成果報告」開啟、且已到繳交時點的外加容額案件。
//
// 執行期間與繳交期限（2026-08-17 確認，**與公告日期無關**）：
//   核定年度 8/1 ～ 次年 7/31 為執行期間，成果報告應於次年 8/31 前送交，
//   系統自**次年 7/31** 起列出應繳交的醫院。同年度案件不論何時公告，期間都相同。
//
// ⚠️ **mock 未實作上述日期計算**：現以「已公告 + 分類原則需報告」近似之。
// 要照正式邏輯做需改資料來源——目前自公告管理的待製作池反查，而歷史年度案件不進該池
// （見 announcement-cases 的 buildFromAdditionalQuota），故按年度篩會取不到應繳交的那一批。

/**
 * 狀態機只有兩態，且語意是**登錄進度**而非審查進度——因為上傳報告與填寫審查評論
 * 是同一個動作，不存在「已上傳但未審查」的中間態。
 */
export type OutcomeReportReviewStatus = "待上傳" | "已上傳"

export const AQ_OUTCOME_STATUS_CONFIG: Record<OutcomeReportReviewStatus, { color: string; label: string }> = {
  待上傳: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "待上傳" },
  已上傳: { color: "bg-green-100 text-green-700 border-green-200", label: "已上傳" },
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
  // 審查評論：醫事司或醫策會擇一單位填寫（非兩者皆填），故評論與填寫單位一對一。
  // 與 reports 同一個動作登錄，不會出現有檔案卻無評論的狀態。
  reviewerUnit: ReviewerUnit | null
  comment: string
  /** 完成登錄的日期（待上傳為 null） */
  uploadedDate: string | null
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
  // 核定 0 名＝審議後未同意外加，沒有容額可執行，自然無成果可報告，不列入應繳交
  .filter(({ app }) => app && (app.approvedQuota ?? 0) > 0)
  .filter(({ app }) => app && principleRequiresReport(app.classificationPrinciple))
  .map(({ c, app }, i) => {
    const a = app!
    // 公告檔案的首筆（entries[0]）；mock 以此代表該案已公告，正式邏輯改按年度，見檔頭
    const firstEntry = c.officialDoc!.entries[0]
    // mock 兩種狀態各半，讓畫面同時看得到待上傳與已上傳的案件
    const status: OutcomeReportReviewStatus = i % 2 === 0 ? "待上傳" : "已上傳"
    const uploaded = status === "已上傳"
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
      // 待上傳＝尚未登錄，故無檔案、無評論、無填寫單位（三者同一動作產生）
      reports: uploaded ? buildReports(a.hospitalName, a.specialty) : [],
      reviewerUnit: uploaded ? (i % 4 === 1 ? "JCT" : "MOHW") : null,
      comment: !uploaded
        ? ""
        : i % 4 === 1
          ? `經醫策會就訓練品質面向審視，${a.specialty}核心課程與師資配置達標，建議留存供後續申請參酌。`
          : `${a.hospitalName}${a.specialty}外加容額執行一年，訓練成效符合預期，成果報告內容完整，同意留存備查。`,
      uploadedDate: uploaded ? "116/03/15" : null,
    }
  })

export function getAqOutcomeReportCases(): AqOutcomeReportCase[] {
  return CASES
}

export function getAqOutcomeReportCase(applicationId: string): AqOutcomeReportCase | undefined {
  return CASES.find((c) => c.applicationId === applicationId)
}
