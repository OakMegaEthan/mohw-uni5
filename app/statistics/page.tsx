"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { FileDown, ClipboardList, FileCheck, CheckCircle2, Megaphone } from "lucide-react"
import { useState } from "react"

export default function StatisticsPage() {
  const [selectedExports, setSelectedExports] = useState({
    submissions: true,
    additionalQuota: true,
    hospitalQuota: true,
    announcements: true,
  })

  // Mock data for overview cards
  const overviewStats = [
    { label: "待審查", count: 23, icon: ClipboardList, color: "bg-yellow-500" },
    { label: "審查中", count: 15, icon: FileCheck, color: "bg-blue-500" },
    { label: "已完成", count: 45, icon: CheckCircle2, color: "bg-green-500" },
    { label: "已公告", count: 38, icon: Megaphone, color: "bg-purple-500" },
  ]

  // Mock data for submission review progress
  const submissionProgress = [
    { name: "甄審原則", completed: 4, total: 5, percentage: 80 },
    { name: "訓練醫院認定基準", completed: 12, total: 20, percentage: 60 },
    { name: "訓練課程基準", completed: 12, total: 20, percentage: 60 },
    { name: "評核標準", completed: 10, total: 20, percentage: 50 },
    { name: "容額分配原則", completed: 10, total: 20, percentage: 50 },
  ]

  // Mock data for monthly trend
  const monthlyTrend = [
    { month: "1月", 審查完成: 12, 公告發布: 8 },
    { month: "2月", 審查完成: 15, 公告發布: 10 },
    { month: "3月", 審查完成: 18, 公告發布: 14 },
    { month: "4月", 審查完成: 14, 公告發布: 12 },
    { month: "5月", 審查完成: 20, 公告發布: 15 },
    { month: "6月", 審查完成: 22, 公告發布: 18 },
  ]

  // Mock data for review results
  const reviewResults = [
    { name: "通過", value: 156, color: "#10b981" },
    { name: "補件", value: 42, color: "#f59e0b" },
    { name: "不通過", value: 18, color: "#ef4444" },
  ]

  // Mock data for societies progress
  const societiesProgress = [
    { society: "台灣內科醫學會", progress: 100 },
    { society: "台灣外科醫學會", progress: 90 },
    { society: "台灣兒科醫學會", progress: 85 },
    { society: "台灣婦產科醫學會", progress: 75 },
    { society: "台灣骨科醫學會", progress: 70 },
    { society: "台灣眼科醫學會", progress: 65 },
    { society: "台灣耳鼻喉科醫學會", progress: 60 },
    { society: "台灣皮膚科醫學會", progress: 55 },
  ]

  const COLORS = ["#10b981", "#f59e0b", "#ef4444"]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">統計專區</h1>
          <p className="text-muted-foreground mt-1">檢視系統整體統計數據與匯出報表</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold mt-2">{stat.count}</p>
                    </div>
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Module Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Submission Review Progress */}
          <Card>
            <CardHeader>
              <CardTitle>文件填報審查進度</CardTitle>
              <CardDescription>各類文件填報完成狀況</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {submissionProgress.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">{item.name}</span>
                    <span className="text-muted-foreground">
                      {item.completed}/{item.total}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Additional Quota Overview */}
          <Card>
            <CardHeader>
              <CardTitle>外加容額審查概況</CardTitle>
              <CardDescription>外加容額申請與審查統計</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">總申請數</span>
                <span className="text-2xl font-bold">125</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">待審查</span>
                <span className="font-semibold text-yellow-600">23 件</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">待公告</span>
                <span className="font-semibold text-blue-600">15 件</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">已公告</span>
                <span className="font-semibold text-green-600">87 件</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t pt-3">
                <span className="text-muted-foreground">通過率</span>
                <span className="text-xl font-bold text-green-600">68.5%</span>
              </div>
            </CardContent>
          </Card>

          {/* Hospital Quota Overview */}
          <Card>
            <CardHeader>
              <CardTitle>醫院容額分配概況</CardTitle>
              <CardDescription>醫院容額審查進度統計</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">總醫學會數</span>
                <span className="text-2xl font-bold">23</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">待審查</span>
                <span className="font-semibold text-yellow-600">5 個</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">RRC 審查中</span>
                <span className="font-semibold text-blue-600">8 個</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">待公告</span>
                <span className="font-semibold text-purple-600">3 個</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">已公告</span>
                <span className="font-semibold text-green-600">7 個</span>
              </div>
            </CardContent>
          </Card>

          {/* Announcement Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>公告統計</CardTitle>
              <CardDescription>各類別公告發布數量</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">專科訓練認定</span>
                <span className="font-semibold">45 則</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">外加容額</span>
                <span className="font-semibold">32 則</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">甄審</span>
                <span className="font-semibold">28 則</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t pt-3">
                <span className="text-muted-foreground">本月發布</span>
                <span className="text-xl font-bold text-blue-600">12 則</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Societies Progress Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>各醫學會審查進度</CardTitle>
              <CardDescription>文件填報審查完成百分比</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={societiesProgress} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="society" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="progress" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Review Results Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>審查結果分布</CardTitle>
              <CardDescription>通過、補件與不通過比例</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reviewResults}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reviewResults.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>月度審查趨勢</CardTitle>
            <CardDescription>審查完成與公告發布數量走勢</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="審查完成" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="公告發布" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle>匯出統計報表</CardTitle>
            <CardDescription>選擇要匯出的統計項目並下載報表</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="submissions"
                  checked={selectedExports.submissions}
                  onCheckedChange={(checked) =>
                    setSelectedExports((prev) => ({ ...prev, submissions: checked as boolean }))
                  }
                />
                <Label htmlFor="submissions" className="cursor-pointer">
                  文件填報審查統計
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="additionalQuota"
                  checked={selectedExports.additionalQuota}
                  onCheckedChange={(checked) =>
                    setSelectedExports((prev) => ({ ...prev, additionalQuota: checked as boolean }))
                  }
                />
                <Label htmlFor="additionalQuota" className="cursor-pointer">
                  外加容額審查統計
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hospitalQuota"
                  checked={selectedExports.hospitalQuota}
                  onCheckedChange={(checked) =>
                    setSelectedExports((prev) => ({ ...prev, hospitalQuota: checked as boolean }))
                  }
                />
                <Label htmlFor="hospitalQuota" className="cursor-pointer">
                  容額填報審查統計
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="announcements"
                  checked={selectedExports.announcements}
                  onCheckedChange={(checked) =>
                    setSelectedExports((prev) => ({ ...prev, announcements: checked as boolean }))
                  }
                />
                <Label htmlFor="announcements" className="cursor-pointer">
                  公告統計
                </Label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button className="flex-1">
                <FileDown className="w-4 h-4 mr-2" />
                匯出 PDF
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                <FileDown className="w-4 h-4 mr-2" />
                匯出 Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
