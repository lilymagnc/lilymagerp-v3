
"use client";

import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { HistoryTable, StockHistory } from "./components/history-table";
import { HistoryFilters } from "./components/history-filters";
import { useBranches } from "@/hooks/use-branches";
import { useToast } from "@/hooks/use-toast";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export default function StockHistoryPage() {
    const { branches } = useBranches();
    const { toast } = useToast();
    const [history, setHistory] = useState<StockHistory[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [filters, setFilters] = useState({
        dateRange: { from: new Date(new Date().setMonth(new Date().getMonth() - 1)), to: new Date() },
        branch: "all",
        type: "all",
        itemType: "all",
        search: "",
    });

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, "stockHistory"), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const historyData: StockHistory[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                historyData.push({
                    id: doc.id,
                    ...data,
                    date: data.date.toDate().toISOString(),
                } as StockHistory);
            });
            setHistory(historyData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching stock history:", error);
            toast({
                variant: "destructive",
                title: "오류",
                description: "재고 기록을 불러오는 중 오류가 발생했습니다."
            });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);

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
      
      {loading ? (
        <div className="space-y-2">
            {Array.from({length: 10}).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
      ) : (
        <HistoryTable history={filteredHistory} />
      )}
    </div>
  );
}
