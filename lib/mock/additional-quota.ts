import {
  getAccreditation,
  getAdjustmentRecords,
  getAnnualApproval,
  type AnnualQuotaApproval,
  type QuotaAdjustmentRecord,
} from "@/lib/mock/hospital-quota-history"

// 外加容額申請的 mock 來源（登錄 → 審查 → 公告，全程醫事司單一角色）。
//
// 此流程全由醫事司操作：醫院以公文提出申請，醫事司登錄（故有來文日期／來文字號／
// 本部文號等公文欄位），內部會議後登錄審查結果，最後公告。訓練醫院不進入系統。
// 因此不拆填報／審查兩區，以單軸階段串起整個生命週期，於同一頁完成登錄、審查、檢視。
//
// 唯一鍵為 id（申請項目 uid）：同一醫院可在不同分科各自申請，故不以醫院為鍵。

// 全線一致（見 docs/business-logic.md「公告管理」）：外加容額案件審查終點為「審查通過」，
// 由醫事司登錄審查結果那一刻達成。公告本身移至公告管理辦理，故案件階段不含待公告／已公告；
// 「是否已公告」改由 announcementDate 是否有值判斷（見 isAdditionalQuotaAnnounced）。
//
// **沒有「審查未通過」狀態**：審議後不同意外加，表達方式是核定容額 0 名（approvedQuota === 0），
// 不另設狀態。案件頁的歷年紀錄據此推導「同意外加／未同意外加」，不存成獨立欄位。
export type AdditionalQuotaStage = "待審查" | "審查通過"

export const ADDITIONAL_QUOTA_STAGE_CONFIG: Record<AdditionalQuotaStage, { color: string; label: string }> = {
  待審查: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "待審查" },
  審查通過: { color: "bg-green-100 text-green-700 border-green-200", label: "審查通過" },
}

/**
 * 申請年度，由新到舊。mock 以 115 年度為當年度，114 年度為系統上線前的既有歷史紀錄
 * （其公告早已辦畢，故不進公告管理的待製作池，見 announcement-cases）。
 */
export const CURRENT_QUOTA_YEAR = "115 年度"
export const QUOTA_YEARS = [CURRENT_QUOTA_YEAR, "114 年度"] as const

export interface QuotaAttachment {
  id: string
  name: string
  size: string
}

export interface CurrentYearQuota {
  specialty: string
  /**
   * 當年度已分配容額，＝**本案來文當下**該院該專科的容額
   * （年度基準核定 ＋ 在此之前已生效的外加容額與容額微調；本案自己的核定不計入）。
   * 由 getQuotaSettlement 推導、applyDerivedQuota 寫入，非靜態值。
   */
  approved: number
  /**
   * 最大可收訓容額（RRC 會議決議的上限）。取自認定資格，**一期內固定**，
   * 故同院同專科同年度的每件案子都相同。由 applyDerivedQuota 寫入。
   */
  limit: number
  validFrom: string
  validTo: string
  // 核定數字的版本依據：讓使用者確認參照的是否為最新公告
  latestAnnouncementDate: string
  latestAnnouncementNumber: string
}

export interface AdditionalQuotaApplication {
  id: string
  /**
   * 申請年度（如「115 年度」）。外加容額全年隨時可再申請，
   * 故**同院同專科同年度可能不只一件**，不可用「年度＋醫院＋專科」當唯一鍵。
   */
  year: string
  hospitalName: string
  specialty: string // 申請專科
  incomingDate: string // 來文日期
  incomingDocNumber: string // 來文字號
  ministryDocNumber: string // 本部文號
  classificationPrinciple: string // 分類原則（自由字串，選項可維護）
  /** 申請人數（申請的外加容額名額數） */
  requestedQuota: number
  /**
   * 申請緣由。原本拆為「申請緣由」＋「申請說明」兩欄，但兩者同為自由文字、
   * 內容重疊且區分依據講不出來，2026-08-14 合併為單一欄位。
   */
  requestReason: string
  attachments: QuotaAttachment[]
  currentYearQuota: CurrentYearQuota
  stage: AdditionalQuotaStage
  // 審查結果（會議後登錄；待審查階段尚無）
  approvedQuota: number | null
  reviewComment: string
  reviewMinutes: QuotaAttachment[]
  // 全線一致：外加容額案件到「審查通過」為終點，公告（含文號）由公告管理獨佔，
  // 案件身上不帶公告欄位。是否已公告改由公告管理反查（見 announcement-cases.isCaseAnnounced）。
}

// 分類原則的可維護選項。名稱以字串存放（申請案存名稱），另帶「需成果報告」開關：
// 該案公告滿一年後是否需提交外加容額成果報告，跟著分類原則走而非硬比對名稱。
export interface ClassificationPrinciple {
  name: string
  requiresOutcomeReport: boolean
}

const DEFAULT_CLASSIFICATION_PRINCIPLES: ClassificationPrinciple[] = [
  { name: "支援偏鄉政策", requiresOutcomeReport: true },
  { name: "醫中支援計畫", requiresOutcomeReport: false },
  { name: "重點科別公費醫師制度計畫名額", requiresOutcomeReport: false },
  { name: "地方養成公費醫師計畫", requiresOutcomeReport: false },
  { name: "國防部戰傷相關政策", requiresOutcomeReport: false },
]
let classificationPrinciples: ClassificationPrinciple[] = DEFAULT_CLASSIFICATION_PRINCIPLES.map((p) => ({ ...p }))

export function getClassificationPrinciples(): ClassificationPrinciple[] {
  return classificationPrinciples
}
export function setClassificationPrinciples(next: ClassificationPrinciple[]): void {
  classificationPrinciples = next
}
/** 下拉／篩選用的名稱清單。 */
export function getClassificationPrincipleNames(): string[] {
  return classificationPrinciples.map((p) => p.name)
}
/** 某分類原則（依名稱）是否需提交成果報告；找不到時視為否。 */
export function principleRequiresReport(name: string): boolean {
  return classificationPrinciples.find((p) => p.name === name)?.requiresOutcomeReport ?? false
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

interface BuildArgs {
  id: string
  year: string
  seq: number
  hospitalIndex: number
  hospitalName: string
  specialty: string
  stage: AdditionalQuotaStage
  requested: number
  /** 審查通過時的核定容額；0 代表審議後未同意外加（狀態機不另設「未通過」，見檔頭） */
  approvedQuota: number | null
  /** 來文月份的起點：第一次申請落在上半年、第二次落在下半年，使異動時間軸讀得出先後 */
  monthBase: number
}

function buildApplication({
  id,
  year,
  seq,
  hospitalIndex,
  hospitalName,
  specialty,
  stage,
  requested,
  approvedQuota,
  monthBase,
}: BuildArgs): AdditionalQuotaApplication {
  const roc = year.slice(0, 3)
  // 該年度的容額效期：民國 115 年度 → 西元 2025-08-01 ~ 2026-07-31
  const ad = Number(roc) + 1911
  const reviewed = stage === "審查通過"
  const mm = String(monthBase + (seq % 3)).padStart(2, "0")
  const dd = String(5 + (seq % 20)).padStart(2, "0")

  return {
    id,
    year,
    hospitalName,
    specialty,
    incomingDate: `${roc}/${mm}/${dd}`,
    incomingDocNumber: `${hospitalName.slice(0, 2)}醫字第${roc}${String(1000 + seq)}號`,
    ministryDocNumber: reviewed ? `衛部醫字第${roc}${String(1660000 + seq)}號` : "",
    // 依醫院索引指派分類原則，與階段（依 seq）解耦，
    // 使部分已公告案件落在「支援偏鄉政策」（需成果報告），供外加容額成果報告模組取用
    classificationPrinciple: DEFAULT_CLASSIFICATION_PRINCIPLES[hospitalIndex % DEFAULT_CLASSIFICATION_PRINCIPLES.length].name,
    requestedQuota: requested,
    requestReason: `因應本院${specialty}業務擴展，現有訓練容額已不敷需求。本科近三年業務量持續成長，師資與教學資源充足，擬申請外加容額 ${requested} 名。`,
    attachments: [
      { id: `${id}-1`, name: `${specialty}業務量統計報告.pdf`, size: "2.3 MB" },
      { id: `${id}-2`, name: "師資名單與資格證明.pdf", size: "1.8 MB" },
    ],
    currentYearQuota: {
      // approved／limit 於 applyDerivedQuota 由年度結算覆寫，此處僅為佔位
      specialty,
      approved: 0,
      limit: 0,
      validFrom: `${ad - 1}-08-01`,
      validTo: `${ad}-07-31`,
      latestAnnouncementDate: `${roc}/01/03`,
      latestAnnouncementNumber: `衛部醫字第${roc}${String(1650000 + hospitalIndex)}號`,
    },
    stage,
    approvedQuota,
    reviewComment: !reviewed
      ? ""
      : approvedQuota === 0
        ? `經 ${roc} 年度外加容額審查會議審議，${hospitalName}${specialty}現有訓練容額尚可支應，本次申請未同意外加。`
        : `經 ${roc} 年度外加容額審查會議審議，${hospitalName}${specialty}訓練條件符合規定，核定外加容額如上。`,
    reviewMinutes: reviewed
      ? [{ id: `${id}-m1`, name: `${roc}年度外加容額審查會議紀錄.pdf`, size: "1.5 MB" }]
      : [],
  }
}

// 以確定性的方式生成一批擬真案件，跨年度、醫院、分科、階段與分類原則分布，
// 讓列表的表格、篩選與排序有足夠資料展示
function generateApplications(): AdditionalQuotaApplication[] {
  const apps: AdditionalQuotaApplication[] = []

  for (const year of QUOTA_YEARS) {
    const isCurrent = year === CURRENT_QUOTA_YEAR
    // 當年度沿用既有 id 格式，避免公告管理／成果報告等下游 mock 的既有種子資料位移
    const idPrefix = isCurrent ? "aq" : `aq-${year.slice(0, 3)}`
    let seq = 0

    for (let h = 0; h < HOSPITALS.length; h++) {
      // 每家醫院在 2~3 個分科提出申請，模擬同院跨科各自申請
      const specialtyCount = 2 + (h % 2)
      for (let s = 0; s < specialtyCount; s++) {
        seq++
        const requested = 2 + (seq % 4)
        // 當年度約 1/3 待審查、2/3 審查通過；歷史年度皆已審結
        const stage: AdditionalQuotaStage = isCurrent && seq % 3 === 0 ? "待審查" : "審查通過"
        // 歷史年度每 7 件有 1 件核定 0 名（審議後未同意外加），供案件頁的歷年紀錄呈現
        const approvedQuota =
          stage !== "審查通過"
            ? null
            : isCurrent
              ? Math.max(1, requested - (seq % 2))
              : seq % 7 === 0
                ? 0
                : Math.max(1, requested - (seq % 3))

        apps.push(
          buildApplication({
            id: `${idPrefix}-${String(seq).padStart(3, "0")}`,
            year,
            seq,
            hospitalIndex: h,
            hospitalName: HOSPITALS[h],
            specialty: SPECIALTIES[(h + s) % SPECIALTIES.length],
            stage,
            requested,
            approvedQuota,
            monthBase: 1,
          }),
        )
      }
    }

    // 第二次申請：外加容額全年隨時可再申請，同院同專科同年度可能不只一件。
    // 每家醫院的第一個專科在每個年度都再申請一次（落在下半年），
    // 讓案件頁的「容額調整紀錄」每個年度都有兩筆外加容額異動可展示。
    for (let h = 0; h < HOSPITALS.length; h++) {
      seq++
      const requested = 1 + (h % 3)
      const stage: AdditionalQuotaStage = isCurrent && h % 4 === 0 ? "待審查" : "審查通過"
      const approvedQuota =
        stage !== "審查通過" ? null : h % 5 === 0 ? 0 : Math.max(1, requested - (h % 2))

      apps.push(
        buildApplication({
          id: `${idPrefix}-r2-${String(h + 1).padStart(3, "0")}`,
          year,
          seq,
          hospitalIndex: h,
          hospitalName: HOSPITALS[h],
          specialty: SPECIALTIES[h % SPECIALTIES.length],
          stage,
          requested,
          approvedQuota,
          monthBase: 7,
        }),
      )
    }
  }

  return apps
}

export const ADDITIONAL_QUOTA_APPLICATIONS: AdditionalQuotaApplication[] = generateApplications()

// ── 年度容額結算 ────────────────────────────────────────────
// 該院該專科在某年度的容額，是「基準核定 → 歷次外加與微調」逐筆疊出來的。
// 三處畫面都吃這個結果，故只算一次：
//   1. 案件頁審查段的「已分配容額」＝本案來文當下的容額（本案自己的異動尚未計入）
//   2. 歷年紀錄「容額調整紀錄」分頁的時間軸與結算列
//   3. 列表的已分配容額欄
// 早期這些是各自寫死的靜態值，會在同一頁上互相矛盾。

export interface QuotaTimelineEntry {
  kind: "外加容額" | "容額微調"
  /** 民國 yyy/mm/dd */
  date: string
  before: number
  after: number
  /** 尚未審結者為 0（還沒真的改變容額） */
  delta: number
  /** kind === "外加容額" 時有值 */
  application?: AdditionalQuotaApplication
  /** kind === "容額微調" 時有值 */
  adjustment?: QuotaAdjustmentRecord
}

export interface QuotaYearSettlement {
  year: string
  /** 該年度由醫學會申請、審查後核定的基準容額 */
  base: AnnualQuotaApproval
  /** 依日期由舊到新 */
  entries: QuotaTimelineEntry[]
  /** 結算後的目前容額 */
  finalQuota: number
}

/**
 * 該院該專科在指定年度的容額結算：基準核定 ＋ 歷次外加容額與容額微調，依日期混排。
 *
 * 外加容額取自本模組的真實 mock；基準核定與微調取自 hospital-quota-history
 * （該檔為本區塊專用的展示資料，未與容額填報／微調模組連動，原因見該檔檔頭）。
 */
export function getQuotaSettlement(
  hospitalName: string,
  specialty: string,
  year: string,
): QuotaYearSettlement {
  const base = getAnnualApproval(hospitalName, specialty, year)

  const additional = ADDITIONAL_QUOTA_APPLICATIONS.filter(
    (a) => a.hospitalName === hospitalName && a.specialty === specialty && a.year === year,
  ).map((a) => ({
    kind: "外加容額" as const,
    date: a.incomingDate,
    // 待審查者尚未改變容額；審查通過核定 0 名（未同意外加）亦為 0
    delta: a.stage === "審查通過" ? a.approvedQuota ?? 0 : 0,
    application: a,
  }))

  const adjustments = getAdjustmentRecords(hospitalName, specialty, year).map((r) => ({
    kind: "容額微調" as const,
    date: r.approvedDate,
    delta: r.delta,
    adjustment: r,
  }))

  let running = base.approvedQuota
  const entries: QuotaTimelineEntry[] = [...additional, ...adjustments]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => {
      const before = running
      // 容額不會是負數
      const after = Math.max(0, before + e.delta)
      running = after
      return { ...e, before, after }
    })

  return { year, base, entries, finalQuota: running }
}

/**
 * 把結算結果寫回各案件的 currentYearQuota，取代原本寫死的靜態值。
 * - 已分配容額＝**本案來文當下**的容額（本案自己的核定尚未計入，否則審查時會重複計算）
 * - 可收訓容額＝認定資格的上限，一期內固定；原本每件案子各算一個值，同院同科同年度會不一致
 */
function applyDerivedQuota(apps: AdditionalQuotaApplication[]): void {
  const seen = new Set<string>()

  for (const app of apps) {
    const key = `${app.hospitalName}|${app.specialty}|${app.year}`
    if (seen.has(key)) continue
    seen.add(key)

    const { trainingLimit } = getAccreditation(app.hospitalName, app.specialty)
    const { entries } = getQuotaSettlement(app.hospitalName, app.specialty, app.year)

    for (const entry of entries) {
      if (!entry.application) continue
      entry.application.currentYearQuota.approved = entry.before
      entry.application.currentYearQuota.limit = trainingLimit
    }
  }
}

applyDerivedQuota(ADDITIONAL_QUOTA_APPLICATIONS)

export function getAdditionalQuotaApplications(): AdditionalQuotaApplication[] {
  return ADDITIONAL_QUOTA_APPLICATIONS
}

export function getAdditionalQuotaApplication(id: string): AdditionalQuotaApplication | undefined {
  return ADDITIONAL_QUOTA_APPLICATIONS.find((a) => a.id === id)
}

/** 申請專科的可選清單（去重、依 25 專科醫學會科別）。 */
export function getSpecialtyOptions(): string[] {
  return [...new Set(SPECIALTIES)]
}

/** 年度篩選的可選清單（由新到舊）。 */
export function getYearOptions(): string[] {
  return [...QUOTA_YEARS]
}

export interface YearlyApplicationHistory {
  year: string
  applications: AdditionalQuotaApplication[]
}

/**
 * 同院同專科的申請紀錄，依年度由新到舊分組（排除本案）。
 *
 * 用途：輔助醫事司判斷本次該核定多少外加容額——看該院這一科歷年申請幾名、
 * 是否同意外加、核定幾名、當時的申請緣由與審查意見。
 *
 * **不含成果報告**：報告是案件公告執行滿一年後才提交，本年度作業時前一年度的
 * 報告尚未產生；成果報告另在獨立模組（見 docs/business-logic.md）。
 *
 * 每個年度都會回傳（即使沒有紀錄），讓「該年度無申請紀錄」本身也是一項資訊。
 */
export function getApplicationHistory(
  hospitalName: string,
  specialty: string,
  excludeId: string,
): YearlyApplicationHistory[] {
  return QUOTA_YEARS.map((year) => ({
    year,
    applications: ADDITIONAL_QUOTA_APPLICATIONS.filter(
      (a) =>
        a.year === year && a.hospitalName === hospitalName && a.specialty === specialty && a.id !== excludeId,
    ).sort((a, b) => a.incomingDate.localeCompare(b.incomingDate)),
  }))
}

/** 待審查階段可編輯申請內容；審查通過後僅供檢視。 */
export function isAdditionalQuotaEditable(stage: AdditionalQuotaStage): boolean {
  return stage === "待審查"
}

