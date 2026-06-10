import { allSocieties } from "@/lib/data/societies"

export const mockHospitalQuotaSocieties = allSocieties.slice(0, 7).map((society, index) => ({
  id: society.id,
  name: society.name,
  year: "115 年度",
  submittedDate: `2025-01-${String(5 + index).padStart(2, "0")}`,
  stage: (["pending", "pending", "pending", "group-review", "group-review", "main-review", "upload-pending"][index]) as "pending" | "group-review" | "main-review" | "upload-pending",
  reviewResult: (["pending", "approved", "needs-revision", "approved", "pending", "approved", "approved"][index]) as "pending" | "approved" | "needs-revision",
}))

export const hospitalQuotaStageConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "待審查" },
  "group-review": { color: "bg-blue-100 text-blue-800 border-blue-200", label: "分組會議審查" },
  "main-review": { color: "bg-purple-100 text-purple-800 border-purple-200", label: "RRC 大會審核" },
  "upload-pending": { color: "bg-green-100 text-green-800 border-green-200", label: "待公告" },
}

export const hospitalQuotaStages = [
  { value: "pending", label: "待審查" },
  { value: "group-review", label: "分組會議審查" },
  { value: "main-review", label: "RRC 大會審核" },
  { value: "upload-pending", label: "待公告" },
]

export type HospitalQuotaDetail = {
  society: typeof mockHospitalQuotaSocieties[0]
  hospitals: Array<{
    id: number | string
    code: string
    name: string
    county?: string
    expiry: string
    extension: string
    limit: number | null
    prevQuota: number | null
    currentQuota: number | null
    groupId: string | null
    isSubRow: boolean
    mainHospitalCodes?: string[]
    partnerHospitalCodes?: string[]
  }>
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
  groupReviewData?: {
    meetingDate: string
    meetingRecord: string
    decision: string
  }
  // 是否為內科版型（有結核病計畫區塊）
  isInternalMedicine?: boolean
  tuberculosisHospitals?: Array<{
    id: number
    code: string
    name: string
    county: string
    expiry: string
    quota: number | null
  }>
}

export const mockHospitalQuotaDetails: Record<string, HospitalQuotaDetail> = {
  // ── id "1"：台灣家庭醫學醫學會（一般版型，資料豐沛）────────────────────────
  "1": {
    society: mockHospitalQuotaSocieties[0],
    isInternalMedicine: false,
    hospitals: [
      {
        id: 1,
        code: "0401180014",
        name: "台大醫院",
        county: "台北市",
        expiry: "有效至 2026/7/31",
        extension: "4 年 (至 2030/7/31)",
        limit: 15,
        prevQuota: 5,
        currentQuota: 5,
        groupId: null,
        isSubRow: false,
      },
      {
        id: 2,
        code: "0401190015",
        name: "台北榮民總醫院",
        county: "台北市",
        expiry: "有效至 2026/7/31",
        extension: "-",
        limit: 12,
        prevQuota: 4,
        currentQuota: 5,
        groupId: null,
        isSubRow: false,
      },
      {
        id: 3,
        code: "0401200016",
        name: "三軍總醫院",
        county: "台北市",
        expiry: "有效至 2025/7/31",
        extension: "4 年 (至 2029/7/31)",
        limit: 10,
        prevQuota: 3,
        currentQuota: 3,
        groupId: null,
        isSubRow: false,
      },
      {
        id: 4,
        code: "0401280024",
        name: "中國醫藥大學附設醫院",
        county: "台中市",
        expiry: "有效至 2026/7/31",
        extension: "4 年 (至 2030/7/31)",
        limit: 10,
        prevQuota: 3,
        currentQuota: 4,
        groupId: null,
        isSubRow: false,
      },
      {
        id: 5,
        code: "0401350031",
        name: "成大醫院",
        county: "台南市",
        expiry: "有效至 2026/7/31",
        extension: "4 年 (至 2030/7/31)",
        limit: 8,
        prevQuota: 2,
        currentQuota: 3,
        groupId: null,
        isSubRow: false,
      },
      {
        id: 6,
        code: "0401360032",
        name: "高雄醫學大學附設中和紀念醫院",
        county: "高雄市",
        expiry: "有效至 2026/7/31",
        extension: "-",
        limit: 8,
        prevQuota: 2,
        currentQuota: 2,
        groupId: null,
        isSubRow: false,
      },
      // 聯合認定群組 A：林口長庚（主訓）+ 中山醫學大學附醫、萬芳醫院（合作）
      {
        id: "7.1",
        code: "0401260022",
        name: "林口長庚紀念醫院",
        county: "桃園市",
        expiry: "有效至 2026/7/31",
        extension: "4 年 (至 2030/7/31)",
        limit: 15,
        prevQuota: 4,
        currentQuota: 5,
        groupId: "group-a",
        isSubRow: false,
        mainHospitalCodes: ["0401260022"],
        partnerHospitalCodes: ["0401270023", "0401240020"],
      },
      {
        id: "7.2",
        code: "0401270023",
        name: "中山醫學大學附設醫院",
        county: "台中市",
        expiry: "有效至 2026/7/31",
        extension: "-",
        limit: null,
        prevQuota: null,
        currentQuota: null,
        groupId: "group-a",
        isSubRow: true,
      },
      {
        id: "7.3",
        code: "0401240020",
        name: "萬芳醫院",
        county: "台北市",
        expiry: "有效至 2026/7/31",
        extension: "-",
        limit: null,
        prevQuota: null,
        currentQuota: null,
        groupId: "group-a",
        isSubRow: true,
      },
      // 聯合認定群組 B：奇美醫院（主訓）+ 成大醫院（合作）
      {
        id: "8.1",
        code: "0401300026",
        name: "奇美醫院",
        county: "台南市",
        expiry: "有效至 2027/7/31",
        extension: "4 年 (至 2031/7/31)",
        limit: 9,
        prevQuota: 3,
        currentQuota: 4,
        groupId: "group-b",
        isSubRow: false,
        mainHospitalCodes: ["0401300026"],
        partnerHospitalCodes: ["0401310027"],
      },
      {
        id: "8.2",
        code: "0401310027",
        name: "成大醫院（合作）",
        county: "台南市",
        expiry: "有效至 2027/7/31",
        extension: "-",
        limit: null,
        prevQuota: null,
        currentQuota: null,
        groupId: "group-b",
        isSubRow: true,
      },
    ],
    disqualifiedHospitals: [
      {
        id: 1,
        code: "0401410037",
        name: "新光醫院",
        reason: "未符合訓練醫院認定基準第 3 條第 1 項：專任主治醫師人數不足（現有 3 人，基準要求 5 人以上）",
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
        reason: "資格效期已屆滿（2024/7/31），且未於截止日前完成換證申請",
      },
    ],
    notAppliedHospitals: [
      {
        id: 1,
        code: "0401440040",
        name: "馬偕紀念醫院（淡水院區）",
        county: "新北市",
        prevQualification: "曾為合格訓練醫院（有效至 2023/7/31）",
        reason: "院方說明因教學師資異動，暫停申請本年度認定，預計下年度重新申請",
      },
      {
        id: 2,
        code: "0401450041",
        name: "署立桃園醫院",
        county: "桃園市",
        prevQualification: "曾為合格訓練醫院（有效至 2022/7/31）",
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
    groupReviewData: undefined,
  },

  // ── id "2"：台灣內科醫學會（內科版型，資料豐沛，有結核病計畫區塊）────────────────────────
  "2": {
    society: mockHospitalQuotaSocieties[1],
    isInternalMedicine: true,
    hospitals: [
      {
        id: 1,
        code: "0501180014",
        name: "台大醫院",
        county: "台北市",
        expiry: "有效至 2026/7/31",
        extension: "4 年 (至 2030/7/31)",
        limit: 12,
        prevQuota: 4,
        currentQuota: 5,
        groupId: null,
        isSubRow: false,
      },
      {
        id: 2,
        code: "0501190015",
        name: "台北榮民總醫院",
        county: "台北市",
        expiry: "有效至 2026/7/31",
        extension: "-",
        limit: 10,
        prevQuota: 3,
        currentQuota: 4,
        groupId: null,
        isSubRow: false,
      },
      {
        id: 3,
        code: "0501200016",
        name: "三軍總醫院",
        county: "台北市",
        expiry: "有效至 2025/7/31",
        extension: "2 年 (至 2027/7/31)",
        limit: 8,
        prevQuota: 3,
        currentQuota: 3,
        groupId: null,
        isSubRow: false,
      },
      {
        id: 4,
        code: "0501210017",
        name: "台北市立萬芳醫院",
        county: "台北市",
        expiry: "有效至 2026/7/31",
        extension: "4 年 (至 2030/7/31)",
        limit: 6,
        prevQuota: 2,
        currentQuota: 2,
        groupId: null,
        isSubRow: false,
      },
      {
        id: 5,
        code: "0501280024",
        name: "中國醫藥大學附設醫院",
        county: "台中市",
        expiry: "有效至 2026/7/31",
        extension: "4 年 (至 2030/7/31)",
        limit: 10,
        prevQuota: 3,
        currentQuota: 3,
        groupId: null,
        isSubRow: false,
      },
      {
        id: 6,
        code: "0501290025",
        name: "台中榮民總醫院",
        county: "台中市",
        expiry: "有效至 2027/7/31",
        extension: "-",
        limit: 8,
        prevQuota: 2,
        currentQuota: 3,
        groupId: null,
        isSubRow: false,
      },
      {
        id: 7,
        code: "0501350031",
        name: "成大醫院",
        county: "台南市",
        expiry: "有效至 2026/7/31",
        extension: "4 年 (至 2030/7/31)",
        limit: 8,
        prevQuota: 2,
        currentQuota: 3,
        groupId: null,
        isSubRow: false,
      },
      // 聯合認定群組 A：高雄長庚（主訓）+ 高雄榮民總醫院（合作）
      {
        id: "8.1",
        code: "0501380034",
        name: "高雄長庚紀念醫院",
        county: "高雄市",
        expiry: "有效至 2026/7/31",
        extension: "4 年 (至 2030/7/31)",
        limit: 14,
        prevQuota: 4,
        currentQuota: 5,
        groupId: "group-a",
        isSubRow: false,
        mainHospitalCodes: ["0501380034"],
        partnerHospitalCodes: ["0501390035"],
      },
      {
        id: "8.2",
        code: "0501390035",
        name: "高雄榮民總醫院",
        county: "高雄市",
        expiry: "有效至 2026/7/31",
        extension: "-",
        limit: null,
        prevQuota: null,
        currentQuota: null,
        groupId: "group-a",
        isSubRow: true,
      },
    ],
    disqualifiedHospitals: [
      {
        id: 1,
        code: "0501410037",
        name: "彰化基督教醫院",
        reason: "未符合訓練醫院認定基準第 4 條：年度手術量未達最低標準（現有 420 例，基準要求 500 例以上）",
      },
      {
        id: 2,
        code: "0501420038",
        name: "奇美醫院（柳營院區）",
        reason: "資格效期已屆滿（2024/7/31），補送換證申請文件不完整，請補齊後重新申請",
      },
    ],
    notAppliedHospitals: [
      {
        id: 1,
        code: "0501430039",
        name: "署立嘉義醫院",
        county: "嘉義市",
        prevQualification: "曾為合格訓練醫院（有效至 2023/7/31）",
        reason: "人員編制調整中，預計下年度恢復申請",
      },
      {
        id: 2,
        code: "0501440040",
        name: "花蓮慈濟醫院",
        county: "花蓮縣",
        prevQualification: "曾為合格訓練醫院（有效至 2024/7/31）",
        reason: "地震後院舍修繕中，暫停訓練計畫申請，預計 115 年第二期重新提出",
      },
    ],
    reviewComment: "外科醫學會整體申請容額與前年度差異不大，建議維持原核定容額；高雄長庚與高雄榮總聯合認定案請確認合作協議書是否已更新。",
    tuberculosisHospitals: [
      {
        id: 1,
        code: "0401180014",
        name: "台大醫院",
        county: "台北市",
        expiry: "有效至 2026/7/31",
        quota: 3,
      },
      {
        id: 2,
        code: "0401190015",
        name: "台北榮民總醫院",
        county: "台北市",
        expiry: "有效至 2026/7/31",
        quota: 2,
      },
      {
        id: 3,
        code: "0401350031",
        name: "成大醫院",
        county: "台南市",
        expiry: "有效至 2025/7/31",
        quota: 2,
      },
      {
        id: 4,
        code: "0401360032",
        name: "高雄醫學大學附設中和紀念醫院",
        county: "高雄市",
        expiry: "有效至 2026/7/31",
        quota: 1,
      },
    ],
    groupReviewData: {
      meetingDate: "115/02/14",
      meetingRecord: "115年度內科醫學會容額分組審查會議紀錄.pdf",
      decision: "通過",
    },
  },

  // ── id "3"～"7"：維持原有輕量資料（其他醫學會） ──────────────────────────
  "3": {
    society: mockHospitalQuotaSocieties[2],
    hospitals: [
      { id: 1, code: "0601180014", name: "台大兒童醫院", county: "台北市", expiry: "有效至 2026/7/31", extension: "4 年 (至 2030/7/31)", limit: 8, prevQuota: 3, currentQuota: 4, groupId: null, isSubRow: false },
      { id: 2, code: "0601180015", name: "馬偕兒童醫院", county: "台北市", expiry: "有效至 2026/7/31", extension: "-", limit: 6, prevQuota: 2, currentQuota: 2, groupId: null, isSubRow: false },
    ],
    disqualifiedHospitals: [],
    notAppliedHospitals: [],
    reviewComment: "",
  },
  "4": {
    society: mockHospitalQuotaSocieties[3],
    hospitals: [
      { id: 1, code: "0701180014", name: "台大醫院婦產科", county: "台北市", expiry: "有效至 2026/7/31", extension: "4 年 (至 2030/7/31)", limit: 10, prevQuota: 3, currentQuota: 4, groupId: null, isSubRow: false },
    ],
    disqualifiedHospitals: [],
    notAppliedHospitals: [],
    reviewComment: "",
    groupReviewData: {
      meetingDate: "115/02/10",
      meetingRecord: "115年度第一次分組會議記錄.pdf",
      decision: "通過",
    },
  },
  "5": {
    society: mockHospitalQuotaSocieties[4],
    hospitals: [
      { id: 1, code: "0801180014", name: "台大醫院眼科", county: "台北市", expiry: "有效至 2026/7/31", extension: "4 年 (至 2030/7/31)", limit: 6, prevQuota: 2, currentQuota: 2, groupId: null, isSubRow: false },
    ],
    disqualifiedHospitals: [],
    notAppliedHospitals: [],
    reviewComment: "",
    groupReviewData: {
      meetingDate: "115/02/18",
      meetingRecord: "115年度第一次分組會議記錄.pdf",
      decision: "待討論",
    },
  },
  "6": {
    society: mockHospitalQuotaSocieties[5],
    hospitals: [
      { id: 1, code: "0901180014", name: "台大醫院耳鼻喉科", county: "台北市", expiry: "有效至 2026/7/31", extension: "4 年 (至 2030/7/31)", limit: 5, prevQuota: 2, currentQuota: 2, groupId: null, isSubRow: false },
    ],
    disqualifiedHospitals: [],
    notAppliedHospitals: [],
    reviewComment: "分組會議建議通過，請提交 RRC 大會審核。",
    groupReviewData: {
      meetingDate: "115/02/20",
      meetingRecord: "115年度第二次分組會議記錄.pdf",
      decision: "通過",
    },
  },
  "7": {
    society: mockHospitalQuotaSocieties[6],
    hospitals: [
      { id: 1, code: "1001180014", name: "台大醫院骨科", county: "台北市", expiry: "有效至 2026/7/31", extension: "4 年 (至 2030/7/31)", limit: 8, prevQuota: 3, currentQuota: 3, groupId: null, isSubRow: false },
    ],
    disqualifiedHospitals: [],
    notAppliedHospitals: [],
    reviewComment: "RRC 大會審核通過，待公告。",
    groupReviewData: {
      meetingDate: "115/02/10",
      meetingRecord: "115年度第一次分組會議記錄.pdf",
      decision: "通過",
    },
  },
}

export function getHospitalQuotaSocieties() {
  return mockHospitalQuotaSocieties
}

export function getHospitalQuotaStageConfig() {
  return hospitalQuotaStageConfig
}

export function getHospitalQuotaDetail(id: string): HospitalQuotaDetail | null {
  return mockHospitalQuotaDetails[id] || null
}

export function getAdvanceCheckStatsForQuota(fromStage: string) {
  const societies = getHospitalQuotaSocieties()
  const inStage = societies.filter((s) => s.stage === fromStage)

  const approved = inStage.filter((s) => s.reviewResult === "approved")
  const needsRevision = inStage.filter((s) => s.reviewResult === "needs-revision")
  const pending = inStage.filter((s) => s.reviewResult === "pending")

  return {
    total: inStage.length,
    societies: inStage,
    approved: { count: approved.length, names: approved.map((s) => s.name) },
    needsRevision: { count: needsRevision.length, names: needsRevision.map((s) => s.name) },
    pendingReview: { count: pending.length, names: pending.map((s) => s.name) },
  }
}
