"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { ExpenseReportView } from './components/expense-report-view';
import { BudgetReportView } from './components/budget-report-view';
import { ConsolidatedReportView } from './components/consolidated-report-view';
import { ReportFilters } from './components/report-filters';
import { useReports } from '@/hooks/use-reports';
import type { ReportFilter } from '@/hooks/use-reports';
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('consolidated');
  const [filters, setFilters] = useState<ReportFilter>({
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // 이번 달 시작
    dateTo: new Date(), // 오늘
    branchIds: [],
    departmentIds: [],
    categories: [],
    userIds: []
  });
  const { loading } = useReports();
  const handleFiltersChange = (newFilters: ReportFilter) => {
    setFilters(newFilters);
  };
  const formatDateRange = (from: Date, to: Date) => {
    return `${from.toLocaleDateString('ko-KR')} ~ ${to.toLocaleDateString('ko-KR')}`;
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">리포트 및 분석</h1>
          <p className="text-muted-foreground mt-1">
            비용, 예산, 구매 데이터를 종합적으로 분석합니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDateRange(filters.dateFrom, filters.dateTo)}
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            전체 내보내기
          </Button>
        </div>
      </div>
      {/* 필터 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            리포트 필터
          </CardTitle>
          <CardDescription>
            분석할 데이터의 범위와 조건을 설정합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportFilters 
            filters={filters}
            onChange={handleFiltersChange}
          />
        </CardContent>
      </Card>
      {/* 빠른 통계 */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 비용</p>
                <p className="text-2xl font-bold">₩0</p>
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  전월 대비
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">예산 사용률</p>
                <p className="text-2xl font-bold">0%</p>
                <p className="text-xs text-green-600">
                  평균 사용률
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">승인 대기</p>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-yellow-600">
                  처리 필요
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">완료율</p>
                <p className="text-2xl font-bold">0%</p>
                <p className="text-xs text-purple-600">
                  이번 달
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* 메인 리포트 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="consolidated" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            통합 리포트
          </TabsTrigger>
          <TabsTrigger value="expense" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            비용 분석
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            예산 분석
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            맞춤 리포트
          </TabsTrigger>
        </TabsList>
        <TabsContent value="consolidated" className="mt-6">
          <ConsolidatedReportView filters={filters} />
        </TabsContent>
        <TabsContent value="expense" className="mt-6">
          <ExpenseReportView filters={filters} />
        </TabsContent>
        <TabsContent value="budget" className="mt-6">
          <BudgetReportView filters={filters} />
        </TabsContent>
        <TabsContent value="custom" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                맞춤 리포트
              </CardTitle>
              <CardDescription>
                사용자 정의 리포트를 생성합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">맞춤 리포트 기능은 준비 중입니다.</p>
                <Button variant="outline" className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  곧 출시 예정
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
