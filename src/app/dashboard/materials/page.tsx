
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Download, Printer, Search, ArrowRightLeft, Upload, FileSpreadsheet } from "lucide-react";
import { ImportButton } from "@/components/import-button";
import { MaterialTable } from "./components/material-table";
import { MaterialForm, MaterialFormValues } from "./components/material-form";
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
import { downloadXLSX } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


export default function MaterialsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [isMultiPrintDialogOpen, setIsMultiPrintDialogOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedMainCategory, setSelectedMainCategory] = useState("all");
  const [selectedMidCategory, setSelectedMidCategory] = useState("all");


  const { toast } = useToast();
  const router = useRouter();
  const { branches } = useBranches();
  const { materials, loading: materialsLoading, bulkAddMaterials, addMaterial, updateMaterial, deleteMaterial } = useMaterials();

  const mainCategories = useMemo(() => [...new Set(materials.map(m => m.mainCategory))], [materials]);
  const midCategories = useMemo(() => {
      if (selectedMainCategory === "all") {
          return [...new Set(materials.map(m => m.midCategory))];
      }
      return [...new Set(materials.filter(m => m.mainCategory === selectedMainCategory).map(m => m.midCategory))];
  }, [materials, selectedMainCategory]);

  const filteredMaterials = useMemo(() => {
    return materials
      .filter(material => 
        (selectedBranch === "all" || material.branch === selectedBranch) &&
        (selectedMainCategory === "all" || material.mainCategory === selectedMainCategory) &&
        (selectedMidCategory === "all" || material.midCategory === selectedMidCategory)
      )
      .filter(material => 
        material.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [materials, searchTerm, selectedBranch, selectedMainCategory, selectedMidCategory]);

  const handleAdd = () => {
    setSelectedMaterial(null);
    setIsFormOpen(true);
  }

  const handleEdit = (material: any) => {
    setSelectedMaterial(material);
    setIsFormOpen(true);
  }

  const handleFormSubmit = async (data: MaterialFormValues) => {
    if (selectedMaterial?.docId) {
      await updateMaterial(selectedMaterial.docId, selectedMaterial.id, data);
    } else {
      await addMaterial(data);
    }
    setIsFormOpen(false);
    setSelectedMaterial(null);
  }

  const handleDelete = async (docId: string) => {
    await deleteMaterial(docId);
  }

  const handleExportTemplate = () => {
    if (filteredMaterials.length === 0) {
      toast({
        variant: "destructive",
        title: "내보낼 데이터 없음",
        description: "현재 필터에 맞는 자재 데이터가 없습니다. 필터를 초기화하거나 자재를 먼저 추가해주세요.",
      });
      return;
    }
    const dataToExport = filteredMaterials.map(({ id, name, mainCategory, midCategory, price, supplier, stock, size, color, branch }) => 
      ({ id, name, mainCategory, midCategory, branch, supplier, price, size, color, current_stock: stock, quantity: '' })
    );
    downloadXLSX(dataToExport, "materials_update_template");
    toast({
      title: "템플릿 다운로드 성공",
      description: `현재 필터링된 ${dataToExport.length}개 자재 정보가 XLSX 파일로 다운로드되었습니다.`,
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
                지점 및 카테고리별로 자재를 검색하고 관리하세요.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="자재명 검색..."
                        className="w-full rounded-lg bg-background pl-8"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="w-full sm:w-[160px]">
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
                 <Select value={selectedMainCategory} onValueChange={(value) => { setSelectedMainCategory(value); setSelectedMidCategory("all"); }}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue placeholder="대분류 선택" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">모든 대분류</SelectItem>
                        {mainCategories.map(category => (
                            <SelectItem key={category} value={category}>
                                {category}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Select value={selectedMidCategory} onValueChange={setSelectedMidCategory}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue placeholder="중분류 선택" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">모든 중분류</SelectItem>
                        {midCategories.map(category => (
                            <SelectItem key={category} value={category}>
                                {category}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    {selectedMaterials.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setIsMultiPrintDialogOpen(true)}>
                            <Printer className="mr-2 h-4 w-4" />
                            라벨 인쇄 ({selectedMaterials.length})
                        </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/materials/stock">
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        재고 입출고 페이지
                    </Link>
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          엑셀 작업
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={handleExportTemplate}>
                          <Download className="mr-2 h-4 w-4" />
                          1. 데이터 템플릿 다운로드
                        </DropdownMenuItem>
                        <ImportButton resourceName="자재" onImport={bulkAddMaterials} asDropdownMenuItem>
                           <Upload className="mr-2 h-4 w-4" />
                           2. 템플릿 파일로 자재 등록
                        </ImportButton>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button size="sm" onClick={handleAdd}>
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
        <MaterialTable 
          materials={filteredMaterials} 
          onSelectionChange={setSelectedMaterials} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
      <MaterialForm 
        isOpen={isFormOpen} 
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        material={selectedMaterial}
      />
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
