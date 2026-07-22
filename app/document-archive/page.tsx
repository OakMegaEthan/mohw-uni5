"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Eye, FileText, RotateCcw, Filter } from "lucide-react"
import { getDocumentArchiveMocks } from "@/lib/mock/document-archive"

export default function DocumentArchivePage() {
  const mockDocuments = getDocumentArchiveMocks()
  const [searchKeyword, setSearchKeyword] = useState("")
  const [sourceModule, setSourceModule] = useState<string>("all")
  const [documentType, setDocumentType] = useState<string>("all")
  const [society, setSociety] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [filteredDocs, setFilteredDocs] = useState(mockDocuments)

  const handleSearch = () => {
    let results = mockDocuments

    // 關鍵字搜尋
    if (searchKeyword) {
      results = results.filter(
        (doc) =>
          doc.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          doc.uploader.toLowerCase().includes(searchKeyword.toLowerCase()),
      )
    }

    // 來源模組篩選
    if (sourceModule !== "all") {
      results = results.filter((doc) => doc.source === sourceModule)
    }

    // 文件類型篩選
    if (documentType !== "all") {
      results = results.filter((doc) => doc.type === documentType)
    }

    // 狀態篩選
    if (status !== "all") {
      results = results.filter((doc) => doc.status === status)
    }

    // 日期區間篩選
    if (dateFrom) {
      results = results.filter((doc) => doc.uploadDate >= dateFrom)
    }
    if (dateTo) {
      results = results.filter((doc) => doc.uploadDate <= dateTo)
    }

    setFilteredDocs(results)
  }

  const handleReset = () => {
    setSearchKeyword("")
    setSourceModule("all")
    setDocumentType("all")
    setSociety("all")
    setStatus("all")
    setDateFrom("")
    setDateTo("")
    setSelectedDocs([])
    setFilteredDocs(mockDocuments)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocs(filteredDocs.map((doc) => doc.id))
    } else {
      setSelectedDocs([])
    }
  }

  const handleSelectDoc = (docId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocs([...selectedDocs, docId])
    } else {
      setSelectedDocs(selectedDocs.filter((id) => id !== docId))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "待審查":
        return "bg-yellow-100 text-yellow-800"
      case "審查中":
        return "bg-blue-100 text-blue-800"
      case "待公告":
        return "bg-orange-100 text-orange-800"
      case "已審查":
        return "bg-green-100 text-green-800"
      case "已公告":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">文件檢索專區</h1>
          <p className="text-gray-600">搜尋與管理系統中的所有文件與審查記錄</p>
        </div>

        {/* 搜尋區塊 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              搜尋與篩選
            </CardTitle>
            <CardDescription>使用關鍵字與篩選條件快速找到所需文件</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 關鍵字搜尋 */}
            <div className="space-y-2">
              <Label htmlFor="keyword">關鍵字搜尋</Label>
              <Input
                id="keyword"
                placeholder="輸入文件名稱或上傳者名稱..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            {/* 篩選條件 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">來源模組</Label>
                <Select value={sourceModule} onValueChange={setSourceModule}>
                  <SelectTrigger id="source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="文件填報審查">文件填報審查</SelectItem>
                    <SelectItem value="外加容額審查">外加容額審查</SelectItem>
                    <SelectItem value="容額填報審查">容額填報審查</SelectItem>
                    <SelectItem value="公告管理">公告管理</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">文件類型</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="甄審原則">甄審原則</SelectItem>
                    <SelectItem value="訓練醫院認定基準">訓練醫院認定基準</SelectItem>
                    <SelectItem value="訓練課程基準">訓練課程基準</SelectItem>
                    <SelectItem value="評核標準">評核標準</SelectItem>
                    <SelectItem value="容額分配原則">容額分配原則</SelectItem>
                    <SelectItem value="申請文件">申請文件</SelectItem>
                    <SelectItem value="審查記錄">審查記錄</SelectItem>
                    <SelectItem value="會議記錄">會議記錄</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="society">醫學會/醫院</Label>
                <Select value={society} onValueChange={setSociety}>
                  <SelectTrigger id="society">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="台灣內科醫學會">台灣內科醫學會</SelectItem>
                    <SelectItem value="台灣外科醫學會">台灣外科醫學會</SelectItem>
                    <SelectItem value="台灣婦產科醫學會">台灣婦產科醫學會</SelectItem>
                    <SelectItem value="台灣骨科醫學會">台灣骨科醫學會</SelectItem>
                    <SelectItem value="台灣眼科醫學會">台灣眼科醫學會</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">狀態</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="待審查">待審查</SelectItem>
                    <SelectItem value="審查中">審查中</SelectItem>
                    <SelectItem value="已審查">已審查</SelectItem>
                    <SelectItem value="待公告">待公告</SelectItem>
                    <SelectItem value="已公告">已公告</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 日期區間 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">上傳日期（起）</Label>
                <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">上傳日期（迄）</Label>
                <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSearch} className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                搜尋
              </Button>
              <Button variant="outline" onClick={handleReset} className="flex items-center gap-2 bg-transparent">
                <RotateCcw className="w-4 h-4" />
                重置
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 結果統計與批次操作 */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            共找到 <span className="font-semibold text-gray-900">{filteredDocs.length}</span> 個文件
            {selectedDocs.length > 0 && (
              <span className="ml-2">
                （已選取 <span className="font-semibold text-blue-600">{selectedDocs.length}</span> 個）
              </span>
            )}
          </div>
          {selectedDocs.length > 0 && (
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              批次下載 ({selectedDocs.length})
            </Button>
          )}
        </div>

        {/* 結果列表 */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedDocs.length === filteredDocs.length && filteredDocs.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>文件名稱</TableHead>
                  <TableHead>類型</TableHead>
                  <TableHead>來源模組</TableHead>
                  <TableHead>上傳者</TableHead>
                  <TableHead>上傳日期</TableHead>
                  <TableHead>檔案大小</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                      <Filter className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <div className="font-medium">未找到符合條件的文件</div>
                      <div className="text-sm">請嘗試調整搜尋條件</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDocs.includes(doc.id)}
                          onCheckedChange={(checked) => handleSelectDoc(doc.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{doc.type}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{doc.source}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{doc.uploader}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{doc.uploadDate}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{doc.fileSize}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(doc.status)}>
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
