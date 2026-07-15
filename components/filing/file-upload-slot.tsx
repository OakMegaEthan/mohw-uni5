import { Button } from "@/components/ui/button"
import { Upload, FileText, X, CheckCircle2 } from "lucide-react"

export interface FileUploadSlotConfig {
  key: string
  label: string
  description?: string
  required?: boolean
}

interface FileUploadSlotProps {
  config: FileUploadSlotConfig
  // 整個上傳區是否停用（例如尚未選擇「變更」，或選擇「不變更」）
  disabled?: boolean
  // 已上傳的檔名（有值代表已上傳）
  fileName?: string
  // 上傳（原型為 mock：帶入模擬檔名）；未提供則不顯示上傳按鈕（唯讀檢視）
  onUpload?: () => void
  // 移除已上傳檔案；未提供則不顯示移除按鈕（唯讀檢視）
  onRemove?: () => void
}

/**
 * 單一檔案上傳區塊。供「單主文件上傳」與「評核標準與評核表」版型共用。
 * 受控元件：由父層管理是否停用、是否已上傳與檔名。
 */
export function FileUploadSlot({ config, disabled = false, fileName, onUpload, onRemove }: FileUploadSlotProps) {
  const uploaded = Boolean(fileName)

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-start gap-2">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-base font-medium text-foreground">
            {config.label}
            {config.required && <span className="ml-1 text-destructive">*</span>}
          </p>
          {config.description && <p className="mt-0.5 text-sm text-muted-foreground">{config.description}</p>}
        </div>
      </div>

      {uploaded ? (
        // 已上傳：顯示檔名與操作
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
            <span className="truncate text-base text-foreground">{fileName}</span>
          </div>
          {(onUpload || onRemove) && (
            <div className="flex shrink-0 items-center gap-2">
              {onUpload && (
                <Button variant="outline" size="sm" onClick={onUpload} disabled={disabled}>
                  重新上傳
                </Button>
              )}
              {onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  disabled={disabled}
                  className="gap-1 text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                  移除
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        // 未上傳：拖曳區
        <div
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center ${
            disabled ? "border-border/60 bg-muted/20 opacity-60" : "border-border bg-muted/30"
          }`}
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">拖曳檔案至此，或點擊下方按鈕選擇檔案</p>
          <p className="text-xs text-muted-foreground">支援 Word、PDF 格式，單檔上限 20MB</p>
          {onUpload && (
            <Button variant="outline" size="sm" className="mt-2 gap-2" disabled={disabled} onClick={onUpload}>
              <Upload className="h-4 w-4" />
              選擇檔案
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
