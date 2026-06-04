"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X, Search, Plus, Building2, Combine } from "lucide-react"
import type { Hospital } from "@/components/filing/hospital-multi-select"

// 機構主體：可以是單一機構或合併主體
export interface InstitutionEntity {
  id: string
  type: "single" | "merged"
  // 單一機構
  hospitalCode?: string
  // 合併主體
  mergedName?: string
  mergedHospitalCodes?: string[]
  // 資格效期
  qualificationExpiry: string
  extensionYears: string
}

interface InstitutionEntitySelectorProps {
  hospitals: Hospital[]
  // 已選擇的主體列表
  entities: InstitutionEntity[]
  onEntitiesChange: (entities: InstitutionEntity[]) => void
  // 單一主體模式（單一機構申請的主訓機構只能有一個）
  singleMode?: boolean
  // 標籤
  label: string
  triggerLabel?: string
}

export function InstitutionEntitySelector({
  hospitals,
  entities,
  onEntitiesChange,
  singleMode = false,
  label,
  triggerLabel = "新增機構",
}: InstitutionEntitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<"select-type" | "select-hospitals">("select-type")
  const [entityType, setEntityType] = useState<"single" | "merged">("single")
  const [searchText, setSearchText] = useState("")
  const [selectedCounty, setSelectedCounty] = useState<string>("all")
  const [tempSelected, setTempSelected] = useState<string[]>([])
  const [mergedName, setMergedName] = useState("")
  const [qualificationExpiry, setQualificationExpiry] = useState("")
  const [extensionYears, setExtensionYears] = useState("0")
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null)

  // 提取所有縣市
  const counties = useMemo(() => {
    const unique = new Set(hospitals.map((h) => h.county).filter(Boolean))
    return Array.from(unique).sort()
  }, [hospitals])

  // 已被使用的醫院代碼（避免重複選擇）
  const usedHospitalCodes = useMemo(() => {
    const codes = new Set<string>()
    entities.forEach((entity) => {
      if (entity.type === "single" && entity.hospitalCode) {
        codes.add(entity.hospitalCode)
      } else if (entity.type === "merged" && entity.mergedHospitalCodes) {
        entity.mergedHospitalCodes.forEach((code) => codes.add(code))
      }
    })
    return codes
  }, [entities])

  // 根據搜尋和篩選過濾醫院
  const filteredHospitals = useMemo(() => {
    return hospitals.filter((h) => {
      const matchSearch =
        searchText === "" ||
        h.name.includes(searchText) ||
        h.code.includes(searchText)

      const matchCounty = selectedCounty === "all" || h.county === selectedCounty

      // 排除已被使用的醫院
      const notUsed = !usedHospitalCodes.has(h.code)

      return matchSearch && matchCounty && notUsed
    })
  }, [hospitals, searchText, selectedCounty, usedHospitalCodes])

  const handleToggle = (code: string) => {
    if (entityType === "single") {
      setTempSelected([code])
    } else {
      setTempSelected((prev) =>
        prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
      )
    }
  }

  const handleRemoveChip = (code: string) => {
    setTempSelected((prev) => prev.filter((c) => c !== code))
  }

  const resetForm = () => {
    setStep("select-type")
    setEntityType("single")
    setSearchText("")
    setSelectedCounty("all")
    setTempSelected([])
    setMergedName("")
    setQualificationExpiry("")
    setExtensionYears("0")
    setEditingEntityId(null)
  }

  const handleCancel = () => {
    resetForm()
    setIsOpen(false)
  }

  const handleSelectType = (type: "single" | "merged") => {
    setEntityType(type)
    setTempSelected([])
    setStep("select-hospitals")
  }

  const canConfirm = () => {
    if (entityType === "single") {
      return tempSelected.length === 1
    } else {
      return tempSelected.length >= 2 && mergedName.trim().length > 0
    }
  }

  const handleConfirm = () => {
    const newEntity: InstitutionEntity = {
      id: editingEntityId || `entity-${Date.now()}`,
      type: entityType,
      qualificationExpiry,
      extensionYears,
    }

    if (entityType === "single") {
      newEntity.hospitalCode = tempSelected[0]
    } else {
      newEntity.mergedName = mergedName.trim()
      newEntity.mergedHospitalCodes = tempSelected
    }

    if (editingEntityId) {
      // 編輯模式：更新現有機構的組成
      const updated = entities.map((ent) =>
        ent.id === editingEntityId ? newEntity : ent
      )
      onEntitiesChange(updated)
    } else if (singleMode) {
      // 新增模式（單一模式）
      onEntitiesChange([newEntity])
    } else {
      // 新增模式（多個）
      onEntitiesChange([...entities, newEntity])
    }

    resetForm()
    setIsOpen(false)
  }

  const handleRemoveEntity = (entityId: string) => {
    onEntitiesChange(entities.filter((e) => e.id !== entityId))
  }

  const getHospitalName = (code: string) =>
    hospitals.find((h) => h.code === code)?.name || code

  const getEntityDisplayName = (entity: InstitutionEntity) => {
    if (entity.type === "single" && entity.hospitalCode) {
      return getHospitalName(entity.hospitalCode)
    } else if (entity.type === "merged" && entity.mergedName) {
      return entity.mergedName
    }
    return ""
  }

  return (
    <div>
      <Label className="text-sm text-muted-foreground mb-2 block">
        {label} <span className="text-destructive">*</span>
      </Label>

      {/* 已選擇的機構列表 */}
      {entities.length > 0 && (
        <div className="space-y-3 mb-4">
          {entities.map((entity) => (
            <div
              key={entity.id}
              className="border rounded-lg bg-card p-4 space-y-3"
            >
              {/* 機構資訊 */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{getEntityDisplayName(entity)}</span>
                    {entity.type === "merged" && (
                      <Badge variant="secondary" className="text-xs">
                        {entity.mergedHospitalCodes?.length || 0} 機構
                      </Badge>
                    )}
                  </div>
                  {entity.type === "merged" && entity.mergedHospitalCodes && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {entity.mergedHospitalCodes.map((c) => getHospitalName(c)).join("、")}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveEntity(entity.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* 效期設定區塊 */}
              <div className="pt-3 border-t grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground block mb-1">
                    資格效期
                  </Label>
                  <Input
                    size="sm"
                    value={entity.qualificationExpiry}
                    onChange={(e) => {
                      const updated = entities.map((ent) =>
                        ent.id === entity.id
                          ? { ...ent, qualificationExpiry: e.target.value }
                          : ent
                      )
                      onEntitiesChange(updated)
                    }}
                    placeholder="115/7/31"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground block mb-1">
                    延長效期
                  </Label>
                  <Select
                    value={entity.extensionYears}
                    onValueChange={(value) => {
                      const updated = entities.map((ent) =>
                        ent.id === entity.id
                          ? { ...ent, extensionYears: value }
                          : ent
                      )
                      onEntitiesChange(updated)
                    }}
                  >
                    <SelectTrigger className="text-sm h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">不延長</SelectItem>
                      <SelectItem value="1">1 年</SelectItem>
                      <SelectItem value="2">2 年</SelectItem>
                      <SelectItem value="3">3 年</SelectItem>
                      <SelectItem value="4">4 年</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 編輯機構按鈕 */}
              {entity.type === "merged" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingEntityId(entity.id)
                    setEntityType(entity.type)
                    setMergedName(entity.mergedName || "")
                    setTempSelected(entity.mergedHospitalCodes || [])
                    setQualificationExpiry(entity.qualificationExpiry)
                    setExtensionYears(entity.extensionYears)
                    setStep("select-hospitals")
                    setIsOpen(true)
                  }}
                  className="w-full"
                >
                  編輯機構
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 新增按鈕 */}
      {(!singleMode || entities.length === 0) && (
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {triggerLabel}
        </Button>
      )}

      {/* 選擇 Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>
              {step === "select-type" && "選擇機構類型"}
              {step === "select-hospitals" && entityType === "single" && "選擇機構"}
              {step === "select-hospitals" && entityType === "merged" && editingEntityId ? "編輯機構組合" : "建立機構組合"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Step 1: 選擇類型 */}
            {step === "select-type" && (
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-6">
                  請選擇要新增的機構類型
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleSelectType("single")}
                    className="flex flex-col items-center gap-3 p-6 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                    <div className="text-center">
                      <div className="font-medium">單一機構</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        選擇一間醫療機構
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectType("merged")}
                    className="flex flex-col items-center gap-3 p-6 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Combine className="h-10 w-10 text-muted-foreground" />
                    <div className="text-center">
                      <div className="font-medium">機構組合</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        將多間機構組合成一個
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: 選擇醫院 */}
            {step === "select-hospitals" && (
              <div className="space-y-4">
                {/* 合併名稱輸入（合併時） */}
                {entityType === "merged" && (
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      機構組合名稱 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={mergedName}
                      onChange={(e) => setMergedName(e.target.value)}
                      placeholder="例如：高雄聯合訓練中心"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      此名稱將顯示於容額列表的「醫院名稱」欄位
                    </p>
                  </div>
                )}

                {/* 搜尋列 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜尋醫院名稱或機構代碼"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* 縣市篩選 */}
                {counties.length > 0 && (
                  <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="選擇縣市" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部縣市</SelectItem>
                      {counties.map((county) => (
                        <SelectItem key={county} value={county || ""}>
                          {county}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* 醫院列表 - 限制高度便於滾動 */}
                <div className="border rounded-lg max-h-[240px] overflow-y-auto bg-muted/20">
                  <div className="divide-y">
                    {filteredHospitals.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        沒有找到符合條件的醫院
                      </div>
                    ) : (
                      filteredHospitals.map((hospital) => (
                        <div
                          key={hospital.code}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleToggle(hospital.code)}
                        >
                          <Checkbox
                            checked={tempSelected.includes(hospital.code)}
                            onCheckedChange={() => handleToggle(hospital.code)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{hospital.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {hospital.code}
                              {hospital.county && ` • ${hospital.county}`}
                              {hospital.district && ` ${hospital.district}`}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 已選區 */}
                {tempSelected.length > 0 && (
                  <div className="bg-muted/20 rounded-lg p-3">
                    <div className="text-xs font-medium mb-2 text-muted-foreground">
                      已選擇 ({tempSelected.length})
                      {entityType === "merged" && tempSelected.length < 2 && (
                        <span className="text-destructive ml-2">需選擇 2 間以上</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tempSelected.map((code) => (
                        <Badge key={code} variant="secondary" className="gap-1 pr-1 text-xs">
                          {getHospitalName(code)}
                          <button
                            onClick={() => handleRemoveChip(code)}
                            className="ml-1 hover:bg-muted rounded"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 資格效期設定 - 保證可見 */}
                {tempSelected.length > 0 && (entityType === "single" || tempSelected.length >= 2) && (
                  <div className="bg-primary/5 rounded-lg p-4 space-y-3 border border-primary/20">
                    <p className="text-sm font-medium">設定資格效期</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">
                          資格效期
                        </Label>
                        <Input
                          value={qualificationExpiry}
                          onChange={(e) => setQualificationExpiry(e.target.value)}
                          placeholder="115/7/31"
                          className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          例如：115/7/31
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">
                          延長效期
                        </Label>
                        <Select value={extensionYears} onValueChange={setExtensionYears}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">不延長</SelectItem>
                            <SelectItem value="1">1 年</SelectItem>
                            <SelectItem value="2">2 年</SelectItem>
                            <SelectItem value="3">3 年</SelectItem>
                            <SelectItem value="4">4 年</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t gap-2">
            {step === "select-hospitals" && (
              <Button variant="ghost" onClick={() => setStep("select-type")}>
                上一步
              </Button>
            )}
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
            {step === "select-hospitals" && (
              <Button onClick={handleConfirm} disabled={!canConfirm()}>
                確認新增
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
