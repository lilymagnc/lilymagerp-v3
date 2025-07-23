
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

// In a real app, this would come from a data store.
const mockProducts = [
  { id: "PROD-001", name: "릴리 화이트 셔츠", category: "상의", price: 45000, stock: 120 },
  { id: "PROD-002", name: "맥 데님 팬츠", category: "하의", price: 78000, stock: 80 },
  { id: "PROD-003", name: "오렌지 포인트 스커트", category: "하의", price: 62000, stock: 0 },
  { id: "PROD-004", name: "그린 스트라이프 티", category: "상의", price: 32000, stock: 250 },
  { id: "PROD-005", name: "베이직 블랙 슬랙스", category: "하의", price: 55000, stock: 15 },
];

interface AddProductDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddProduct: (product: typeof mockProducts[0]) => void;
}

export function AddProductDialog({ isOpen, onOpenChange, onAddProduct }: AddProductDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = mockProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAdd = (product: typeof mockProducts[0]) => {
    onAddProduct(product);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>주문 상품 추가</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="상품 검색..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ScrollArea className="h-[300px] border rounded-md">
          <div className="p-2">
            {filteredProducts.length > 0 ? filteredProducts.map(product => (
              <div key={product.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">재고: {product.stock}개 | 가격: ₩{product.price.toLocaleString()}</p>
                </div>
                <Button size="sm" onClick={() => handleAdd(product)} disabled={product.stock === 0}>
                  {product.stock === 0 ? '품절' : '추가'}
                </Button>
              </div>
            )) : (
              <p className="text-center text-muted-foreground p-4">상품을 찾을 수 없습니다.</p>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
