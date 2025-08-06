"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Receipt, 
  Calendar, 
  BarChart3,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Building
} from 'lucide-react';
import { ExpenseInputForm } from './components/expense-input-form';
import { FixedCostTemplate } from './components/fixed-cost-template';
import { ExpenseList } from './components/expense-list';
import { ExpenseCharts } from './components/expense-charts';
import { useSimpleExpenses } from '@/hooks/use-simple-expenses';
import { useAuth } from '@/hooks/use-auth';
import { useBranches } from '@/hooks/use-branches';
import { useEffect } from 'react';
import { 
  SIMPLE_EXPENSE_CATEGORY_LABELS,
  formatCurrency,
  getCategoryColor
} from '@/types/simple-expense';

export default function SimpleExpensesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('charts');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  
  const { expenses, fetchExpenses, calculateStats } = useSimpleExpenses();
  const { user } = useAuth();
  const { branches } = useBranches();

  // 관리자 여부 확인
  const isAdmin = user?.role === '본사 관리자' || user?.role === '가맹점 관리자';
  
  // 본사 관리자 여부 확인 (본사 관리 버튼용)
  const isHQManager = user?.role === '본사 관리자';

  // 성공 시 새로고침
  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    const branchId = selectedBranchId || (user?.franchise ? branches.find(b => b.name === user.franchise)?.id : '');
    if (branchId) {
      fetchExpenses({ branchId });
    }
  };

  // 지점 변경 처리
  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    fetchExpenses({ branchId });
  };

  // 현재 선택된 지점 정보
  const currentBranchId = selectedBranchId || (user?.franchise ? branches.find(b => b.name === user.franchise)?.id : '') || '';
  const currentBranch = branches.find(b => b.id === currentBranchId);

  // 이번 달 지출 계산
  const thisMonthExpenses = expenses.filter(expense => {
    if (!expense.date) return false;
    const expenseDate = expense.date.toDate();
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && 
           expenseDate.getFullYear() === now.getFullYear();
  });

  const thisMonthStats = calculateStats(thisMonthExpenses);

  // 오늘 지출 계산
  const todayExpenses = expenses.filter(expense => {
    if (!expense.date) return false;
    const expenseDate = expense.date.toDate();
    const today = new Date();
    return expenseDate.toDateString() === today.toDateString();
  });

  const todayTotal = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  // 초기 데이터 로드
  useEffect(() => {
    if (!isAdmin && user?.franchise) {
      // 일반 사용자는 자신의 지점만
      const userBranch = branches.find(b => b.name === user.franchise);
      if (userBranch) {
        setSelectedBranchId(userBranch.id);
        fetchExpenses({ branchId: userBranch.id });
      }
    } else if (isAdmin && branches.length > 0) {
      // 관리자는 첫 번째 지점 선택
      const firstBranch = branches.find(b => b.type !== '본사') || branches[0];
      if (firstBranch) {
        setSelectedBranchId(firstBranch.id);
        fetchExpenses({ branchId: firstBranch.id });
      }
    }
  }, [user, branches, isAdmin, fetchExpenses]);

  // 본사 관리 탭이 활성화되면 모든 지점 데이터 로드
  useEffect(() => {
    if (activeTab === 'headquarters' && isAdmin) {
      // 본사 관리 탭에서는 모든 지점 데이터를 로드하지 않고
      // ExpenseList 컴포넌트에서 처리하도록 함
    }
  }, [activeTab, isAdmin]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">간편 지출 관리</h1>
          <p className="text-muted-foreground">
            {currentBranch?.name || '지점'}의 모든 지출을 쉽고 빠르게 관리하세요
          </p>
        </div>
        
        {/* 지점 선택 드롭다운 (관리자만) */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedBranchId} onValueChange={handleBranchChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="지점 선택" />
              </SelectTrigger>
              <SelectContent>
                {branches.map(branch => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 지출</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayTotal)}</div>
            <p className="text-xs text-muted-foreground">
              {todayExpenses.length}건
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 지출</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(thisMonthStats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {thisMonthExpenses.length}건
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">주요 분류</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {thisMonthStats.categoryBreakdown.length > 0 ? (
              <div>
                <div className="text-2xl font-bold">
                  {SIMPLE_EXPENSE_CATEGORY_LABELS[thisMonthStats.categoryBreakdown[0].category]}
                </div>
                <p className="text-xs text-muted-foreground">
                  {thisMonthStats.categoryBreakdown[0].percentage.toFixed(1)}%
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">데이터 없음</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">주요 구매처</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {thisMonthStats.topSuppliers.length > 0 ? (
              <div>
                <div className="text-2xl font-bold truncate">
                  {thisMonthStats.topSuppliers[0].name}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(thisMonthStats.topSuppliers[0].amount)}
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">데이터 없음</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 이번 달 카테고리별 요약 */}
      {thisMonthStats.categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">이번 달 분류별 지출</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {thisMonthStats.categoryBreakdown.map((category) => (
                <div key={category.category} className="flex items-center gap-2">
                  <Badge 
                    variant="outline"
                    className={`border-${getCategoryColor(category.category)}-500`}
                  >
                    {SIMPLE_EXPENSE_CATEGORY_LABELS[category.category]}
                  </Badge>
                  <span className="text-sm font-medium">
                    {formatCurrency(category.amount)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({category.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

             {/* 메인 탭 */}
       <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
         <TabsList className="grid w-full grid-cols-5">
           <TabsTrigger value="input" className="flex items-center gap-2">
             <Plus className="h-4 w-4" />
             지출 입력
           </TabsTrigger>
           <TabsTrigger value="fixed" className="flex items-center gap-2">
             <Calendar className="h-4 w-4" />
             고정비 관리
           </TabsTrigger>
           <TabsTrigger value="list" className="flex items-center gap-2">
             <Receipt className="h-4 w-4" />
             지출 내역
           </TabsTrigger>
           <TabsTrigger value="charts" className="flex items-center gap-2">
             <BarChart3 className="h-4 w-4" />
             차트 분석
           </TabsTrigger>
           {isHQManager && (
             <TabsTrigger value="headquarters" className="flex items-center gap-2">
               <Building className="h-4 w-4" />
               본사 관리
             </TabsTrigger>
           )}
         </TabsList>
        
        <TabsContent value="input">
          <ExpenseInputForm 
            onSuccess={handleSuccess}
            continueMode={true}
            selectedBranchId={currentBranchId}
            selectedBranchName={currentBranch?.name || ''}
          />
        </TabsContent>
        
        <TabsContent value="fixed">
          <FixedCostTemplate 
            onSuccess={handleSuccess} 
          />
        </TabsContent>
        
                 <TabsContent value="list">
           <ExpenseList 
             refreshTrigger={refreshTrigger} 
             selectedBranchId={currentBranchId}
           />
         </TabsContent>

         <TabsContent value="charts">
           <ExpenseCharts 
             expenses={expenses}
             currentBranchName={currentBranch?.name || ''}
           />
         </TabsContent>

         {isHQManager && (
           <TabsContent value="headquarters">
             <ExpenseList 
               refreshTrigger={refreshTrigger} 
               selectedBranchId={currentBranchId}
               isHeadquarters={true}
             />
           </TabsContent>
         )}
      </Tabs>
    </div>
  );
}