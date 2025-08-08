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
import { useUserRole } from '@/hooks/use-user-role';
import { useEffect, useMemo } from 'react';
import { 
  SIMPLE_EXPENSE_CATEGORY_LABELS,
  formatCurrency,
  getCategoryColor
} from '@/types/simple-expense';
export default function SimpleExpensesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('charts');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const { expenses, fetchExpenses, calculateStats } = useSimpleExpenses();
  const { user } = useAuth();
  const { branches } = useBranches();
  // 관리자 여부 확인 (user?.role 직접 사용)
  const isAdmin = user?.role === '본사 관리자';
  const isHQManager = user?.role === '본사 관리자';
  // 데이터 업데이트 함수
  const updateEmptyBranchIds = async () => {
    try {
      // 릴리맥광화문점의 branchId 찾기
      const gwanghwamunBranch = branches.find(b => b.name === '릴리맥광화문점');
      if (!gwanghwamunBranch) {
        console.error('릴리맥광화문점을 찾을 수 없습니다.');
        return;
      }
      const { collection, getDocs, updateDoc, doc, query, where } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      // 빈 branchId를 가진 지출 데이터 찾기
      const expensesRef = collection(db, 'simpleExpenses');
      const q = query(expensesRef, where('branchId', '==', ''));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return;
      }
      // 배치 업데이트
      const batch = [];
      snapshot.docs.forEach((docSnapshot) => {
        batch.push(updateDoc(docSnapshot.ref, { branchId: gwanghwamunBranch.id }));
      });
      await Promise.all(batch);
      // 데이터 새로고침
      fetchExpenses();
    } catch (error) {
      console.error('데이터 업데이트 오류:', error);
    }
  };
  
  // 디버깅을 위한 로그
  console.log({
    uniqueBranchIds: expenses.map(e => e.branchId).filter((id, index, arr) => arr.indexOf(id) === index), // 고유한 branchId들
    branchesInfo: branches.map(b => ({ id: b.id, name: b.name, type: b.type })), // 지점 정보
    emptyBranchIdCount: expenses.filter(e => !e.branchId || e.branchId === '').length, // 빈 branchId 개수
    nonEmptyBranchIdCount: expenses.filter(e => e.branchId && e.branchId !== '').length // 비어있지 않은 branchId 개수
  });
  // 사용자가 볼 수 있는 지점 목록
  const availableBranches = useMemo(() => {
    if (isAdmin) {
      return branches; // 본사 관리자는 모든 지점을 볼 수 있음
    } else {
      return branches.filter(branch => branch.name === user?.franchise); // 지점 직원은 자신의 지점만
    }
  }, [branches, isAdmin, user?.franchise]);
  // 자동 지점 필터링 (지점 직원은 자동으로 자신의 지점으로 설정)
  useEffect(() => {
    if (!isAdmin && user?.franchise && selectedBranchId === 'all') {
      const userBranch = branches.find(b => b.name === user.franchise);
      if (userBranch) {
        setSelectedBranchId(userBranch.id);
      }
    }
  }, [isAdmin, user?.franchise, selectedBranchId, branches]);
  // 성공 시 새로고침
  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    // 전체 데이터 새로고침 (지점 필터 없이)
    fetchExpenses();
  };
  // 지점 변경 처리
  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    if (branchId === 'all') {
      fetchExpenses(); // 전체 데이터 로드
    } else {
      // 본사 지점을 선택한 경우 본사 데이터만 로드
      const selectedBranch = branches.find(b => b.id === branchId);
      if (selectedBranch?.type === '본사') {
        fetchExpenses({ branchId }); // 본사 지점 선택 시 본사 데이터만
      } else {
        fetchExpenses({ branchId }); // 일반 지점 선택 시 해당 지점만
      }
    }
  };
  // 현재 선택된 지점 정보
  const currentBranchId = selectedBranchId === 'all' ? '' : selectedBranchId;
  const currentBranch = branches.find(b => b.id === currentBranchId);
  // 필터링된 지출 데이터
  const filteredExpenses = useMemo(() => {
    if (selectedBranchId === 'all') {
      return expenses; // 전체 선택 시 모든 데이터 표시
    }
    // 본사 지점을 선택한 경우 본사 데이터만 표시 (빈 branchId도 포함)
    const selectedBranch = branches.find(b => b.id === selectedBranchId);
    if (selectedBranch?.type === '본사') {
      return expenses.filter(expense => 
        expense.branchId === selectedBranchId || 
        !expense.branchId || 
        expense.branchId === ''
      );
    }
    return expenses.filter(expense => expense.branchId === selectedBranchId);
  }, [expenses, selectedBranchId, branches]);
  // 이번 달 지출 계산 (현자 지점만)
  const thisMonthExpenses = filteredExpenses.filter(expense => {
    if (!expense.date) return false;
    const expenseDate = expense.date.toDate();
    const now = new Date();
    const isCurrentMonth = expenseDate.getMonth() === now.getMonth() && 
                          expenseDate.getFullYear() === now.getFullYear();
    return isCurrentMonth;
  });
  const thisMonthStats = calculateStats(thisMonthExpenses);
  // 오늘 지출 계산 (현자 지점만)
  const todayExpenses = filteredExpenses.filter(expense => {
    if (!expense.date) return false;
    const expenseDate = expense.date.toDate();
    const today = new Date();
    const isToday = expenseDate.toDateString() === today.toDateString();
    return isToday;
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
      // 관리자는 전체 데이터 로드
      fetchExpenses();
      // 본사 관리자인 경우 빈 branchId 데이터 자동 업데이트
      updateEmptyBranchIds();
    } else {
      // 기본적으로 전체 데이터 로드
      fetchExpenses();
    }
  }, [user, branches, isAdmin, fetchExpenses]);
  // 관리자일 때 초기 로딩 시 전체 데이터 강제 로드
  useEffect(() => {
    if (isAdmin && branches.length > 0) {
      // 관리자는 항상 전체 데이터를 먼저 로드
      fetchExpenses();
    }
  }, [isAdmin, branches.length, fetchExpenses]);
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
            {selectedBranchId === 'all' ? '전체' : currentBranch?.name || '지점'}의 모든 지출을 쉽고 빠르게 관리하세요
          </p>
        </div>
        {/* 지점 선택 드롭다운 (관리자만) */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedBranchId} onValueChange={handleBranchChange}>
              <SelectTrigger className="w-[200px] text-foreground">
                <SelectValue placeholder="지점 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {branches.filter(branch => branch.type === '본사').map(branch => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
                {branches.filter(branch => branch.type !== '본사').map((branch) => (
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
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
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
             selectedBranchId={selectedBranchId === 'all' ? undefined : selectedBranchId}
           />
         </TabsContent>
         <TabsContent value="charts">
           <ExpenseCharts 
             expenses={filteredExpenses}
             currentBranchName={currentBranch?.name || ''}
             selectedBranchId={selectedBranchId === 'all' ? undefined : selectedBranchId}
           />
         </TabsContent>
         {isHQManager && (
           <TabsContent value="headquarters">
             <ExpenseList 
               refreshTrigger={refreshTrigger} 
               selectedBranchId={selectedBranchId === 'all' ? undefined : selectedBranchId}
               isHeadquarters={true}
             />
           </TabsContent>
         )}
      </Tabs>
    </div>
  );
}
