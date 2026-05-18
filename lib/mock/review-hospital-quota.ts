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

// 流程階段順序
export const hospitalQuotaStages = [
  { value: "pending", label: "待審查" },
  { value: "group-review", label: "分組會議審查" },
  { value: "main-review", label: "RRC 大會審核" },
  { value: "upload-pending", label: "待公告" },
]
export const mockHospitalQuotaDetails: Record<string, {
  society: typeof mockHospitalQuotaSocieties[0];
  hospitals: Array<{
    id: number | string;
    code: string;
    name: string;
    expiry: string;
    extension: string;
    limit: number | null;
    prevQuota: number | null;
    currentQuota: number | null;
    groupId: string | null;
    isSubRow: boolean;
    mainHospitalCodes?: string[];
    partnerHospitalCodes?: string[];
  }>;
  disqualifiedHospitals: Array<{
    id: number;
    code: string;
    name: string;
    reason: string;
  }>;
  reviewComment: string;
  groupReviewData?: {
    meetingDate: string;
    meetingRecord: string;
    decision: string;
  };
}> = {
  "1": {
    society: mockHospitalQuotaSocieties[0],
    hospitals: [
      { id: 1, code: "0401180014", name: "台大醫院", expiry: "有效至 2026/7/31", extension: "4 年 (至 2030/7/31)", limit: 15, prevQuota: 5, currentQuota: 5, groupId: null, isSubRow: false },
      { id: 2, code: "0401180015", name: "榮民總醫院", expiry: "有效至 2026/7/31", extension: "-", limit: 12, prevQuota: 3, currentQuota: 4, groupId: null, isSubRow: false },
      { id: 3, code: "0401180016", name: "長庚醫院", expiry: "有效至 2024/7/31", extension: "4 年 (至 2028/7/31)", limit: 10, prevQuota: 2, currentQuota: 3, groupId: null, isSubRow: false },
      { id: 4, code: "0401180017", name: "中國醫藥大學附醫", expiry: "有效至 2026/7/31", extension: "4 年 (至 2030/7/31)", limit: 8, prevQuota: 2, currentQuota: 2, groupId: null, isSubRow: false },
      { id: "5.1", code: "0401180018", name: "仁愛醫院", expiry: "有效至 2026/7/31", extension: "4 年 (至 2030/7/31)", limit: 15, prevQuota: 4, currentQuota: 5, groupId: "group-a", isSubRow: false, mainHospitalCodes: ["0401180018", "0401180019"], partnerHospitalCodes: ["0401180020"] },
      { id: "5.2", code: "0401180019", name: "和平醫院", expiry: "", extension: "", limit: null, prevQuota: null, currentQuota: null, groupId: "group-a", isSubRow: true },
      { id: "5.3", code: "0401180020", name: "新光醫院（合作）", expiry: "", extension: "", limit: null, prevQuota: null, currentQuota: null, groupId: "group-a", isSubRow: true },
    ],
    disqualifiedHospitals: [
      { id: 1, code: "0401180020", name: "新光醫院", reason: "未符合訓練醫院認證基準第3條：專任主治醫師人數不足" },
    ],
    reviewComment: "",
  },
  "2": {
    society: mockHospitalQuotaSocieties[1],
    hospitals: [
      { id: 1, code: "0501180014", name: "台大醫院", expiry: "有效至 2026/7/31", extension: "4 年 (至 2030/7/31)", limit: 12, prevQuota: 4, currentQuota: 5, groupId: null, isSubRow: false },
      { id: 2, code: "0501180015", name: "三軍總醫院", expiry: "有效至 2025/7/31", extension: "4 年 (至 2029/7/31)", limit: 10, prevQuota: 3, currentQuota: 3, groupId: null, isSubRow: false },
    ],
    disqualifiedHospitals: [],
    reviewComment: "",
  },
  "3": {
    society: mockHospitalQuotaSocieties[2],
    hospitals: [
      { id: 1, code: "0601180014", name: "台大兒童醫院", expiry: "有效至 2026/7/31", extension: "4 年 (至 2030/7/31)", limit: 8, prevQuota: 3, currentQuota: 4, groupId: null, isSubRow: false },
      { id: 2, code: "0601180015", name: "馬偕兒童醫院", expiry: "有效至 2026/7/31", extension: "-", limit: 6, prevQuota: 2, currentQuota: 2, groupId: null, isSubRow: false },
    ],
    disqualifiedHospitals: [],
    reviewComment: "",
  },
  "4": {
    society: mockHospitalQuotaSocieties[3],
    hospitals: [
      { id: 1, code: "0701180014", name: "台大醫院", expiry: "有效至 2026/7/31", extension: "4 年 (至 2030/7/31)", limit: 10, prevQuota: 3, currentQuota: 4, groupId: null, isSubRow: false },
    ],
    disqualifiedHospitals: [],
    reviewComment: "",
    groupReviewData: {
      meetingDate: "114/02/10",
      meetingRecord: "114年度第一次分組會議記錄.pdf",
      decision: "通過",
    },
  },
  "5": {
    society: mockHospitalQuotaSocieties[4],
    hospitals: [
      { id: 1, code: "0801180014", name: "台大醫院骨科", expiry: "有效至 2026/7/31", extension: "4 年 (至 2030/7/31)", limit: 6, prevQuota: 2, currentQuota: 2, groupId: null, isSubRow: false },
    ],
    disqualifiedHospitals: [],
    reviewComment: "",
    groupReviewData: {
      meetingDate: "114/02/18",
      meetingRecord: "114年度第一次分組會議記錄.pdf",
      decision: "待討論",
    },
  },
  "6": {
    society: mockHospitalQuotaSocieties[5],
    hospitals: [
      { id: 1, code: "0901180014", name: "台大神經內科", expiry: "有效至 2026/7/31", extension: "4 年 (至 2030/7/31)", limit: 5, prevQuota: 2, currentQuota: 2, groupId: null, isSubRow: false },
    ],
    disqualifiedHospitals: [],
    reviewComment: "分組會議建議通過，請提交 RRC 大會審核。",
    groupReviewData: {
      meetingDate: "114/02/20",
      meetingRecord: "114年度第二次分組會議記錄.pdf",
      decision: "通過",
    },
  },
  "7": {
    society: mockHospitalQuotaSocieties[6],
    hospitals: [
      { id: 1, code: "1001180014", name: "台大精神科", expiry: "有效至 2026/7/31", extension: "4 年 (至 2030/7/31)", limit: 8, prevQuota: 3, currentQuota: 3, groupId: null, isSubRow: false },
    ],
    disqualifiedHospitals: [],
    reviewComment: "RRC 大會審核通過，待公告。",
    groupReviewData: {
      meetingDate: "114/02/10",
      meetingRecord: "114年度第一次分組會議記錄.pdf",
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

export function getHospitalQuotaDetail(id: string) {
  return mockHospitalQuotaDetails[id] || null
}

// 取得特定階段的醫學會列表（含審查結果統計）
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
