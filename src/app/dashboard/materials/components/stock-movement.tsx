
"use client"

import { useState, useRef, KeyboardEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Barcode, Search, Trash2, MinusCircle, PlusCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock data - in a real app, this would be fetched from a database
const mockMaterials = [
  { id: "M00001", name: "마르시아 장미", stock: 100 },
  { id: "M00002", name: "레드 카네이션", stock: 200 },
  { id: "M00003", name: "몬스테라", stock: 0 },
  { id: "M00004", name: "만천홍", stock: 30 },
  { id: "M00005", name: "포장용 크라프트지", stock: 15 },
  { id: "M00006", name: "유칼립투스", stock: 50 },
];

interface ScannedItem {
    id: string;
    name: string;
    quantity: number;
    stock: number;
}

export function StockMovement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"stock-in" | "stock-out">("stock-in");
  const [barcode, setBarcode] = useState("");
  const [stockInList, setStockInList] = useState<ScannedItem[]>([]);
  const [stockOutList, setStockOutList] = useState<ScannedItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScan = () => {
    if (!barcode) return;

    const material = mockMaterials.find(m => m.id === barcode);

    if (!material) {
        toast({
            variant: 'destructive',
            title: '자재 없음',
            description: `바코드 '${barcode}'에 해당하는 자재를 찾을 수 없습니다.`,
        });
        setBarcode("");
        return;
    }
    
    if (activeTab === 'stock-in') {
        setStockInList(prevList => {
            const existingItem = prevList.find(item => item.id === barcode);
            if (existingItem) {
                return prevList.map(item => item.id === barcode ? { ...item, quantity: item.quantity + 1 } : item);
            } else {
                return [...prevList, { id: material.id, name: material.name, quantity: 1, stock: material.stock }];
            }
        });
    } else { // stock-out
        setStockOutList(prevList => {
            const existingItem = prevList.find(item => item.id === barcode);
            if (existingItem) {
                return prevList.map(item => item.id === barcode ? { ...item, quantity: item.quantity + 1 } : item);
            } else {
                return [...prevList, { id: material.id, name: material.name, quantity: 1, stock: material.stock }];
            }
        });
    }

    setBarcode("");
    inputRef.current?.focus();
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleScan();
    }
  }

  const updateQuantity = (id: string, newQuantity: number) => {
    const list = activeTab === 'stock-in' ? stockInList : stockOutList;
    const setList = activeTab === 'stock-in' ? setStockInList : setStockOutList;
    
    if (newQuantity >= 1) {
        setList(prevList => prevList.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
    }
  }
  
  const removeItem = (id: string) => {
    const setList = activeTab === 'stock-in' ? setStockInList : setStockOutList;
    setList(prevList => prevList.filter(item => item.id !== id));
  }

  const handleProcess = () => {
    const list = activeTab === 'stock-in' ? stockInList : stockOutList;
    if (list.length === 0) {
        toast({
            variant: 'destructive',
            title: '오류',
            description: `처리할 항목이 없습니다.`,
        });
        return;
    }

    // In a real app, you would send this data to your backend to update stock levels.
    console.log(`Processing ${activeTab}`, list);
    
    toast({
        title: '성공',
        description: `${activeTab === 'stock-in' ? '입고' : '출고'} 처리가 완료되었습니다. (콘솔 로그 확인)`,
    });

    if (activeTab === 'stock-in') {
        setStockInList([]);
    } else {
        setStockOutList([]);
    }
  }

  const renderList = (list: ScannedItem[], type: 'stock-in' | 'stock-out') => (
    <div className="space-y-4">
        {list.length > 0 ? (
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>자재명</TableHead>
                                <TableHead className="w-[150px]">수량</TableHead>
                                <TableHead className="w-[100px] text-right">현재고</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {list.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}><MinusCircle className="h-4 w-4"/></Button>
                                            <Input type="number" value={item.quantity} onChange={e => updateQuantity(item.id, parseInt(e.target.value) || 1)} className="h-8 w-16 text-center" />
                                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}><PlusCircle className="h-4 w-4"/></Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">{item.stock}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        ) : (
             <div className="h-64 border-2 border-dashed rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">스캔 대기 중...</p>
            </div>
        )}
        <Button onClick={handleProcess} className="w-full" size="lg" disabled={list.length === 0} variant={activeTab === 'stock-out' ? 'destructive' : 'default'}>
            {activeTab === 'stock-in' ? '입고 완료' : '출고 완료'}
        </Button>
    </div>
  )


  return (
    <Card>
      <CardHeader>
        <CardTitle>재고 입출고</CardTitle>
        <CardDescription>핸디 스캐너로 바코드를 스캔하여 자재의 입고 및 출고를 처리합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>바코드 스캐너</CardTitle>
                <Barcode className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex gap-2">
                 <Input 
                    ref={inputRef}
                    autoFocus
                    placeholder="바코드를 스캔하거나 입력하세요..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyDown={handleKeyDown}
                 />
                 <Button onClick={handleScan}><Search className="h-4 w-4 mr-2"/> 조회</Button>
               </div>
               <p className="text-sm text-muted-foreground">
                핸디 스캐너 사용 시, 스캔 후 자동으로 다음 단계로 진행됩니다.
               </p>
            </CardContent>
          </Card>
          <Card>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="stock-in">입고</TabsTrigger>
                    <TabsTrigger value="stock-out">출고</TabsTrigger>
                </TabsList>
                <TabsContent value="stock-in" className="mt-4">
                    {renderList(stockInList, 'stock-in')}
                </TabsContent>
                <TabsContent value="stock-out" className="mt-4">
                    {renderList(stockOutList, 'stock-out')}
                </TabsContent>
            </Tabs>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
