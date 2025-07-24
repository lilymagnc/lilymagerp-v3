
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import { MaterialForm } from "./material-form";
import { StockUpdateForm } from "@/app/dashboard/products/components/stock-update-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const mockMaterials = [
  { id: "MAT-001", name: "마르시아 장미", mainCategory: "생화", midCategory: "장미", price: 5000, supplier: "경부선꽃시장", stock: 100, status: "active", size: "1단", color: "Pink" },
  { id: "MAT-002", name: "레드 카네이션", mainCategory: "생화", midCategory: "카네이션", price: 4500, supplier: "플라워팜", stock: 200, status: "active", size: "1단", color: "Red" },
  { id: "MAT-003", name: "몬스테라", mainCategory: "화분", midCategory: "관엽식물", price: 25000, supplier: "플라워팜", stock: 0, status: "out_of_stock", size: "대", color: "Green" },
  { id: "MAT-004", name: "만천홍", mainCategory: "화분", midCategory: "난", price: 55000, supplier: "경부선꽃시장", stock: 30, status: "active", size: "특", color: "Purple" },
  { id: "MAT-005", name: "포장용 크라프트지", mainCategory: "기타자재", midCategory: "포장지", price: 1000, supplier: "자재월드", stock: 15, status: "low_stock", size: "1롤", color: "Brown" },
];

export function MaterialTable() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStockFormOpen, setIsStockFormOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const handleEdit = (material: any) => {
    setSelectedMaterial(material);
    setIsFormOpen(true);
  };
  
  const handleStockUpdate = (material: any) => {
    setSelectedMaterial(material);
    setIsStockFormOpen(true);
  };

  const handleCloseForms = () => {
    setIsFormOpen(false);
    setIsStockFormOpen(false);
    setSelectedMaterial(null);
  };

  const getStatus = (status: string, stock: number) => {
    if (status === 'out_of_stock' || stock === 0) return { text: '품절', variant: 'destructive' as const };
    if (status === 'low_stock' || stock < 20) return { text: '재고 부족', variant: 'secondary' as const };
    return { text: '입고중', variant: 'default' as const };
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">자재명</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="hidden md:table-cell">카테고리</TableHead>
                <TableHead className="hidden sm:table-cell">가격</TableHead>
                <TableHead className="hidden md:table-cell">공급업체</TableHead>
                <TableHead className="text-right">재고</TableHead>
                <TableHead>
                  <span className="sr-only">작업</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockMaterials.map((material) => {
                const statusInfo = getStatus(material.status, material.stock);
                return (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>
                    <Badge variant={statusInfo.variant}>
                      {statusInfo.text}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{material.mainCategory} &gt; {material.midCategory}</TableCell>
                  <TableCell className="hidden sm:table-cell">₩{material.price.toLocaleString()}</TableCell>
                  <TableCell className="hidden md:table-cell">{material.supplier}</TableCell>
                  <TableCell className="text-right">{material.stock}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">메뉴 토글</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>작업</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleEdit(material)}>수정</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleStockUpdate(material)}>재고 업데이트</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>삭제</DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
                          <AlertDialogDescription>
                            이 작업은 되돌릴 수 없습니다. '{material.name}' 자재 데이터가 서버에서 영구적으로 삭제됩니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {isFormOpen && <MaterialForm isOpen={isFormOpen} onOpenChange={handleCloseForms} material={selectedMaterial} />}
      {isStockFormOpen && <StockUpdateForm isOpen={isStockFormOpen} onOpenChange={handleCloseForms} product={selectedMaterial} />}
    </>
  );
}
