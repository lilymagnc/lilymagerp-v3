
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBranches, Branch } from "@/hooks/use-branches";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MinusCircle, PlusCircle, ScanLine, Store, Trash2 } from "lucide-react";

// Mock data, in a real app this would come from a database
const mockMaterials = [
  { id: "M00001", name: "마르시아 장미", mainCategory: "생화", midCategory: "장미", price: 5000, supplier: "경부선꽃시장", stock: 100, status: "active", size: "1단", color: "Pink", branch: "릴리맥광화문점" },
  { id: "M00002", name: "레드 카네이션", mainCategory: "생화", midCategory: "카네이션", price: 4500, supplier: "플라워팜", stock: 200, status: "active", size: "1단", color: "Red", branch: "릴리맥여의도점" },
  { id: "M00003", name: "몬스테라", mainCategory: "화분", midCategory: "관엽식물", price: 25000, supplier: "플라워팜", stock: 0, status: "out_of_stock", size: "대", color: "Green", branch: "릴리맥광화문점" },
  { id: "M00004", name: "만천홍", mainCategory: "화분", midCategory: "난", price: 55000, supplier: "경부선꽃시장", stock: 30, status: "active", size: "특", color: "Purple", branch: "릴리맥NC이스트폴점" },
  { id: "M00005", name: "포장용 크라프트지", mainCategory: "기타자재", midCategory: "포장지", price: 1000, supplier: "자재월드", stock: 15, status: "low_stock", size: "1롤", color: "Brown", branch: "릴리맥여의도점" },
  { id: "M00006", name: "유칼립투스", mainCategory: "생화", midCategory: "기타", price: 3000, supplier: "플라워팜", stock: 50, status: "active", size: "1단", color: "Green", branch: "릴리맥광화문점" },
];

interface ScannedItem {
  id: string;
  name: string;
  quantity: number;
}

export function StockMovement() {
  const { branches } = useBranches();
  const { toast } = useToast();
  
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("stock-in");
  const [barcode, setBarcode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [stockInList, setStockInList] = useState<ScannedItem[]>([]);
  const [stockOutList, setStockOutList] = useState<ScannedItem[]>([]);
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const selectedBranchName = useMemo(() => {
    return branches.find(b => b.id === selectedBranchId)?.name || "지점";
  }, [selectedBranchId, branches]);

  useEffect(() => {
    if (selectedBranchId && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [selectedBranchId]);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;

    const scannedId = barcode.trim();
    const material = mockMaterials.find(m => m.id === scannedId);

    if (!material) {
      toast({
        variant: "destructive",
        title: "자재 없음",
        description: `바코드 '${scannedId}'에 해당하는 자재를 찾을 수 없습니다.`,
      });
      setBarcode("");
      return;
    }

    if (activeTab === 'stock-in') {
      setStockInList(prevList => {
        const existingItem = prevList.find(item => item.id === scannedId);
        if (existingItem) {
          return prevList.map(item => 
            item.id === scannedId ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [...prevList, { id: scannedId, name: material.name, quantity: 1 }];
      });
    } else { // stock-out
      setStockOutList(prevList => {
        const existingItem = prevList.find(item => item.id === scannedId);
        if (existingItem) {
          return prevList.map(item => 
            item.id === scannedId ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [...prevList, { id: scannedId, name: material.name, quantity: 1 }];
      });
    }
    setBarcode("");
  };

  const updateQuantity = (list: 'in' | 'out', id: string, newQuantity: number) => {
    const quantity = Math.max(1, newQuantity);
    const setter = list === 'in' ? setStockInList : setStockOutList;
    setter(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };
  
  const removeItem = (list: 'in' | 'out', id: string) => {
    const setter = list === 'in' ? setStockInList : setStockOutList;
    setter(prev => prev.filter(item => item.id !== id));
  };

  const handleProcess = () => {
    setIsProcessing(true);
    const list = activeTab === 'stock-in' ? stockInList : stockOutList;
    if (list.length === 0) {
      toast({ variant: "destructive", title: "목록이 비어있음", description: "처리할 자재를 먼저 스캔해주세요." });
      setIsProcessing(false);
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      console.log(`Processing ${activeTab} for branch ${selectedBranchName}:`, list);
      toast({
        title: "처리 완료",
        description: `${selectedBranchName}의 ${activeTab === 'stock-in' ? '입고' : '출고'}가 성공적으로 처리되었습니다.`
      });
      if(activeTab === 'stock-in') setStockInList([]);
      else setStockOutList([]);
      setIsProcessing(false);
    }, 1000);
  };
  
  const renderList = (list: ScannedItem[], type: 'in' | 'out') => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>자재명</TableHead>
              <TableHead className="w-[150px] text-center">수량</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length > 0 ? list.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                   <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(type, item.id, item.quantity - 1)}><MinusCircle className="h-4 w-4"/></Button>
                      <Input type="number" value={item.quantity} onChange={(e) => updateQuantity(type, item.id, parseInt(e.target.value) || 1)} className="h-8 w-16 text-center" />
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(type, item.id, item.quantity + 1)}><PlusCircle className="h-4 w-4"/></Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(type, item.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  자재를 스캔하여 목록에 추가하세요.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title="재고 입출고"
        description="핸디 스캐너를 사용하여 자재 재고를 관리합니다."
      />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. 지점 선택</CardTitle>
            <CardDescription>재고를 변경할 지점을 선택해주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-muted-foreground" />
              <Select onValueChange={setSelectedBranchId} value={selectedBranchId ?? ''}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="지점 선택..." />
                </SelectTrigger>
                <SelectContent>
                  {branches.filter(b => b.type !== '본사').map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <fieldset disabled={!selectedBranchId} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>2. 바코드 스캔</CardTitle>
              <CardDescription>아래 입력란에 포커스를 맞추고 바코드를 스캔하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScan} className="flex items-center gap-2">
                <ScanLine className="h-6 w-6 text-muted-foreground" />
                <Input
                  ref={barcodeInputRef}
                  placeholder="바코드 스캔 또는 입력 후 Enter"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="max-w-sm"
                />
              </form>
            </CardContent>
          </Card>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-end">
                <TabsList>
                  <TabsTrigger value="stock-in">입고</TabsTrigger>
                  <TabsTrigger value="stock-out">출고</TabsTrigger>
                </TabsList>
                 <Button onClick={handleProcess} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {activeTab === 'stock-in' ? `${selectedBranchName} 입고 처리` : `${selectedBranchName} 출고 처리`}
                </Button>
            </div>
            <TabsContent value="stock-in">
              {renderList(stockInList, 'in')}
            </TabsContent>
            <TabsContent value="stock-out">
              {renderList(stockOutList, 'out')}
            </TabsContent>
          </Tabs>

        </fieldset>
      </div>
    </div>
  );
}
