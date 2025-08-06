"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { SimpleExpense, SIMPLE_EXPENSE_CATEGORY_LABELS, getCategoryColor } from '@/types/simple-expense';

interface ExpenseChartsProps {
  expenses: SimpleExpense[];
  currentBranchName: string;
}

// 차트 색상 팔레트
const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000',
  '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'
];

export function ExpenseCharts({ expenses, currentBranchName }: ExpenseChartsProps) {
  // 카테고리별 지출 데이터
  const categoryData = React.useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    expenses.forEach(expense => {
      if (!expense.category) return;
      const category = SIMPLE_EXPENSE_CATEGORY_LABELS[expense.category];
      const currentAmount = categoryMap.get(category) || 0;
      categoryMap.set(category, currentAmount + expense.amount);
    });
    
    return Array.from(categoryMap.entries()).map(([name, value], index) => ({
      name,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
  }, [expenses]);

  // 월별 트렌드 데이터 (최근 6개월)
  const monthlyData = React.useMemo(() => {
    const monthlyMap = new Map<string, number>();
    const now = new Date();
    
    // 최근 6개월 초기화
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      monthlyMap.set(monthKey, 0);
    }
    
    // 지출 데이터 집계
    expenses.forEach(expense => {
      if (!expense.date || !expense.amount) return;
      const expenseDate = expense.date.toDate();
      const monthKey = expenseDate.toISOString().slice(0, 7);
      const currentAmount = monthlyMap.get(monthKey) || 0;
      monthlyMap.set(monthKey, currentAmount + expense.amount);
    });
    
    return Array.from(monthlyMap.entries()).map(([month, amount]) => ({
      month: month.replace('-', '/'),
      amount
    }));
  }, [expenses]);

  // 구매처별 지출 데이터 (상위 10개)
  const supplierData = React.useMemo(() => {
    const supplierMap = new Map<string, number>();
    
    expenses.forEach(expense => {
      if (!expense.supplier || !expense.amount) return;
      const currentAmount = supplierMap.get(expense.supplier) || 0;
      supplierMap.set(expense.supplier, currentAmount + expense.amount);
    });
    
    return Array.from(supplierMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [expenses]);

  // 일별 지출 데이터 (최근 30일)
  const dailyData = React.useMemo(() => {
    const dailyMap = new Map<string, number>();
    const now = new Date();
    
    // 최근 30일 초기화
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
      dailyMap.set(dayKey, 0);
    }
    
    // 지출 데이터 집계
    expenses.forEach(expense => {
      if (!expense.date || !expense.amount) return;
      const expenseDate = expense.date.toDate();
      const dayKey = expenseDate.toISOString().slice(0, 10);
      const currentAmount = dailyMap.get(dayKey) || 0;
      dailyMap.set(dayKey, currentAmount + expense.amount);
    });
    
    return Array.from(dailyMap.entries()).map(([day, amount]) => ({
      day: day.slice(5), // MM-DD만 표시
      amount
    }));
  }, [expenses]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}원
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 카테고리별 지출 분포 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">카테고리별 지출 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 월별 지출 트렌드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">월별 지출 트렌드</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="지출액"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 구매처별 지출 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">구매처별 지출 (상위 10개)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={supplierData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 일별 지출 트렌드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">일별 지출 트렌드 (최근 30일)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
} 