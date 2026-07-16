// 外加容額申請的 mock 來源（登錄 → 審查 → 公告，全程醫事司單一角色）。
//
// 此流程全由醫事司操作：醫院以公文提出申請，醫事司登錄（故有來文日期／來文字號／
// 本部文號等公文欄位），內部會議後登錄審查結果，最後公告。訓練醫院不進入系統。
// 因此不拆填報／審查兩區，以單軸階段串起整個生命週期，於同一頁完成登錄、審查、檢視。
//
// 唯一鍵為 id（申請項目 uid）：同一醫院可在不同分科各自申請，故不以醫院為鍵。

export type AdditionalQuotaStage = "待審查" | "待公告" | "已公告"

export const ADDITIONAL_QUOTA_STAGE_CONFIG: Record<AdditionalQuotaStage, { color: string; label: string }> = {
  待審查: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "待審查" },
  待公告: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "待公告" },
  已公告: { color: "bg-green-100 text-green-700 border-green-200", label: "已公告" },
}

export interface QuotaAttachment {
  id: string
  name: string
  size: string
}

export interface CurrentYearQuota {
  specialty: string
  approved: number
  limit: number
  validFrom: string
  validTo: string
  // 核定數字的版本依據：讓使用者確認參照的是否為最新公告
  latestAnnouncementDate: string
  latestAnnouncementNumber: string
}

export interface PreviousPeriod {
  year: string
  quota: number
  requestReason: string
  requestDescription: string
  report: QuotaAttachment
  reviewComment: string
}

export interface AdditionalQuotaApplication {
  id: string
  hospitalName: string
  specialty: string // 申請分科
  incomingDate: string // 來文日期
  incomingDocNumber: string // 來文字號
  ministryDocNumber: string // 本部文號
  classificationPrinciple: string // 分類原則（自由字串，選項可維護）
  requestedQuota: number
  requestReason: string
  requestDescription: string
  attachments: QuotaAttachment[]
  currentYearQuota: CurrentYearQuota
  previousPeriod: PreviousPeriod
  stage: AdditionalQuotaStage
  // 審查結果（會議後登錄；待審查階段尚無）
  approvedQuota: number | null
  reviewComment: string
  reviewMinutes: QuotaAttachment[]
  // 公告（已公告階段才有）
  announcementDate: string | null
  announcementNumber: string | null
}

// 分類原則的預設選項。字串存放，使用者可自行增刪；以 module store 維持 session 期間的變更。
const DEFAULT_CLASSIFICATION_PRINCIPLES = ["支援偏鄉", "健保 IDS 計畫", "醫中支援計畫"]
let classificationPrinciples = [...DEFAULT_CLASSIFICATION_PRINCIPLES]

export function getClassificationPrinciples(): string[] {
  return classificationPrinciples
}
export function setClassificationPrinciples(next: string[]): void {
  classificationPrinciples = next
}

const HOSPITALS = [
  "台大醫院",
  "台北榮民總醫院",
  "三軍總醫院",
  "馬偕紀念醫院",
  "林口長庚醫院",
  "中國醫藥大學附醫",
  "台中榮民總醫院",
  "成大醫院",
  "高雄長庚醫院",
  "高雄醫學大學附醫",
]

// 常見申請外加容額的分科（取自 25 專科醫學會之科別）
const SPECIALTIES = ["內科", "外科", "急診醫學科", "兒科", "麻醉科", "骨科", "婦產科", "重症醫學科"]

function buildPreviousPeriod(specialty: string, quota: number): PreviousPeriod {
  return {
    year: "114 年度",
    quota,
    requestReason: `因應${specialty}夜間業務量增加，申請外加容額以確保值班人力充足。`,
    requestDescription: `本院${specialty} 114 年度業務量較前一年成長，為維持醫療與訓練品質，申請外加容額 ${quota} 名。`,
    report: { id: "pr1", name: "114年度外加容額成果報告書.pdf", size: "4.2 MB" },
    reviewComment: `該院於 114 年度外加容額執行成效良好，訓練計畫完整，教學品質優良。`,
  }
}

// 以確定性的方式生成一批擬真案件，跨醫院、分科、階段與分類原則分布，
// 讓列表的表格、篩選與排序有足夠資料展示
function generateApplications(): AdditionalQuotaApplication[] {
  const principles = DEFAULT_CLASSIFICATION_PRINCIPLES
  const stages: AdditionalQuotaStage[] = ["待審查", "待公告", "已公告"]
  const apps: AdditionalQuotaApplication[] = []
  let seq = 0

  for (let h = 0; h < HOSPITALS.length; h++) {
    // 每家醫院在 2~3 個分科提出申請，模擬同院跨科各自申請
    const specialtyCount = 2 + (h % 2)
    for (let s = 0; s < specialtyCount; s++) {
      seq++
      const hospitalName = HOSPITALS[h]
      const specialty = SPECIALTIES[(h + s) % SPECIALTIES.length]
      const stage = stages[seq % 3]
      const requested = 2 + (seq % 4)
      const approvedBase = 8 + (seq % 6)
      const limit = approvedBase + 6 + (seq % 4)
      const principle = principles[seq % principles.length]
      const month = 1 + (seq % 3)
      const day = 5 + (seq % 20)
      const mm = String(month).padStart(2, "0")
      const dd = String(day).padStart(2, "0")
      const reviewed = stage !== "待審查"
      const announced = stage === "已公告"

      apps.push({
        id: `aq-${String(seq).padStart(3, "0")}`,
        hospitalName,
        specialty,
        incomingDate: `115/${mm}/${dd}`,
        incomingDocNumber: `${hospitalName.slice(0, 2)}醫字第115${String(1000 + seq)}號`,
        ministryDocNumber: reviewed ? `衛部醫字第115${String(1660000 + seq)}號` : "",
        classificationPrinciple: principle,
        requestedQuota: requested,
        requestReason: `因應本院${specialty}業務擴展，申請外加容額以充實訓練人力。`,
        requestDescription: `本院${specialty}近三年業務量持續成長，現有訓練容額已不敷需求。本科師資與教學資源充足，擬申請外加容額 ${requested} 名。`,
        attachments: [
          { id: `${seq}-1`, name: `${specialty}業務量統計報告.pdf`, size: "2.3 MB" },
          { id: `${seq}-2`, name: "師資名單與資格證明.pdf", size: "1.8 MB" },
        ],
        currentYearQuota: {
          specialty,
          approved: approvedBase,
          limit,
          validFrom: "2025-08-01",
          validTo: "2026-07-31",
          latestAnnouncementDate: "115/01/03",
          latestAnnouncementNumber: `衛部醫字第115${String(1650000 + h)}號`,
        },
        previousPeriod: buildPreviousPeriod(specialty, 2 + (seq % 3)),
        stage,
        approvedQuota: reviewed ? Math.max(1, requested - (seq % 2)) : null,
        reviewComment: reviewed
          ? `經 115 年度外加容額審查會議審議，${hospitalName}${specialty}訓練條件符合規定，核定外加容額如上。`
          : "",
        reviewMinutes: reviewed
          ? [{ id: `${seq}-m1`, name: "115年度外加容額審查會議紀錄.pdf", size: "1.5 MB" }]
          : [],
        announcementDate: announced ? `115/0${month}/28` : null,
        announcementNumber: announced ? `衛部醫字第115${String(1670000 + seq)}號` : null,
      })
    }
  }
  return apps
}

export const ADDITIONAL_QUOTA_APPLICATIONS: AdditionalQuotaApplication[] = generateApplications()

export function getAdditionalQuotaApplications(): AdditionalQuotaApplication[] {
  return ADDITIONAL_QUOTA_APPLICATIONS
}

export function getAdditionalQuotaApplication(id: string): AdditionalQuotaApplication | undefined {
  return ADDITIONAL_QUOTA_APPLICATIONS.find((a) => a.id === id)
}

/** 申請分科的可選清單（去重、依 25 專科醫學會科別）。 */
export function getSpecialtyOptions(): string[] {
  return [...new Set(SPECIALTIES)]
}

/** 待審查階段可編輯申請內容；待公告與已公告僅供檢視。 */
export function isAdditionalQuotaEditable(stage: AdditionalQuotaStage): boolean {
  return stage === "待審查"
}
