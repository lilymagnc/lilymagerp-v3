"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Printer, Search, Download, FileUp } from "lucide-react";
import { MaterialTable } from "./components/material-table";
import { MaterialForm, MaterialFormValues } from "./components/material-form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { MultiPrintOptionsDialog } from "@/components/multi-print-options-dialog";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from "@/hooks/use-branches";
import { useMaterials } from "@/hooks/use-materials";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadXLSX } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { ImportButton } from "@/components/import-button";

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
  const { user } = useAuth();
  const { branches } = useBranches();
  const { materials, loading: materialsLoading, addMaterial, updateMaterial, deleteMaterial, bulkAddMaterials } = useMaterials();
  
  const isHeadOfficeAdmin = user?.role === '본사 관리자';
  const isAdmin = user?.role === '본사 관리자';
  const userBranch = user?.franchise;

  // 사용자가 볼 수 있는 지점 목록
  const availableBranches = useMemo(() => {
    if (isAdmin) {
      return branches;
    } else {
      return branches.filter(branch => branch.name === userBranch);
    }
  }, [branches, isAdmin, userBranch]);

  // 직원의 경우 자동으로 소속 지점으로 필터링
  useEffect(() => {
    if (!isAdmin && userBranch && selectedBranch === "all") {
      setSelectedBranch(userBranch);
    }
  }, [isAdmin, userBranch, selectedBranch]);

  const mainCategories = useMemo(() => [...new Set(materials.map(m => m.mainCategory))], [materials]);
  const midCategories = useMemo(() => {
    if (selectedMainCategory === "all") {
      return [...new Set(materials.map(m => m.midCategory))];
    }
    return [...new Set(materials.filter(m => m.mainCategory === selectedMainCategory).map(m => m.midCategory))];
  }, [materials, selectedMainCategory]);

  const filteredMaterials = useMemo(() => {
    let filtered = materials;

    // 권한에 따른 지점 필터링
    if (!isAdmin && userBranch) {
      filtered = filtered.filter(material => material.branch === userBranch);
    } else if (selectedBranch !== "all") {
      filtered = filtered.filter(material => material.branch === selectedBranch);
    }

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(material => 
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 카테고리 필터링
    if (selectedMainCategory !== "all") {
      filtered = filtered.filter(material => material.mainCategory === selectedMainCategory);
    }
    if (selectedMidCategory !== "all") {
      filtered = filtered.filter(material => material.midCategory === selectedMidCategory);
    }

    return filtered;
  }, [materials, searchTerm, selectedBranch, selectedMainCategory, selectedMidCategory, isAdmin, userBranch]);

  const handleAdd = () => {
    setSelectedMaterial(null);
    setIsFormOpen(true);
  };

  const handleEdit = (material: any) => {
    setSelectedMaterial(material);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: MaterialFormValues) => {
    if (selectedMaterial?.docId) {
      await updateMaterial(selectedMaterial.docId, selectedMaterial.id, data);
    } else {
      await addMaterial(data);
    }
    setIsFormOpen(false);
    setSelectedMaterial(null);
  };

  const handleDelete = async (docId: string) => {
    await deleteMaterial(docId);
  };

  const handleDownloadCurrentList = () => {
    if (filteredMaterials.length === 0) {
      toast({
        variant: "destructive",
        title: "내보낼 데이터 없음",
        description: "현재 필터에 맞는 자재 데이터가 없습니다.",
      });
      return;
    }
    const dataToExport = filteredMaterials.map(({ id, name, mainCategory, midCategory, price, supplier, stock, size, color, branch }) => 
      ({ id, name, mainCategory, midCategory, branch, supplier, price, size, color, current_stock: stock })
    );
    downloadXLSX(dataToExport, "materials_list");
    toast({
      title: "목록 다운로드 성공",
      description: `현재 필터링된 ${dataToExport.length}개 자재 정보가 XLSX 파일로 다운로드되었습니다.`,
    });
  };

  const handleImport = async (data: any[]) => {
    await bulkAddMaterials(data, selectedBranch);
  };
  
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
    <div className="space-y-6">
      <PageHeader
        title="자재 관리"
        description={`자재 정보를 관리하고 재고를 추적하세요.${!isAdmin ? ` (${userBranch})` : ''}`}
      >
        {isHeadOfficeAdmin && (
          <Button onClick={handleAdd}>
            <PlusCircle className="mr-2 h-4 w-4" />
            자재 추가
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>자재 검색 및 필터</CardTitle>
          <CardDescription>
            자재명이나 ID로 검색하고 카테고리별로 필터링할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="자재명 또는 ID로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            {isAdmin && (
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="지점 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 지점</SelectItem>
                  {availableBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.name}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={selectedMainCategory} onValueChange={setSelectedMainCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="대분류" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 대분류</SelectItem>
                {mainCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMidCategory} onValueChange={setSelectedMidCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="중분류" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 중분류</SelectItem>
                {midCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCurrentList}
              disabled={filteredMaterials.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              현재 목록 다운로드
            </Button>
            {isHeadOfficeAdmin && (
              <>
                <ImportButton
                  onImport={handleImport}
                  templateData={[
                    {
                      id: "MAT001",
                      name: "예시 자재",
                      mainCategory: "대분류",
                      midCategory: "중분류",
                      price: 10000,
                      supplier: "공급업체",
                      size: "크기",
                      color: "색상",
                      stock: 100
                    }
                  ]}
                  fileName="materials_template"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMultiPrintDialogOpen(true)}
                  disabled={selectedMaterials.length === 0}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  선택 항목 라벨 출력
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {materialsLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <MaterialTable
          materials={filteredMaterials}
          onEdit={handleEdit}
          onDelete={handleDelete}
          selectedMaterials={selectedMaterials}
          onSelectionChange={setSelectedMaterials}
          isAdmin={isHeadOfficeAdmin}
        />
      )}

      <MaterialForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        initialData={selectedMaterial}
        branches={availableBranches}
        selectedBranch={!isAdmin ? userBranch : selectedBranch}
      />

      <MultiPrintOptionsDialog
        open={isMultiPrintDialogOpen}
        onOpenChange={setIsMultiPrintDialogOpen}
        onSubmit={handleMultiPrintSubmit}
        items={selectedMaterials.map(id => {
          const material = materials.find(m => m.id === id);
          return {
            id,
            name: material?.name || '',
            currentStock: material?.stock || 0
          };
        })}
      />
    </div>
  );
}
