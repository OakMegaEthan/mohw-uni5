import { allSocieties } from "@/lib/data/societies"
import {
  QUOTA_FILING_STAGES,
  QUOTA_FILING_STAGE_UNIT,
  type QuotaFilingStage,
} from "@/lib/mock/quota-filing-stage"

// 容額填報審查（醫策會／RRC／醫事司視角）的 mock 來源。
//
// 階段語彙與容額填報端共用 quota-filing-stage.ts，避免兩邊各自定義而再度走鐘：
// 填報端的完整鏈為 待送件 → 醫策會初審 → 分組會議 → RRC大會 → 待公告 → 已公告，
// 「待送件」是醫學會自己的階段、審查端無事可做，故審查列表只呈現其後的五個階段。
//
// 醫學會固定 25 個（allSocieties），未送件者沿用填報審查頁的歸位方式：
// 留在第一個審查階段的分頁內、列淡灰、標「尚未填寫」，不可檢視、不列入批次推進。
//
// 退件為一等狀態（見 docs/business-logic.md「退件規則」）：退件案件自階段分頁移出，
// 改列「退件補正中」，並記錄 returnedFrom；醫學會補正重送後回該階段續審，不重走整條鏈。

/** 審查端可見的階段：填報鏈去掉醫學會自己的「待送件」 */
export type QuotaReviewStage = Exclude<QuotaFilingStage, "待送件">

export const quotaReviewStages: QuotaReviewStage[] = QUOTA_FILING_STAGES.filter(
  (s): s is QuotaReviewStage => s !== "待送件",
)

export const quotaReviewStageConfig: Record<QuotaReviewStage, { color: string; label: string }> = {
  醫策會初審: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "醫策會初審" },
  分組會議: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "分組會議" },
  RRC大會: { color: "bg-purple-100 text-purple-800 border-purple-200", label: "RRC大會" },
  待公告: { color: "bg-amber-100 text-amber-800 border-amber-200", label: "待公告" },
  已公告: { color: "bg-green-100 text-green-800 border-green-200", label: "已公告" },
}

/** 退件補正中不是階段，而是與階段並行的一等狀態，於列表另立一個分頁 */
export const RETURNED_BUCKET = {
  value: "returned" as const,
  label: "退件補正中",
  color: "bg-orange-100 text-orange-800 border-orange-200",
}

export type QuotaReviewResult = "pending" | "approved"

export interface HospitalQuotaReviewSociety {
  id: string
  name: string
  year: string
  /** 醫學會是否已送出容額填報。false = 尚未填寫 */
  submitted: boolean
  submittedDate: string | null
  /** 所在審查階段；未送件者掛在第一個審查階段（沿用填報審查頁的歸位方式） */
  stage: QuotaReviewStage
  /** 有值＝退件補正中，值為退回自哪個階段（重送後回該階段續審） */
  returnedFrom: QuotaReviewStage | null
  reviewResult: QuotaReviewResult
}

// 25 個醫學會的階段分布。索引對應 allSocieties 順序。
// null = 尚未填寫；returned = 退件補正中（退回自該階段）。
type StagePlan =
  | { kind: "not-filed" }
  | { kind: "returned"; from: QuotaReviewStage }
  | { kind: "in-review"; stage: QuotaReviewStage; result: QuotaReviewResult }

const STAGE_PLAN: StagePlan[] = [
  { kind: "in-review", stage: "醫策會初審", result: "pending" }, // 1 台灣家庭醫學醫學會（完整版型）
  { kind: "in-review", stage: "分組會議", result: "approved" }, // 2 台灣內科醫學會（內科版型）
  { kind: "returned", from: "醫策會初審" }, // 3
  { kind: "in-review", stage: "醫策會初審", result: "approved" }, // 4
  { kind: "in-review", stage: "醫策會初審", result: "pending" }, // 5
  { kind: "not-filed" }, // 6
  { kind: "in-review", stage: "分組會議", result: "pending" }, // 7
  { kind: "in-review", stage: "分組會議", result: "approved" }, // 8
  { kind: "in-review", stage: "分組會議", result: "approved" }, // 9
  { kind: "in-review", stage: "RRC大會", result: "approved" }, // 10
  { kind: "in-review", stage: "RRC大會", result: "pending" }, // 11
  { kind: "returned", from: "RRC大會" }, // 12
  { kind: "not-filed" }, // 13
  { kind: "in-review", stage: "RRC大會", result: "approved" }, // 14
  { kind: "in-review", stage: "待公告", result: "approved" }, // 15
  { kind: "in-review", stage: "待公告", result: "approved" }, // 16
  { kind: "in-review", stage: "已公告", result: "approved" }, // 17
  { kind: "in-review", stage: "已公告", result: "approved" }, // 18
  { kind: "returned", from: "待公告" }, // 19
  { kind: "not-filed" }, // 20
  { kind: "in-review", stage: "醫策會初審", result: "pending" }, // 21
  { kind: "in-review", stage: "分組會議", result: "pending" }, // 22
  { kind: "in-review", stage: "RRC大會", result: "approved" }, // 23
  { kind: "in-review", stage: "待公告", result: "approved" }, // 24
  { kind: "not-filed" }, // 25
]

export const mockHospitalQuotaSocieties: HospitalQuotaReviewSociety[] = allSocieties.map(
  (society, index) => {
    const plan = STAGE_PLAN[index] ?? { kind: "not-filed" as const }
    const submittedDate = `115/01/${String(5 + (index % 20)).padStart(2, "0")}`

    if (plan.kind === "not-filed") {
      return {
        id: society.id,
        name: society.name,
        year: "115 年度",
        submitted: false,
        submittedDate: null,
        stage: quotaReviewStages[0],
        returnedFrom: null,
        reviewResult: "pending",
      }
    }

    if (plan.kind === "returned") {
      return {
        id: society.id,
        name: society.name,
        year: "115 年度",
        submitted: true,
        submittedDate,
        stage: plan.from,
        returnedFrom: plan.from,
        reviewResult: "pending",
      }
    }

    return {
      id: society.id,
      name: society.name,
      year: "115 年度",
      submitted: true,
      submittedDate,
      stage: plan.stage,
      returnedFrom: null,
      reviewResult: plan.result,
    }
  },
)

// ── 明細資料 ────────────────────────────────────────────────
// 欄位模型與容額填報端（components/filing/quota-filing-view.tsx）對齊：
//   類別＝applicationType（單一／主訓／合作）＋ mergedHospitalCodes（合併認定）
//   資格效期＝民國年度區間 expiryStartYear/08/01 - expiryEndYear/07/31
// 舊模型的 expiry（西元字串）與 extension（延長效期）已移除，填報端沒有這兩欄。

export interface HospitalQuotaRow {
  id: number | string
  code: string
  name: string
  county?: string
  district?: string
  /** 民國年度，資格效期起：{expiryStartYear}/08/01 */
  expiryStartYear: string
  /** 民國年度，資格效期迄：{expiryEndYear}/07/31 */
  expiryEndYear: string
  /** 可收訓容額 */
  limit: number | null
  /** 前年度核定 */
  prevQuota: number | null
  /** 建議分配 */
  currentQuota: number | null
  groupId: string | null
  isSubRow: boolean
  applicationType: "single" | "joint"
  /** 合併認定的成員院所代碼（有值即為合併機構） */
  mergedHospitalCodes: string[]
  /** 聯合申請主列的合作機構代碼 */
  partnerHospitalCodes?: string[]
}

// ── 審查歷程 ────────────────────────────────────────────────
// 每個審查階段結束時留下一筆紀錄。案件走到第 N 階段時，第 1～N-1 階段的紀錄都應可檢視，
// 讓後段的審查者（尤其待公告的醫事司）看得到前面每一關的結論，而不是只看得到分組會議。
//
// kind 區分兩種審查形態：
//   meeting —— 分組會議、RRC 大會，產出的是會議紀錄
//   desk    —— 醫策會初審、醫事司核定，產出的是意見表／核定函，沒有會議紀錄可言
// 兩者的按鈕文案與彈窗標題因此不同，不硬套「檢視會議記錄」。

export interface StageReviewRecord {
  /** 這筆紀錄屬於哪個階段 */
  stage: QuotaReviewStage
  /** 審查單位（醫策會／RRC 大會／醫事司），由 QUOTA_FILING_STAGE_UNIT 推導 */
  unit: string
  kind: "meeting" | "desk"
  /** 會議日期或審查日期（民國） */
  reviewDate: string
  /** 會議／文件名稱 */
  title: string
  /** 決議：通過／修正後通過／同意公告／退回補正 */
  decision: string
  /** 紀錄檔名，供下載按鈕顯示 */
  recordFileName: string
  /** 紀錄全文，供「檢視會議記錄／檢視審查意見」彈窗顯示 */
  recordContent: string
}

export type HospitalQuotaDetail = {
  society: HospitalQuotaReviewSociety
  hospitals: HospitalQuotaRow[]
  disqualifiedHospitals: Array<{
    id: number
    code: string
    name: string
    reason: string
  }>
  notAppliedHospitals: Array<{
    id: number
    code: string
    name: string
    county: string
    prevQualification: string
    reason: string
  }>
  reviewComment: string
  /**
   * 前置階段的審查歷程，依階段順序排列（由 buildReviewHistory 產生）。
   * 取代原本硬寫的 groupReviewData —— 舊做法只塞得下「分組會議」一塊，
   * 導致案件走到待公告時，醫事司看不到分組會議之後的 RRC 大會結論。
   */
  reviewHistory: StageReviewRecord[]
  // 是否為內科版型（有結核病計畫區塊）
  isInternalMedicine?: boolean
  // 結核病計畫容額（僅內科版型）。欄位比照填報端：可收訓容額 + 建議分配
  tuberculosisHospitals?: Array<{
    id: number
    code: string
    name: string
    county: string
    limit: number | null
    currentQuota: number | null
  }>
}

const richDetails: Record<string, Omit<HospitalQuotaDetail, "society" | "reviewHistory">> = {
  // ── id "1"：台灣家庭醫學醫學會（一般版型，資料豐沛）────────────────────────
  "1": {
    isInternalMedicine: false,
    hospitals: [
      {
        id: 1,
        code: "0401180014",
        name: "高雄市立小港醫院(委託財團法人私立高雄醫學大學經營)",
        county: "高雄市",
        district: "小港區",
        expiryStartYear: "115",
        expiryEndYear: "115",
        limit: 15,
        prevQuota: 5,
        currentQuota: 5,
        groupId: null,
        isSubRow: false,
        applicationType: "single",
        mergedHospitalCodes: [],
      },
      {
        id: 2,
        code: "0401190015",
        name: "新北市立土城醫院(委託長庚醫療財團法人興建經營)",
        county: "新北市",
        district: "土城區",
        expiryStartYear: "115",
        expiryEndYear: "115",
        limit: 12,
        prevQuota: 4,
        currentQuota: 5,
        groupId: null,
        isSubRow: false,
        applicationType: "single",
        mergedHospitalCodes: [],
      },
      // 單一機構申請，但主體本身是合併認定機構
      {
        id: 3,
        code: "merged-001",
        name: "長庚醫療財團法人林口長庚紀念醫院及其台北長庚紀念醫院",
        county: "桃園市",
        district: "龜山區",
        expiryStartYear: "115",
        expiryEndYear: "115",
        limit: 18,
        prevQuota: 6,
        currentQuota: 7,
        groupId: null,
        isSubRow: false,
        applicationType: "single",
        mergedHospitalCodes: ["0401260022", "0401270023"],
      },
      // 聯合申請 A 組：主訓為合併機構，合作①單一機構、合作②合併機構
      {
        id: 4,
        code: "merged-002",
        name: "台灣基督長老教會馬偕醫療財團法人馬偕紀念醫院及其淡水馬偕紀念醫院",
        county: "台北市",
        district: "中山區",
        expiryStartYear: "115",
        expiryEndYear: "115",
        limit: 16,
        prevQuota: 4,
        currentQuota: 5,
        groupId: "group-a",
        isSubRow: false,
        applicationType: "joint",
        mergedHospitalCodes: ["0401280024", "0401290025"],
        partnerHospitalCodes: ["0401240020", "merged-003"],
      },
      {
        id: "4.1",
        code: "0401240020",
        name: "醫療財團法人徐元智先生醫藥基金會亞東紀念醫院",
        county: "新北市",
        district: "板橋區",
        expiryStartYear: "115",
        expiryEndYear: "115",
        limit: null,
        prevQuota: null,
        currentQuota: null,
        groupId: "group-a",
        isSubRow: true,
        applicationType: "joint",
        mergedHospitalCodes: [],
      },
      {
        id: "4.2",
        code: "merged-003",
        name: "國立臺灣大學醫學院附設醫院新竹臺大分院生醫醫院及其竹東院區",
        county: "新竹市",
        district: "東區",
        expiryStartYear: "115",
        expiryEndYear: "115",
        limit: null,
        prevQuota: null,
        currentQuota: null,
        groupId: "group-a",
        isSubRow: true,
        applicationType: "joint",
        mergedHospitalCodes: ["0401300026", "0401310027"],
      },
      // 聯合申請 B 組：奇美（主訓）＋成大（合作），皆為單一機構
      {
        id: 5,
        code: "0401320028",
        name: "奇美醫療財團法人奇美醫院",
        county: "台南市",
        district: "永康區",
        expiryStartYear: "114",
        expiryEndYear: "116",
        limit: 9,
        prevQuota: 3,
        currentQuota: 4,
        groupId: "group-b",
        isSubRow: false,
        applicationType: "joint",
        mergedHospitalCodes: [],
        partnerHospitalCodes: ["0401330029"],
      },
      {
        id: "5.1",
        code: "0401330029",
        name: "國立成功大學醫學院附設醫院",
        county: "台南市",
        district: "東區",
        expiryStartYear: "114",
        expiryEndYear: "116",
        limit: null,
        prevQuota: null,
        currentQuota: null,
        groupId: "group-b",
        isSubRow: true,
        applicationType: "joint",
        mergedHospitalCodes: [],
      },
      {
        id: 6,
        code: "0401200016",
        name: "三軍總醫院",
        county: "台北市",
        district: "內湖區",
        expiryStartYear: "113",
        expiryEndYear: "115",
        limit: 10,
        prevQuota: 2,
        currentQuota: 3,
        groupId: null,
        isSubRow: false,
        applicationType: "single",
        mergedHospitalCodes: [],
      },
    ],
    disqualifiedHospitals: [
      {
        id: 1,
        code: "0401410037",
        name: "新光醫院",
        reason:
          "未符合訓練醫院認定基準第 3 條第 1 項：專任主治醫師人數不足（現有 3 人，基準要求 5 人以上）",
      },
      {
        id: 2,
        code: "0401420038",
        name: "恩主公醫院",
        reason: "未符合訓練醫院認定基準第 5 條：未能提供完整次專科輪訓環境，缺少血液腫瘤科及腎臟科門診",
      },
      {
        id: 3,
        code: "0401430039",
        name: "台北市立聯合醫院（忠孝院區）",
        reason: "資格效期已屆滿（113/07/31），且未於截止日前完成換證申請",
      },
    ],
    notAppliedHospitals: [
      {
        id: 1,
        code: "0401440040",
        name: "馬偕紀念醫院（淡水院區）",
        county: "新北市",
        prevQualification: "曾為合格訓練醫院（有效至 112/07/31）",
        reason: "院方說明因教學師資異動，暫停申請本年度認定，預計下年度重新申請",
      },
      {
        id: 2,
        code: "0401450041",
        name: "署立桃園醫院",
        county: "桃園市",
        prevQualification: "曾為合格訓練醫院（有效至 111/07/31）",
        reason: "行政重組中，目前無法提供符合基準之訓練環境，院方已申請緩辦",
      },
      {
        id: 3,
        code: "0401460042",
        name: "天主教輔仁大學附設醫院",
        county: "新北市",
        prevQualification: "首次申請，無前年度資格",
        reason: "醫院表示資料尚未備齊，將於下一申請期程提出",
      },
    ],
    reviewComment: "",
  },

  // ── id "2"：台灣內科醫學會（內科版型，有結核病計畫容額）────────────────────
  "2": {
    isInternalMedicine: true,
    hospitals: [
      {
        id: 1,
        code: "0501180014",
        name: "國立臺灣大學醫學院附設醫院",
        county: "台北市",
        district: "中正區",
        expiryStartYear: "115",
        expiryEndYear: "115",
        limit: 12,
        prevQuota: 4,
        currentQuota: 5,
        groupId: null,
        isSubRow: false,
        applicationType: "single",
        mergedHospitalCodes: [],
      },
      {
        id: 2,
        code: "0501190015",
        name: "臺北榮民總醫院",
        county: "台北市",
        district: "北投區",
        expiryStartYear: "115",
        expiryEndYear: "115",
        limit: 10,
        prevQuota: 3,
        currentQuota: 4,
        groupId: null,
        isSubRow: false,
        applicationType: "single",
        mergedHospitalCodes: [],
      },
      {
        id: 3,
        code: "0501200016",
        name: "三軍總醫院",
        county: "台北市",
        district: "內湖區",
        expiryStartYear: "113",
        expiryEndYear: "115",
        limit: 8,
        prevQuota: 3,
        currentQuota: 3,
        groupId: null,
        isSubRow: false,
        applicationType: "single",
        mergedHospitalCodes: [],
      },
      {
        id: 4,
        code: "merged-201",
        name: "中國醫藥大學附設醫院及其台北分院",
        county: "台中市",
        district: "北區",
        expiryStartYear: "115",
        expiryEndYear: "115",
        limit: 10,
        prevQuota: 3,
        currentQuota: 3,
        groupId: null,
        isSubRow: false,
        applicationType: "single",
        mergedHospitalCodes: ["0501280024", "0501281024"],
      },
      {
        id: 5,
        code: "0501290025",
        name: "臺中榮民總醫院",
        county: "台中市",
        district: "西屯區",
        expiryStartYear: "116",
        expiryEndYear: "116",
        limit: 8,
        prevQuota: 2,
        currentQuota: 3,
        groupId: null,
        isSubRow: false,
        applicationType: "single",
        mergedHospitalCodes: [],
      },
      {
        id: 6,
        code: "0501350031",
        name: "國立成功大學醫學院附設醫院",
        county: "台南市",
        district: "東區",
        expiryStartYear: "115",
        expiryEndYear: "115",
        limit: 8,
        prevQuota: 2,
        currentQuota: 3,
        groupId: null,
        isSubRow: false,
        applicationType: "single",
        mergedHospitalCodes: [],
      },
      // 聯合申請：高雄長庚（主訓）＋高雄榮總（合作）
      {
        id: 7,
        code: "0501380034",
        name: "長庚醫療財團法人高雄長庚紀念醫院",
        county: "高雄市",
        district: "鳥松區",
        expiryStartYear: "115",
        expiryEndYear: "115",
        limit: 14,
        prevQuota: 4,
        currentQuota: 5,
        groupId: "group-a",
        isSubRow: false,
        applicationType: "joint",
        mergedHospitalCodes: [],
        partnerHospitalCodes: ["0501390035"],
      },
      {
        id: "7.1",
        code: "0501390035",
        name: "高雄榮民總醫院",
        county: "高雄市",
        district: "左營區",
        expiryStartYear: "115",
        expiryEndYear: "115",
        limit: null,
        prevQuota: null,
        currentQuota: null,
        groupId: "group-a",
        isSubRow: true,
        applicationType: "joint",
        mergedHospitalCodes: [],
      },
    ],
    disqualifiedHospitals: [
      {
        id: 1,
        code: "0501410037",
        name: "彰化基督教醫院",
        reason:
          "未符合訓練醫院認定基準第 4 條：年度手術量未達最低標準（現有 420 例，基準要求 500 例以上）",
      },
      {
        id: 2,
        code: "0501420038",
        name: "奇美醫院（柳營院區）",
        reason: "資格效期已屆滿（113/07/31），補送換證申請文件不完整，請補齊後重新申請",
      },
    ],
    notAppliedHospitals: [
      {
        id: 1,
        code: "0501430039",
        name: "署立嘉義醫院",
        county: "嘉義市",
        prevQualification: "曾為合格訓練醫院（有效至 112/07/31）",
        reason: "人員編制調整中，預計下年度恢復申請",
      },
      {
        id: 2,
        code: "0501440040",
        name: "花蓮慈濟醫院",
        county: "花蓮縣",
        prevQualification: "曾為合格訓練醫院（有效至 113/07/31）",
        reason: "地震後院舍修繕中，暫停訓練計畫申請，預計 115 年第二期重新提出",
      },
    ],
    reviewComment:
      "內科醫學會整體申請容額與前年度差異不大，建議維持原核定容額；高雄長庚與高雄榮總聯合申請案請確認合作協議書是否已更新。",
    tuberculosisHospitals: [
      {
        id: 1,
        code: "0501180014",
        name: "國立臺灣大學醫學院附設醫院",
        county: "台北市",
        limit: 3,
        currentQuota: 3,
      },
      {
        id: 2,
        code: "0501190015",
        name: "臺北榮民總醫院",
        county: "台北市",
        limit: 3,
        currentQuota: 2,
      },
      {
        id: 3,
        code: "0501350031",
        name: "國立成功大學醫學院附設醫院",
        county: "台南市",
        limit: 2,
        currentQuota: 2,
      },
      {
        id: 4,
        code: "0501360032",
        name: "高雄醫學大學附設中和紀念醫院",
        county: "高雄市",
        limit: 2,
        currentQuota: 1,
      },
    ],
  },
}

// 其餘醫學會：依醫學會序號生成一份輕量但欄位齊全的名冊，
// 讓 25 個醫學會都有可檢視的明細頁（原本只有 7 筆，列表補到 25 後其餘會連不到頁面）。
const LIGHT_HOSPITAL_TEMPLATE = [
  { name: "國立臺灣大學醫學院附設醫院", county: "台北市", district: "中正區" },
  { name: "臺北榮民總醫院", county: "台北市", district: "北投區" },
  { name: "長庚醫療財團法人林口長庚紀念醫院", county: "桃園市", district: "龜山區" },
  { name: "中國醫藥大學附設醫院", county: "台中市", district: "北區" },
  { name: "國立成功大學醫學院附設醫院", county: "台南市", district: "東區" },
]

function buildLightDetail(
  society: HospitalQuotaReviewSociety,
): Omit<HospitalQuotaDetail, "society" | "reviewHistory"> {
  const seed = Number(society.id)
  const count = 2 + (seed % 3) // 2～4 家
  const codePrefix = String(1000 + seed * 7).slice(0, 4)

  const hospitals: HospitalQuotaRow[] = LIGHT_HOSPITAL_TEMPLATE.slice(0, count).map((tpl, i) => ({
    id: i + 1,
    code: `${codePrefix}${String(180014 + i)}`,
    name: tpl.name,
    county: tpl.county,
    district: tpl.district,
    expiryStartYear: i % 3 === 2 ? "113" : "115",
    expiryEndYear: i % 3 === 2 ? "115" : "115",
    limit: 6 + ((seed + i) % 6),
    prevQuota: 2 + ((seed + i) % 3),
    currentQuota: 2 + ((seed + i + 1) % 4),
    groupId: null,
    isSubRow: false,
    applicationType: "single",
    mergedHospitalCodes: [],
  }))

  return {
    hospitals,
    disqualifiedHospitals:
      seed % 3 === 0
        ? [
            {
              id: 1,
              code: `${codePrefix}410037`,
              name: "彰化基督教醫院",
              reason: "未符合訓練醫院認定基準第 3 條：專任主治醫師人數不足，請補強師資後重新申請",
            },
          ]
        : [],
    notAppliedHospitals:
      seed % 4 === 1
        ? [
            {
              id: 1,
              code: `${codePrefix}430039`,
              name: "署立嘉義醫院",
              county: "嘉義市",
              prevQualification: "曾為合格訓練醫院（有效至 112/07/31）",
              reason: "人員編制調整中，預計下年度恢復申請",
            },
          ]
        : [],
    reviewComment: "",
  }
}

// ── 審查歷程產生 ─────────────────────────────────────────────
// 案件在階段 S 時，S 之前的每個階段都已完成審查、都應留下一筆可檢視的紀錄。
// 退件案件另外在 returnedFrom 那一階段留下一筆「退回補正」，讓審查者看得到為什麼被退。

type StageRecordTemplate = Pick<StageReviewRecord, "kind"> & {
  title: (societyName: string) => string
  decision: string
  recordFileName: (societyName: string) => string
  recordContent: (societyName: string) => string
}

const STAGE_RECORD_TEMPLATES: Record<QuotaReviewStage, StageRecordTemplate> = {
  醫策會初審: {
    kind: "desk",
    title: () => "115年度容額填報初審",
    decision: "通過",
    recordFileName: (s) => `115年度${s}容額填報初審意見表.pdf`,
    recordContent: (s) => `一、初審單位：財團法人醫院評鑑暨醫療品質策進會

二、初審日期：115年1月20日

三、初審範圍：${s}所送115年度專科醫師訓練醫院認定合格名冊及訓練容量

四、初審意見：

（一）形式審查
    1. 申請名冊格式、欄位填載完整，資格效期起訖年度均已填列。
    2. 聯合申請案件之主訓機構與合作機構對應關係明確，合作協議書已檢附。
    3. 合併認定機構已依規定併列於同一列，未重複計列容額。

（二）實質審查
    1. 各訓練醫院之可收訓容額與前年度核定容額差異均在合理範圍內。
    2. 不合格醫院名單所載不合格原因均已敘明依據條文，符合認定基準之引用格式。
    3. 未申請醫院名單已載明前一年度資格與未申請原因，資料齊備。

五、初審結論：通過，提送分組會議審查。`,
  },
  分組會議: {
    kind: "meeting",
    title: () => "115年度第一次容額分組審查會議",
    decision: "通過",
    recordFileName: (s) => `115年度${s}容額分組審查會議紀錄.pdf`,
    recordContent: (s) => `一、會議名稱：115年度第一次容額分組審查會議

二、會議時間：115年2月14日（星期五）上午10時

三、會議地點：財團法人醫院評鑑暨醫療品質策進會第二會議室

四、主席：○○○召集人　　紀錄：○○○

五、出席人員：分組審查委員 7 人（詳簽到表）

六、審查案由：${s}115年度訓練醫院容額分配案

七、審查意見：

（一）本案申請容額與前年度核定容額之差異，經委員逐案檢視，均有合理之師資與量能佐證。

（二）聯合申請案之合作機構容額不另計列，由主訓機構統籌分配，與認定基準規定相符。

（三）委員建議：申請容額增幅超過 2 名之訓練醫院，請於 RRC 大會補充說明近三年招收率及
    完訓率，以利大會綜合評估。

八、決議：通過，提送 RRC 大會審核。`,
  },
  RRC大會: {
    kind: "meeting",
    title: () => "115年度專科醫師訓練計畫認定會第一次大會",
    decision: "通過",
    recordFileName: (s) => `115年度RRC大會審查結論_${s}.pdf`,
    recordContent: (s) => `一、會議名稱：115年度專科醫師訓練計畫認定會（RRC）第一次大會

二、會議時間：115年3月12日（星期三）下午2時

三、會議地點：衛生福利部第一會議室

四、主席：○○○主任委員　　紀錄：○○○

五、審查案由：${s}115年度訓練醫院容額分配案（經分組會議審查通過）

六、大會決議：

（一）同意分組會議審查結果，${s}所送訓練醫院認定合格名冊及訓練容量照案通過。

（二）分組會議所提「增幅超過 2 名之訓練醫院應補充招收率及完訓率」一節，經各該醫院補件
    說明，資料齊備，同意其申請容額。

（三）不合格醫院名單所列各院，其不合格事由與認定基準相符，同意列為不合格；請醫學會於
    公告後函知各該醫院並敘明改善方向。

（四）本案容額總數未逾該醫學會設定之容額上限，同意送醫事司辦理公告。

七、後續作業：提送衛生福利部醫事司辦理核定及公告。`,
  },
  待公告: {
    kind: "desk",
    title: () => "115年度容額核定",
    decision: "同意公告",
    recordFileName: (s) => `115年度${s}容額核定函.pdf`,
    recordContent: (s) => `一、核定機關：衛生福利部醫事司

二、核定日期：115年4月8日

三、核定內容：${s}115年度專科醫師訓練醫院認定合格名冊及訓練容量，業經專科醫師訓練計畫
    認定會（RRC）115年度第一次大會審查通過，本部核定如所送名冊。

四、核定意見：

（一）所送名冊之訓練醫院認定資格效期、訓練容量均與 RRC 大會決議相符，予以核定。

（二）本案容額自115年8月1日起生效，至116年7月31日止。

（三）請該醫學會於公告後一個月內辦理容額成果報告（RRC 審查後之審查細節補充資料）之
    上傳作業。

五、辦理情形：同意公告，移請公告管理作業。`,
  },
  已公告: {
    kind: "desk",
    title: () => "115年度容額公告",
    decision: "已公告",
    recordFileName: (s) => `115年度${s}容額公告.pdf`,
    recordContent: (s) => `${s}115年度專科醫師訓練醫院認定合格名冊及訓練容量業經公告，
公告內容以公告管理所發布之版本為準。`,
  },
}

const RETURN_REASON_BY_STAGE: Record<QuotaReviewStage, string> = {
  醫策會初審:
    "初審發現部分訓練醫院之資格效期起訖年度填載有誤，另有 2 家醫院未檢附合作協議書，請補正後重新送件。",
  分組會議:
    "分組會議認為申請容額增幅較大之訓練醫院，其師資與訓練量能佐證資料不足，請補充近三年招收率及完訓率後重新送件。",
  RRC大會:
    "大會決議本案不合格醫院名單所載事由與認定基準引用條文不符，另聯合申請案之主訓機構容額分配方式須補充說明，請補正後重新送件。",
  待公告:
    "核定作業發現所送名冊容額總數逾該醫學會設定之容額上限，請重新調整分配後送件。",
  已公告: "已公告案件之退回情形，請洽醫事司。",
}

/**
 * 產生案件的審查歷程：目前階段之前的所有階段各一筆。
 * 退件案件在 returnedFrom 那一階段追加一筆「退回補正」。
 */
export function buildReviewHistory(society: HospitalQuotaReviewSociety): StageReviewRecord[] {
  const currentIndex = quotaReviewStages.indexOf(society.stage)
  if (currentIndex < 0) return []

  const records: StageReviewRecord[] = quotaReviewStages
    .slice(0, currentIndex)
    .map((stage) => {
      const tpl = STAGE_RECORD_TEMPLATES[stage]
      return {
        stage,
        unit: QUOTA_FILING_STAGE_UNIT[stage],
        kind: tpl.kind,
        reviewDate: STAGE_REVIEW_DATE[stage],
        title: tpl.title(society.name),
        decision: tpl.decision,
        recordFileName: tpl.recordFileName(society.name),
        recordContent: tpl.recordContent(society.name),
      }
    })

  if (society.returnedFrom) {
    const stage = society.returnedFrom
    records.push({
      stage,
      unit: QUOTA_FILING_STAGE_UNIT[stage],
      kind: STAGE_RECORD_TEMPLATES[stage].kind,
      reviewDate: STAGE_REVIEW_DATE[stage],
      title: `${STAGE_RECORD_TEMPLATES[stage].title(society.name)}（退回補正）`,
      decision: "退回補正",
      recordFileName: `115年度${society.name}容額填報退件意見.pdf`,
      recordContent: `一、退件單位：${QUOTA_FILING_STAGE_UNIT[stage]}

二、退件階段：${stage}

三、退件日期：${STAGE_REVIEW_DATE[stage]}

四、退件意見：

${RETURN_REASON_BY_STAGE[stage]}

五、後續作業：請醫學會依上開意見補正後重新送件。本案重新送件後回到「${stage}」階段續審，
不重走先前已通過的階段。`,
    })
  }

  return records
}

const STAGE_REVIEW_DATE: Record<QuotaReviewStage, string> = {
  醫策會初審: "115/01/20",
  分組會議: "115/02/14",
  RRC大會: "115/03/12",
  待公告: "115/04/08",
  已公告: "115/04/20",
}

// ── 查詢函式 ────────────────────────────────────────────────

export function getHospitalQuotaSocieties(): HospitalQuotaReviewSociety[] {
  return mockHospitalQuotaSocieties
}

export function getHospitalQuotaStageConfig() {
  return quotaReviewStageConfig
}

export function getHospitalQuotaDetail(id: string): HospitalQuotaDetail | null {
  const society = mockHospitalQuotaSocieties.find((s) => s.id === id)
  // 尚未填寫的醫學會沒有可審查的內容，列表也不給入口
  if (!society || !society.submitted) return null

  const rich = richDetails[id]
  return {
    society,
    ...(rich ?? buildLightDetail(society)),
    reviewHistory: buildReviewHistory(society),
  }
}

/** 退件時顯示「退回自 X（由 Y 退回）」用 */
export function getQuotaReviewStageUnit(stage: QuotaReviewStage): string {
  return QUOTA_FILING_STAGE_UNIT[stage]
}

/** 某階段內、實際可被批次推進的案件（已送件且未退件） */
export function getAdvanceableSocieties(stage: QuotaReviewStage): HospitalQuotaReviewSociety[] {
  return mockHospitalQuotaSocieties.filter(
    (s) => s.stage === stage && s.submitted && s.returnedFrom === null,
  )
}

/**
 * 推進前的統計。分成三類：
 *   審查通過 / 尚未審查 —— 可推進
 *   尚未填寫 —— 根本還沒送件，不可推進（僅供列表提示）
 * 退件案件不在本階段清單內（已移至退件補正中），故不列入統計。
 */
export function getAdvanceCheckStatsForQuota(fromStage: string) {
  const inStage = getAdvanceableSocieties(fromStage as QuotaReviewStage)
  const approved = inStage.filter((s) => s.reviewResult === "approved")
  const pending = inStage.filter((s) => s.reviewResult === "pending")
  const notFiled = mockHospitalQuotaSocieties.filter((s) => s.stage === fromStage && !s.submitted)

  return {
    total: inStage.length,
    societies: inStage,
    approved: { count: approved.length, names: approved.map((s) => s.name) },
    pendingReview: { count: pending.length, names: pending.map((s) => s.name) },
    notFiled: { count: notFiled.length, names: notFiled.map((s) => s.name) },
  }
}

/** 將指定案件推進到下一階段（mutation，直接更新 mock） */
export function advanceQuotaReviewSocieties(societyIds: string[], targetStage: QuotaReviewStage) {
  mockHospitalQuotaSocieties.forEach((s) => {
    if (societyIds.includes(s.id)) s.stage = targetStage
  })
}

/** 取得某階段的下一階段；已是最終階段回 null */
export function getNextQuotaReviewStage(stage: QuotaReviewStage): QuotaReviewStage | null {
  const idx = quotaReviewStages.indexOf(stage)
  if (idx >= 0 && idx < quotaReviewStages.length - 1) return quotaReviewStages[idx + 1]
  return null
}
