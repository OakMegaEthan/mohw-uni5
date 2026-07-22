/**
 * 設計系統規範
 * 
 * 此檔案定義系統的核心設計 tokens 與元件規範
 * 區分為「核心規範（CORE）」與「建議規範（RECOMMENDED）」
 * 
 * 核心規範：不應被違反，除非有充分理由且已與產品經理確認
 * 建議規範：預設方案，可根據特定需求彈性調整
 */

// ============================================================================
// 字級規範（Typography）
// ============================================================================

export const TYPOGRAPHY = {
  // 核心規範：最小字級
  CORE: {
    minFontSize: "16px", // 1rem - 不可再小
    minTailwind: "text-base",
    description: "正文、表格內容、按鈕的最小字級。絕不使用 text-xs（12px）或 text-sm（14px）在主要內容區",
  },
  
  // 建議規範：其他字級配置
  RECOMMENDED: {
    fontSizes: {
      xs: { size: "14px", tailwind: "text-sm", usage: "僅用於時間戳記、版本號等極小輔助資訊（允許例外）" },
      base: { size: "16px", tailwind: "text-base", usage: "正文、表格、按鈕、標籤、小卡片標題" },
      lg: { size: "18px", tailwind: "text-lg", usage: "卡片標題、表單標籤、區塊副標題" },
      xl: { size: "20px", tailwind: "text-xl", usage: "頁面副標題、對話框標題" },
      "2xl": { size: "24px", tailwind: "text-2xl", usage: "頁面主標題" },
    },
    lineHeight: {
      base: "1.5", // leading-relaxed
      relaxed: "1.6", // leading-7
      comfortable: "1.8", // leading-8
    },
  },
} as const;

// ============================================================================
// 容器寬度規範（Container）
// ============================================================================

export const CONTAINER = {
  // 核心規範：統一頁面寬度
  CORE: {
    maxWidth: "1152px", // max-w-6xl
    tailwindClass: "max-w-6xl",
    description: "所有主要頁面（列表、詳情、管理）的統一寬度",
  },
  
  // 建議規範：其他寬度配置
  RECOMMENDED: {
    narrow: { maxWidth: "896px", tailwindClass: "max-w-4xl", usage: "表單頁面、單欄內容" },
    standard: { maxWidth: "1152px", tailwindClass: "max-w-6xl", usage: "列表、儀表板、多欄內容" },
    wide: { maxWidth: "1280px", tailwindClass: "max-w-7xl", usage: "數據密集頁面、複雜表格" },
    fullWidth: { maxWidth: "100%", tailwindClass: "w-full", usage: "特殊情境需充分理由" },
  },
  
  // 核心規範：頁面內邊距
  CORE_PADDING: {
    vertical: "py-6", // 24px
    horizontal: "px-6", // 24px
    description: "所有頁面的上下左右統一內邊距",
  },
} as const;

// ============================================================================
// 間距規範（Spacing）
// ============================================================================

export const SPACING = {
  // 建議規範：卡片與元件間距
  RECOMMENDED: {
    cardGap: "gap-4", // 16px - 卡片之間的間距
    cardPaddingCompact: "p-4", // 16px - 卡片內部留白（緊湊）
    cardPaddingComfortable: "p-5", // 20px - 卡片內部留白（舒適）
    sectionSpacing: "space-y-6", // 24px - 版塊之間的間距
    elementGap: "gap-2", // 8px - 元素之間的間距
  },
} as const;

// ============================================================================
// 導航規範（Navigation）
// ============================================================================

export const NAVIGATION = {
  // 核心規範：頂層結構
  CORE: {
    hasSecondaryNav: false,
    description: "一級導航（填報專區、審查專區、管理專區）之下無第二層導航",
  },
  
  // 核心規範：頁面導航
  CORE_PAGE: {
    showBackButton: "topLevelOnly", // 僅在子頁面顯示
    description: "頂層功能頁（/filing、/admin/user-management）不顯示『返回首頁』，子頁面顯示『返回上一頁』",
  },
} as const;

// ============================================================================
// 卡片與元件規範（Cards & Components）
// ============================================================================

export const COMPONENTS = {
  // 建議規範：公告卡片
  ANNOUNCEMENTS: {
    padding: "p-4", // 16px 而非 24px
    gap: "gap-3", // 卡片間距 12px
    rowHeight: "h-auto", // 不固定高度
    minHeight: "min-h-24", // 最小高度 96px
    description: "減少內部留白、增加卡片視覺緊湊性、避免過大間距",
  },
  
  // 建議規範：表格
  TABLES: {
    rowHeight: "h-14", // 56px - 增加可點擊面積
    cellPadding: "px-4 py-3", // 單位格內邊距
    fontSize: "text-base", // 16px
    description: "統一表格行高、字級、內邊距，提升可讀性",
  },
  
  // 建議規範：Tabs 元件
  TABS: {
    defaultStyle: "underline", // 下劃線樣式為預設
    description: "系統內所有 Tabs 預設使用下劃線樣式（除非有特殊需求說明）",
  },
  
  // 建議規範：Badge 與標籤
  BADGES: {
    size: "text-base px-2.5 py-1", // 統一大小
    description: "所有徽章/標籤使用統一大小與間距",
  },
} as const;

// ============================================================================
// 配色系統（Color System）
// ============================================================================

export const COLORS = {
  primary: "#0066FF", // 藍色
  success: "#10B981", // 綠色
  warning: "#F59E0B", // 琥珀色
  danger: "#EF4444", // 紅色
  info: "#3B82F6", // 淺藍色
  
  neutral: {
    background: "#F9FAFB", // 淺灰背景
    border: "#E5E7EB", // 邊框灰
    text: "#1F2937", // 正文黑
    textMuted: "#6B7280", // 次要文字灰
  },
} as const;

// ============================================================================
// 元件擴展指南（Extension Guidelines）
// ============================================================================

export const EXTENSION_GUIDELINES = {
  description: "未來開發新元件或調整現有元件時應遵守的原則",
  
  rules: [
    "1. 新元件應首先評估現有元件是否可透過 variant/props 擴展滿足需求",
    "2. 若需要新元件，應預留 className、variant、size 等擴展接口",
    "3. 任何對核心規範的偏離必須有充分理由且已獲確認",
    "4. 新樣式應優先使用 design-system.ts 中定義的 tokens，避免硬編碼",
    "5. 修改設計規範前必須與產品經理討論與確認",
  ],
} as const;
