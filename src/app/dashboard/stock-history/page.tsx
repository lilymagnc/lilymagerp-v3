"use client";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { HistoryTable } from "./components/history-table";
import { HistoryFilters } from "./components/history-filters";
import { useBranches } from "@/hooks/use-branches";
import { useStockHistory } from "@/hooks/use-stock-history";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadXLSX } from "@/lib/utils";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
export default function StockHistoryPage() {
    const { branches } = useBranches();
    const { history, loading, deleteHistoryRecord } = useStockHistory();
    const { toast } = useToast();
    const [filters, setFilters] = useState<{
        dateRange: DateRange;
        branch: string;
        type: string;
        itemType: string;
        search: string;
    }>({
        dateRange: { from: new Date(new Date().setMonth(new Date().getMonth() - 1)), to: new Date() },
        branch: "all",
        type: "all",
        itemType: "all",
        search: "",
    });
    const filteredHistory = useMemo(() => {
        return history.filter(item => {
            if (!item.date) return false;
            const itemDate = new Date(item.date);
            const fromDate = filters.dateRange?.from;
            const toDate = filters.dateRange?.to;
            const inDateRange = 
                (!fromDate || itemDate >= fromDate) && 
                (!toDate || itemDate <= toDate);
            const branchMatch = filters.branch === 'all' || item.branch === filters.branch;
            const typeMatch = filters.type === 'all' || item.type === filters.type || (filters.type === "manual_update" && item.type === "manual_update");
            const itemTypeMatch = filters.itemType === 'all' || item.itemType === filters.itemType;
            const searchMatch = item.itemName.toLowerCase().includes(filters.search.toLowerCase());
            return inDateRange && branchMatch && typeMatch && itemTypeMatch && searchMatch;
        });
    }, [filters, history]);
    const handleExport = () => {
        if (filteredHistory.length === 0) {
            toast({
                variant: "destructive",
                title: "내보낼 데이터 없음",
                description: "목록에 데이터가 없습니다.",
            });
            return;
        }
        const dataToExport = filteredHistory.map(item => ({
            '날짜': format(new Date(item.date), 'yyyy-MM-dd HH:mm'),
            '지점': item.branch,
            '품목명': item.itemName,
            '공급업체': item.supplier || '',
            '유형': item.type,
            '수량': item.type === 'in' ? `+${item.quantity}` : item.type === 'out' ? `-${item.quantity}` : `${item.fromStock} -> ${item.toStock}`,
            '단가': item.price || 0,
            '총액': item.totalAmount || 0,
            '처리 후 재고': item.resultingStock,
            '처리자': item.operator,
        }));
        downloadXLSX(dataToExport, "stock_history");
        toast({
            title: "내보내기 성공",
            description: `${dataToExport.length}개의 재고 기록이 XLSX 파일로 다운로드되었습니다.`,
        });
    }
  return (
    <div>
      <PageHeader
        title="재고 변동 기록"
        description="상품 및 자재의 입출고 내역을 추적하고 관리합니다."
      >
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          내보내기
        </Button>
      </PageHeader>
      <HistoryFilters
        filters={filters}
        onFiltersChange={setFilters}
        branches={branches}
      />
      {loading ? (
        <div className="space-y-2">
            {Array.from({length: 10}).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
      ) : (
        <HistoryTable history={filteredHistory} onDelete={deleteHistoryRecord} />
      )}
    </div>
  );
}
