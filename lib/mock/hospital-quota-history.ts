import { allSocieties } from "@/lib/data/societies"

// 訓練醫院的縱貫紀錄：認定資格、逐年容額核定、容額微調。
// 供外加容額案件頁的「歷年紀錄」區塊使用，讓醫事司判斷本次該核定多少外加容額。
//
// ⚠️ **此檔是本區塊專用的展示資料，未與容額填報／容額微調模組連動。**
//
// 為什麼不連動：三條線對「醫院」的建模不同——容額填報與微調用 `code` ＋ 正式全稱
// （「國立臺灣大學醫學院附設醫院」「臺北榮民總醫院」），外加容額用自由字串的簡稱
// （「台大醫院」「台北榮民總醫院」），連「台」「臺」都不同，沒有共同鍵可串。
// 真正串起來要先建醫院主檔，那是接真後端時的事；本檔以確定性生成補上展示所需的縱貫資料。
//
// 因此**不要**把本檔的數字當成容額填報的真實資料，也不要反過來拿容額填報的數字校對本檔。
// 唯一必須自洽的是「同一個畫面上的數字」：本檔的基準核定 ＋ 微調淨額 ＋ 外加容額核定
// （後者取自 additional-quota 的真實 mock）必須等於案件頁顯示的已分配容額，
// 該加總由 additional-quota 於產生案件時套用（見該檔的 applyDerivedQuota）。

/** 由醫院＋專科導出的確定性種子，確保每次載入產生相同資料。 */
function seedOf(hospitalName: string, specialty: string): number {
  const s = `${hospitalName}|${specialty}`
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000
  return h
}

/** 民國年度字串（「115 年度」）取出年份數字。 */
function rocYear(year: string): number {
  return Number(year.slice(0, 3))
}

// ── 認定資格 ────────────────────────────────────────────────
// 認定是**多年期**的（一期 4 年、可展延），與逐年核定的容額節奏不同，
// 故在畫面上獨立成一塊摘要，不隨年度重複呈現。

export interface HospitalAccreditation {
  hospitalName: string
  specialty: string
  /** 資格效期：民國 {startYear}/08/01 ～ {endYear}/07/31 */
  startYear: number
  endYear: number
  /** 展延年數與展延後到期年；未展延為 null */
  extension: { years: number; untilYear: number } | null
  applicationType: "單獨申請" | "聯合申請－主訓機構"
  /** 聯合申請時的合作機構；單獨申請為空陣列 */
  partners: string[]
  /** 可收訓容額（RRC 會議決議的上限），一期內不隨年度變動 */
  trainingLimit: number
}

const PARTNER_POOL = ["署立桃園醫院", "恩主公醫院", "新光醫院", "國泰醫院", "亞東醫院"]

export function getAccreditation(hospitalName: string, specialty: string): HospitalAccreditation {
  const seed = seedOf(hospitalName, specialty)
  const startYear = 111 + (seed % 3)
  const joint = seed % 4 === 0

  return {
    hospitalName,
    specialty,
    startYear,
    endYear: startYear + 4,
    extension: seed % 3 === 0 ? { years: 4, untilYear: startYear + 8 } : null,
    applicationType: joint ? "聯合申請－主訓機構" : "單獨申請",
    partners: joint ? [PARTNER_POOL[seed % PARTNER_POOL.length]] : [],
    trainingLimit: 14 + (seed % 10),
  }
}

// ── 逐年容額核定 ────────────────────────────────────────────
// 容額由醫學會替各訓練醫院提出申請，經審查後核定。這是該院該專科**該年度的基準容額**，
// 其後的外加容額與容額微調都在這個基準上加減。

export interface AnnualQuotaApproval {
  year: string
  /** 提出申請的醫學會 */
  societyName: string
  /** 醫學會建議分配 */
  proposedQuota: number
  /** 審查後核定（本年度基準容額） */
  approvedQuota: number
  /** 認定結果 */
  result: "合格"
  /** 核定日期（民國 yyy/mm/dd） */
  approvedDate: string
}

function societyNameOf(specialty: string): string {
  return allSocieties.find((s) => s.specialty === specialty)?.name ?? `${specialty}醫學會`
}

export function getAnnualApproval(hospitalName: string, specialty: string, year: string): AnnualQuotaApproval {
  const seed = seedOf(hospitalName, specialty)
  const y = rocYear(year)
  // 逐年微幅變動，讓不同年度的核定數看得出差異
  const approved = 8 + (seed % 5) + ((y + seed) % 3) - 1
  return {
    year,
    societyName: societyNameOf(specialty),
    proposedQuota: approved + ((seed + y) % 2),
    approvedQuota: approved,
    result: "合格",
    approvedDate: `${y}/01/${String(10 + (seed % 15)).padStart(2, "0")}`,
  }
}

// ── 容額微調 ────────────────────────────────────────────────
// 醫學會在既有訓練醫院之間搬動容額，總容額守恆——對單一醫院而言可增可減。
// 每年度兩次，落在 4 月與 10 月，與外加容額（上半年、下半年各一次）錯開，
// 使案件頁的異動時間軸讀得出先後。

export interface QuotaAdjustmentRecord {
  year: string
  /** 同年度第 N 次微調 */
  round: number
  /** 核准日期（民國 yyy/mm/dd） */
  approvedDate: string
  societyName: string
  /**
   * 本次微調對該院容額的增減量。
   * **刻意不帶 before／after**——調整前後的容額要把外加容額一起混排才算得對，
   * 由 additional-quota 的 getQuotaSettlement 依日期統一計算，避免兩處各算各的。
   */
  delta: number
  /** 微調原因（選填，兒科來文有此欄、婦產科沒有） */
  reason: string
  reviewComment: string
}

const ADJUSTMENT_REASONS = [
  "配合他院訓練人力調整，本院調出部分容額",
  "本院新增專任主治醫師二名，教學量能提升",
  "因應區域訓練人力重新配置",
  "本院訓練計畫調整，容額移撥至合作機構",
]

/** 該院該專科在指定年度的微調紀錄（每年兩次），依日期由舊到新。 */
export function getAdjustmentRecords(
  hospitalName: string,
  specialty: string,
  year: string,
): QuotaAdjustmentRecord[] {
  const seed = seedOf(hospitalName, specialty)
  const y = rocYear(year)
  const society = societyNameOf(specialty)

  return [1, 2].map((round) => {
    // 增減量避免 0——沒有異動就不會有微調案
    const raw = ((seed + y * round) % 5) - 2
    const delta = raw === 0 ? (round % 2 === 0 ? -1 : 1) : raw

    return {
      year,
      round,
      approvedDate: `${y}/${round === 1 ? "04" : "10"}/${String(8 + ((seed + round) % 18)).padStart(2, "0")}`,
      societyName: society,
      delta,
      reason: ADJUSTMENT_REASONS[(seed + round) % ADJUSTMENT_REASONS.length],
      reviewComment: `經醫事司審查，${society}${year}第 ${round} 次容額微調符合總容額守恆，准予備查。`,
    }
  })
}
