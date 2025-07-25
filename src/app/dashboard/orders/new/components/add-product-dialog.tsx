
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, PlusCircle, MinusCircle, Trash2, CheckCircle } from "lucide-react";
import { Product } from "@/hooks/use-products";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrderItem extends Product {
  quantity: number;
}

interface AddProductDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  allProducts: Product[];
  currentOrderItems: OrderItem[];
  onAddProducts: (productsToAdd: OrderItem[]) => void;
}

export function AddProductDialog({
  isOpen,
  onOpenChange,
  allProducts,
  currentOrderItems,
  onAddProducts,
}: AddProductDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [productFilter, setProductFilter] = useState({ mainCategory: "all", midCategory: "all" });

  useEffect(() => {
    if (!isOpen) {
      setSelectedItems([]);
      setSearchTerm("");
      setProductFilter({ mainCategory: "all", midCategory: "all" });
    }
  }, [isOpen]);

  const mainCategories = useMemo(() => ["all", ...new Set(allProducts.map(p => p.mainCategory))], [allProducts]);
  const midCategories = useMemo(() => {
    if (productFilter.mainCategory === 'all') {
      return ['all', ...new Set(allProducts.map(p => p.midCategory))];
    }
    return ['all', ...new Set(allProducts.filter(p => p.mainCategory === productFilter.mainCategory).map(p => p.midCategory))];
  }, [allProducts, productFilter.mainCategory]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter(p =>
      (productFilter.mainCategory === 'all' || p.mainCategory === productFilter.mainCategory) &&
      (productFilter.midCategory === 'all' || p.midCategory === productFilter.midCategory) &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allProducts, productFilter, searchTerm]);

  const handleAddItem = (product: Product) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };
  
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
    } else {
        const validatedQuantity = Math.min(newQuantity, product.stock);
        setSelectedItems(prev => prev.map(item => item.id === productId ? { ...item, quantity: validatedQuantity } : item));
    }
  };

  const handleRemoveItem = (productId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== productId));
  }

  const handleConfirmAdd = () => {
    onAddProducts(selectedItems);
    onOpenChange(false);
  };

  const isProductSelected = (productId: string) => {
    return selectedItems.some(item => item.id === productId) || currentOrderItems.some(item => item.id === productId);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>상품 추가</DialogTitle>
          <DialogDescription>추가할 상품을 검색하고 수량을 선택하세요.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Left Panel: Search and Product List */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="상품명 또는 ID 검색..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={productFilter.mainCategory} onValueChange={(value) => setProductFilter({ mainCategory: value, midCategory: 'all' })}>
                <SelectTrigger><SelectValue placeholder="대분류" /></SelectTrigger>
                <SelectContent>
                  {mainCategories.map(cat => <SelectItem key={cat} value={cat}>{cat === 'all' ? '전체 대분류' : cat}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={productFilter.midCategory} onValueChange={(value) => setProductFilter(prev => ({ ...prev, midCategory: value }))}>
                <SelectTrigger><SelectValue placeholder="중분류" /></SelectTrigger>
                <SelectContent>
                  {midCategories.map(cat => <SelectItem key={cat} value={cat}>{cat === 'all' ? '전체 중분류' : cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="flex-1 border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-secondary">
                  <TableRow>
                    <TableHead>상품 정보</TableHead>
                    <TableHead className="text-right">재고</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map(product => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">₩{product.price.toLocaleString()}</p>
                      </TableCell>
                      <TableCell className="text-right">{product.stock}</TableCell>
                      <TableCell>
                        {isProductSelected(product.id) ? (
                            <CheckCircle className="h-5 w-5 text-primary" />
                        ) : (
                          <Button size="icon" variant="ghost" onClick={() => handleAddItem(product)} disabled={product.stock === 0}>
                            <PlusCircle className="h-5 w-5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          {/* Right Panel: Selected Items */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold">추가할 상품 목록 ({selectedItems.length})</h3>
            <ScrollArea className="flex-1 border rounded-md">
              {selectedItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>상품</TableHead>
                      <TableHead className="w-[120px]">수량</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}><MinusCircle className="h-3 w-3" /></Button>
                            <Input type="number" value={item.quantity} onChange={e => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)} className="h-8 w-12 text-center" />
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}><PlusCircle className="h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  왼쪽 목록에서 상품을 추가하세요.
                </div>
              )}
            </ScrollArea>
             <div className="text-right font-bold">
                총 합계: ₩{selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toLocaleString()}
             </div>
          </div>
        </div>
        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary">취소</Button>
          </DialogClose>
          <Button onClick={handleConfirmAdd} disabled={selectedItems.length === 0}>
            상품 추가하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
