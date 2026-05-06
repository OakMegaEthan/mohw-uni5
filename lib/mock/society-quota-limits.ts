export interface SocietyQuotaLimit {
  societyId: string
  societyName: string
  totalLimit: number | null
  previousLimit: number | null
  updatedAt: string | null
  updatedBy: string | null
}

export const societyQuotaLimits: SocietyQuotaLimit[] = [
  { societyId: "1",  societyName: "台灣內科醫學會",       totalLimit: 180, previousLimit: 170, updatedAt: "2025/03/15", updatedBy: "林承恩" },
  { societyId: "2",  societyName: "台灣外科醫學會",       totalLimit: 120, previousLimit: 120, updatedAt: "2025/03/15", updatedBy: "林承恩" },
  { societyId: "3",  societyName: "台灣小兒科醫學會",     totalLimit: 90,  previousLimit: 85,  updatedAt: "2025/03/15", updatedBy: "林承恩" },
  { societyId: "4",  societyName: "台灣婦產科醫學會",     totalLimit: 75,  previousLimit: 75,  updatedAt: "2025/03/15", updatedBy: "林承恩" },
  { societyId: "5",  societyName: "台灣骨科醫學會",       totalLimit: 100, previousLimit: 95,  updatedAt: "2025/03/15", updatedBy: "林承恩" },
  { societyId: "6",  societyName: "台灣眼科醫學會",       totalLimit: 60,  previousLimit: 60,  updatedAt: "2025/03/15", updatedBy: "林承恩" },
  { societyId: "7",  societyName: "台灣耳鼻喉科醫學會",   totalLimit: 55,  previousLimit: 50,  updatedAt: "2025/03/15", updatedBy: "林承恩" },
  { societyId: "8",  societyName: "台灣皮膚科醫學會",     totalLimit: 40,  previousLimit: 40,  updatedAt: "2025/03/15", updatedBy: "林承恩" },
  { societyId: "9",  societyName: "台灣泌尿科醫學會",     totalLimit: 50,  previousLimit: 48,  updatedAt: "2025/03/15", updatedBy: "林承恩" },
  { societyId: "10", societyName: "台灣神經科醫學會",     totalLimit: 65,  previousLimit: 65,  updatedAt: "2025/03/15", updatedBy: "林承恩" },
  { societyId: "11", societyName: "台灣精神醫學會",       totalLimit: 80,  previousLimit: 75,  updatedAt: "2025/03/15", updatedBy: "林承恩" },
  { societyId: "12", societyName: "台灣復健醫學會",       totalLimit: 45,  previousLimit: 45,  updatedAt: "2025/03/15", updatedBy: "林承恩" },
  { societyId: "13", societyName: "台灣麻醉醫學會",       totalLimit: 110, previousLimit: 100, updatedAt: "2025/03/15", updatedBy: "林承恩" },
  { societyId: "14", societyName: "台灣急診醫學會",       totalLimit: 70,  previousLimit: 70,  updatedAt: "2025/03/15", updatedBy: "林承恩" },
  { societyId: "15", societyName: "台灣家庭醫學會",       totalLimit: null, previousLimit: 85, updatedAt: null,         updatedBy: null },
  { societyId: "16", societyName: "台灣病理學會",         totalLimit: null, previousLimit: 30, updatedAt: null,         updatedBy: null },
  { societyId: "17", societyName: "台灣放射線醫學會",     totalLimit: 55,  previousLimit: 55,  updatedAt: "2025/03/15", updatedBy: "林承恩" },
  { societyId: "18", societyName: "台灣核醫學會",         totalLimit: 20,  previousLimit: 20,  updatedAt: "2025/03/15", updatedBy: "林承恩" },
  { societyId: "19", societyName: "台灣整形外科醫學會",   totalLimit: 35,  previousLimit: 30,  updatedAt: "2025/03/15", updatedBy: "林承恩" },
  { societyId: "20", societyName: "台灣職業醫學會",       totalLimit: null, previousLimit: 25, updatedAt: null,         updatedBy: null },
  { societyId: "21", societyName: "台灣老年醫學會",       totalLimit: 30,  previousLimit: 28,  updatedAt: "2025/03/15", updatedBy: "林承恩" },
  { societyId: "22", societyName: "台灣安寧緩和醫學會",   totalLimit: 15,  previousLimit: 15,  updatedAt: "2025/03/15", updatedBy: "林承恩" },
  { societyId: "23", societyName: "台灣重症醫學會",       totalLimit: 40,  previousLimit: 38,  updatedAt: "2025/03/15", updatedBy: "林承恩" },
]
