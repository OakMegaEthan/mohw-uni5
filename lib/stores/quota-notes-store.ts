/**
 * 容額填報備註的 module-level store（mock 用途）
 * 因為是 singleton，整個 session 期間資料會保留；頁面間導航不會丟失。
 */
export const quotaNotesStore = {
  /** key = hospital id (string)，value = 備註內容 */
  hospitalNotes: {
    // Demo 資料：展示自動帶入備註的效果
    "1": "台大醫院本年度申請新增合作醫院，實際容額上限請依最新核定公文為準。",
    "4": "馬偕紀念醫院主訓醫師異動，已補件說明，請審查時參照補充文件。",
  } as Record<string, string>,
}
