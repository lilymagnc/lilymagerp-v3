
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import { ProductForm } from "./product-form";
import { StockUpdateForm } from "./stock-update-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const mockProducts = [
  { id: "PROD-001", name: "릴리 화이트 셔츠", category: "상의", price: 45000, supplier: "꽃길 본사", stock: 120, status: "active", size: "M", color: "White" },
  { id: "PROD-002", name: "맥 데님 팬츠", category: "하의", price: 78000, supplier: "데님월드", stock: 80, status: "active", size: "28", color: "Blue" },
  { id: "PROD-003", name: "오렌지 포인트 스커트", category: "하의", price: 62000, supplier: "꽃길 본사", stock: 0, status: "out_of_stock", size: "S", color: "Orange" },
  { id: "PROD-004", name: "그린 스트라이프 티", category: "상의", price: 32000, supplier: "티셔츠팩토리", stock: 250, status: "active", size: "L", color: "Green/White" },
  { id: "PROD-005", name: "베이직 블랙 슬랙스", category: "하의", price: 55000, supplier: "슬랙스하우스", stock: 15, status: "low_stock", size: "M", color: "Black" },
];

export function ProductTable() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStockFormOpen, setIsStockFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };
  
  const handleStockUpdate = (product: any) => {
    setSelectedProduct(product);
    setIsStockFormOpen(true);
  };

  const handleCloseForms = () => {
    setIsFormOpen(false);
    setIsStockFormOpen(false);
    setSelectedProduct(null);
  };

  const getStatus = (status: string, stock: number) => {
    if (status === 'out_of_stock' || stock === 0) return { text: '품절', variant: 'destructive' as const };
    if (status === 'low_stock' || stock < 20) return { text: '재고 부족', variant: 'secondary' as const };
    return { text: '판매중', variant: 'default' as const };
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">상품명</TableHead>
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
              {mockProducts.map((product) => {
                const statusInfo = getStatus(product.status, product.stock);
                return (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant={statusInfo.variant}>
                      {statusInfo.text}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{product.category}</TableCell>
                  <TableCell className="hidden sm:table-cell">₩{product.price.toLocaleString()}</TableCell>
                  <TableCell className="hidden md:table-cell">{product.supplier}</TableCell>
                  <TableCell className="text-right">{product.stock}</TableCell>
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
                          <DropdownMenuItem onSelect={() => handleEdit(product)}>수정</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleStockUpdate(product)}>재고 업데이트</DropdownMenuItem>
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
                            이 작업은 되돌릴 수 없습니다. '{product.name}' 상품 데이터가 서버에서 영구적으로 삭제됩니다.
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
      {isFormOpen && <ProductForm isOpen={isFormOpen} onOpenChange={handleCloseForms} product={selectedProduct} />}
      {isStockFormOpen && <StockUpdateForm isOpen={isStockFormOpen} onOpenChange={handleCloseForms} product={selectedProduct} />}
    </>
  );
}
