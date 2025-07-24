
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Download, Printer, Search, ArrowRightLeft } from "lucide-react";
import { ImportButton } from "@/components/import-button";
import { MaterialTable } from "./components/material-table";
import { MaterialForm } from "./components/material-form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { MultiPrintOptionsDialog } from "@/components/multi-print-options-dialog";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from "@/hooks/use-branches";
import Link from "next/link";
import { useMaterials } from "@/hooks/use-materials";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadCSV } from "@/lib/utils";


export default function MaterialsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [isMultiPrintDialogOpen, setIsMultiPrintDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");

  const { toast } = useToast();
  const router = useRouter();
  const { branches } = useBranches();
  const { materials, loading: materialsLoading } = useMaterials();

  const filteredMaterials = useMemo(() => {
    return materials
      .filter(material => 
        (selectedBranch === "all" || material.branch === selectedBranch)
      )
      .filter(material => 
        material.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [materials, searchTerm, selectedBranch]);

  const handleExport = () => {
    if (filteredMaterials.length === 0) {
      toast({
        variant: "destructive",
        title: "내보낼 데이터 없음",
        description: "목록에 자재 데이터가 없습니다.",
      });
      return;
    }
    const dataToExport = filteredMaterials.map(({ id, name, mainCategory, midCategory, price, supplier, stock, size, color, branch }) => 
      ({ id, name, mainCategory, midCategory, price, supplier, stock, size, color, branch })
    );
    downloadCSV(dataToExport, "materials");
    toast({
      title: "내보내기 성공",
      description: `${dataToExport.length}개의 자재 정보가 CSV 파일로 다운로드되었습니다.`,
    });
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
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/materials/stock">
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      재고 입출고
                    </Link>
                  </Button>
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
      {materialsLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-2">
                  <Skeleton className="h-5 w-5 rounded-sm" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-48" />
                   <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <MaterialTable materials={filteredMaterials} onSelectionChange={setSelectedMaterials} />
      )}
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
