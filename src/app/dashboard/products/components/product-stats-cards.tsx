"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ShoppingBag, TrendingUp, TrendingDown } from "lucide-react";

interface Product {
  id: string;
  name: string;
  mainCategory: string;
  midCategory: string;
  branch: string;
  stock: number;
  price: number;
  status: string;
}

interface ProductStatsCardsProps {
  products: Product[];
  selectedBranch: string;
  isAdmin: boolean;
}

export function ProductStatsCards({ products, selectedBranch, isAdmin }: ProductStatsCardsProps) {
  const stats = useMemo(() => {
    // 선택된 지점에 따라 필터링
    const filteredProducts = selectedBranch === "all" 
      ? products 
      : products.filter(product => product.branch === selectedBranch);

    // 지점별 통계
    const branchStats = products.reduce((acc, product) => {
      if (!acc[product.branch]) {
        acc[product.branch] = {
          total: 0,
          categories: {},
          lowStock: 0,
          outOfStock: 0,
          totalValue: 0
        };
      }
      
      acc[product.branch].total++;
      acc[product.branch].categories[product.mainCategory] = 
        (acc[product.branch].categories[product.mainCategory] || 0) + 1;
      
      if (product.stock === 0) {
        acc[product.branch].outOfStock++;
      } else if (product.stock < 10) {
        acc[product.branch].lowStock++;
      }
      
      acc[product.branch].totalValue += (product.stock * product.price);
      
      return acc;
    }, {} as Record<string, any>);

    // 전체 통계
    const totalStats = {
      total: filteredProducts.length,
      categories: filteredProducts.reduce((acc, product) => {
        acc[product.mainCategory] = (acc[product.mainCategory] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      lowStock: filteredProducts.filter(p => p.stock > 0 && p.stock < 10).length,
      outOfStock: filteredProducts.filter(p => p.stock === 0).length,
      totalValue: filteredProducts.reduce((sum, p) => sum + (p.stock * p.price), 0)
    };

    return { branchStats, totalStats };
  }, [products, selectedBranch]);

  // 선택된 지점의 통계 또는 전체 통계
  const currentStats = selectedBranch === "all" ? stats.totalStats : stats.branchStats[selectedBranch] || stats.totalStats;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* 총 상품 수 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 상품 수</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentStats.total}</div>
          <p className="text-xs text-muted-foreground">
            {selectedBranch === "all" ? "전체 지점" : selectedBranch}
          </p>
        </CardContent>
      </Card>

      {/* 카테고리별 상품 수 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">카테고리별</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {Object.entries(currentStats.categories || {})
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 3)
              .map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground truncate">{category}</span>
                  <Badge variant="secondary" className="text-xs">{count}</Badge>
                </div>
              ))}
            {Object.keys(currentStats.categories || {}).length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{Object.keys(currentStats.categories || {}).length - 3}개 더
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 재고 상태 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">재고 상태</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">품절</span>
              <Badge variant="destructive" className="text-xs">{currentStats.outOfStock || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">재고 부족</span>
              <Badge variant="secondary" className="text-xs">{currentStats.lowStock || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">정상</span>
              <Badge variant="default" className="text-xs">
                {currentStats.total - (currentStats.outOfStock || 0) - (currentStats.lowStock || 0)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 재고 가치 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">재고 총 가치</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₩{(currentStats.totalValue || 0).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            현재 재고 기준
          </p>
        </CardContent>
      </Card>

      {/* 관리자인 경우 지점별 요약 표시 */}
      {isAdmin && selectedBranch === "all" && (
        <>
          {Object.entries(stats.branchStats)
            .sort(([,a], [,b]) => (b as any).total - (a as any).total)
            .slice(0, 4)
            .map(([branch, branchData]) => (
              <Card key={branch} className="md:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium truncate">{branch}</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{(branchData as any).total}</div>
                  <div className="flex gap-1 mt-1">
                    <Badge variant="destructive" className="text-xs">
                      품절: {(branchData as any).outOfStock || 0}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      부족: {(branchData as any).lowStock || 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
        </>
      )}
    </div>
  );
}
