
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Download, Printer, Search } from "lucide-react";
import { ImportButton } from "@/components/import-button";
import { MaterialTable, Material } from "./components/material-table";
import { MaterialForm } from "./components/material-form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { MultiPrintOptionsDialog } from "@/components/multi-print-options-dialog";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from "@/hooks/use-branches";

const mockMaterials: Material[] = [
  { id: "M00001", name: "마르시아 장미", mainCategory: "생화", midCategory: "장미", price: 5000, supplier: "경부선꽃시장", stock: 100, status: "active", size: "1단", color: "Pink", branch: "릴리맥광화문점" },
  { id: "M00002", name: "레드 카네이션", mainCategory: "생화", midCategory: "카네이션", price: 4500, supplier: "플라워팜", stock: 200, status: "active", size: "1단", color: "Red", branch: "릴리맥여의도점" },
  { id: "M00003", name: "몬스테라", mainCategory: "화분", midCategory: "관엽식물", price: 25000, supplier: "플라워팜", stock: 0, status: "out_of_stock", size: "대", color: "Green", branch: "릴리맥광화문점" },
  { id: "M00004", name: "만천홍", mainCategory: "화분", midCategory: "난", price: 55000, supplier: "경부선꽃시장", stock: 30, status: "active", size: "특", color: "Purple", branch: "릴리맥NC이스트폴점" },
  { id: "M00005", name: "포장용 크라프트지", mainCategory: "기타자재", midCategory: "포장지", price: 1000, supplier: "자재월드", stock: 15, status: "low_stock", size: "1롤", color: "Brown", branch: "릴리맥여의도점" },
  { id: "M00006", name: "유칼립투스", mainCategory: "생화", midCategory: "기타", price: 3000, supplier: "플라워팜", stock: 50, status: "active", size: "1단", color: "Green", branch: "릴리맥광화문점" },
];


export default function MaterialsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [isMultiPrintDialogOpen, setIsMultiPrintDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");

  const { toast } = useToast();
  const router = useRouter();
  const { branches } = useBranches();

  const filteredMaterials = useMemo(() => {
    return mockMaterials
      .filter(material => 
        (selectedBranch === "all" || material.branch === selectedBranch)
      )
      .filter(material => 
        material.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [searchTerm, selectedBranch]);

  const handleExport = () => {
    toast({
        title: "기능 구현 예정",
        description: "구글 시트로 내보내기 기능은 현재 개발 중입니다.",
    })
  }
  
  const handleMultiPrintSubmit = (items: { id: string; quantity: number }[], startPosition: number) => {
    const itemsQuery = items.map(item => `${item.id}:${item.quantity}`).join(',');
    const params = new URLSearchParams({
      items: itemsQuery,
      type: 'material',
      start: String(startPosition),
    });
    router.push(`/dashboard/print-labels?${params.toString()}`);
    setIsMultiPrintDialogOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="자재 관리"
        description="자재 정보를 등록하고 재고를 관리합니다."
      />
       <Card className="mb-4">
        <CardHeader>
            <CardTitle>자재 목록</CardTitle>
            <CardDescription>
                지점별 자재를 검색하고 관리하세요.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="자재명 검색..."
                        className="w-full rounded-lg bg-background pl-8 sm:w-[200px] lg:w-[300px]"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="지점 선택" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">모든 지점</SelectItem>
                        {branches.map(branch => (
                            <SelectItem key={branch.id} value={branch.name}>
                                {branch.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="ml-auto flex items-center gap-2 mt-2 sm:mt-0 flex-wrap">
                    {selectedMaterials.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setIsMultiPrintDialogOpen(true)}>
                      <Printer className="mr-2 h-4 w-4" />
                      라벨 인쇄 ({selectedMaterials.length})
                    </Button>
                  )}
                  <ImportButton resourceName="자재" />
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    내보내기
                  </Button>
                  <Button size="sm" onClick={() => setIsFormOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    자재 추가
                  </Button>
                </div>
            </div>
        </CardContent>
      </Card>
      <MaterialTable materials={filteredMaterials} onSelectionChange={setSelectedMaterials} />
      <MaterialForm isOpen={isFormOpen} onOpenChange={setIsFormOpen} />
      {isMultiPrintDialogOpen && (
        <MultiPrintOptionsDialog
            isOpen={isMultiPrintDialogOpen}
            onOpenChange={setIsMultiPrintDialogOpen}
            itemIds={selectedMaterials}
            itemType="material"
            onSubmit={handleMultiPrintSubmit}
        />
       )}
    </div>
  );
}
