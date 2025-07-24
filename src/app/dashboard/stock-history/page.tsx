
"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { HistoryTable, StockHistory } from "./components/history-table";
import { HistoryFilters } from "./components/history-filters";
import { useBranches } from "@/hooks/use-branches";
import { useToast } from "@/hooks/use-toast";

const mockHistory: StockHistory[] = [
  { id: "SH-001", date: "2023-11-01T10:00:00Z", type: "in", itemType: "material", itemName: "마르시아 장미", quantity: 50, branch: "릴리맥광화문점", operator: "김입고" },
  { id: "SH-002", date: "2023-11-01T11:30:00Z", type: "out", itemType: "product", itemName: "레드로즈 꽃다발", quantity: 2, branch: "릴리맥NC이스트폴점", operator: "박출고" },
  { id: "SH-003", date: "2023-11-02T14:00:00Z", type: "out", itemType: "material", itemName: "포장용 크라프트지", quantity: 10, branch: "릴리맥여의도점", operator: "이사용" },
  { id: "SH-004", date: "2023-11-02T16:45:00Z", type: "in", itemType: "product", itemName: "맥 데님 팬츠", quantity: 20, branch: "릴리맥여의도점", operator: "최보충" },
  { id: "SH-005", date: "2023-11-03T09:10:00Z", type: "in", itemType: "material", itemName: "만천홍", quantity: 15, branch: "릴리맥NC이스트폴점", operator: "김입고" },
  { id: "SH-006", date: "2023-11-03T18:00:00Z", type: "out", itemType: "material", itemName: "마르시아 장미", quantity: 5, branch: "릴리맥광화문점", operator: "박출고" },
];

export default function StockHistoryPage() {
    const { branches } = useBranches();
    const { toast } = useToast();
    
    const [filters, setFilters] = useState({
        dateRange: { from: new Date(new Date().setMonth(new Date().getMonth() - 1)), to: new Date() },
        branch: "all",
        type: "all",
        itemType: "all",
        search: "",
    });

    const filteredHistory = useMemo(() => {
        return mockHistory.filter(item => {
            const itemDate = new Date(item.date);
            const inDateRange = itemDate >= (filters.dateRange.from ?? new Date(0)) && itemDate <= (filters.dateRange.to ?? new Date());
            const branchMatch = filters.branch === 'all' || item.branch === filters.branch;
            const typeMatch = filters.type === 'all' || item.type === filters.type;
            const itemTypeMatch = filters.itemType === 'all' || item.itemType === filters.itemType;
            const searchMatch = item.itemName.toLowerCase().includes(filters.search.toLowerCase());

            return inDateRange && branchMatch && typeMatch && itemTypeMatch && searchMatch;
        });
    }, [filters]);

    const handleExport = () => {
        toast({
            title: "기능 구현 예정",
            description: "구글 시트로 내보내기 기능은 현재 개발 중입니다.",
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
      
      <HistoryTable history={filteredHistory} />
    </div>
  );
}
