
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { MinusCircle, PlusCircle, Trash2, Store } from "lucide-react";
import { AddProductDialog } from "./components/add-product-dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches, Branch, DeliveryFee } from "@/hooks/use-branches";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  stock: number;
}

export default function NewOrderPage() {
  const { branches } = useBranches();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [deliveryFeeType, setDeliveryFeeType] = useState<"auto" | "manual">("auto");
  const [manualDeliveryFee, setManualDeliveryFee] = useState(0);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const deliveryFee = useMemo(() => {
    if (deliveryFeeType === 'manual') {
      return manualDeliveryFee;
    }
    if (!selectedBranch || !selectedDistrict) {
      return 0;
    }
    const feeInfo = selectedBranch.deliveryFees?.find(df => df.district === selectedDistrict);
    return feeInfo ? feeInfo.fee : 0;
  }, [deliveryFeeType, manualDeliveryFee, selectedBranch, selectedDistrict]);


  useEffect(() => {
    // Reset district and fee when branch changes
    setSelectedDistrict(null);
  }, [selectedBranch]);


  const handleAddProduct = (product: { id: string, name: string, price: number, stock: number }) => {
    const existingItem = orderItems.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        updateItemQuantity(product.id, existingItem.quantity + 1);
      } else {
        toast({ variant: 'destructive', title: '재고 부족', description: '더 이상 추가할 수 없습니다.' });
      }
    } else {
      setOrderItems([...orderItems, { ...product, quantity: 1 }]);
    }
  };

  const updateItemQuantity = (productId: string, newQuantity: number) => {
    const itemToUpdate = orderItems.find(item => item.id === productId);
    if (!itemToUpdate) return;
    
    if (newQuantity > 0 && newQuantity <= itemToUpdate.stock) {
      setOrderItems(orderItems.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
    } else if (newQuantity > itemToUpdate.stock) {
        toast({ variant: 'destructive', title: '재고 부족', description: `최대 주문 가능 수량은 ${itemToUpdate.stock}개 입니다.` });
    }
  };

  const removeItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== productId));
  };
  
  const orderSummary = useMemo(() => {
    const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const discount = 0; // Placeholder for discount logic
    const total = subtotal - discount + deliveryFee;
    return { subtotal, discount, total, deliveryFee };
  }, [orderItems, deliveryFee]);

  const handleCompleteOrder = () => {
    if (orderItems.length === 0) {
      toast({ variant: 'destructive', title: '주문 오류', description: '주문할 상품을 추가해주세요.' });
      return;
    }
    if (!selectedBranch) {
        toast({ variant: 'destructive', title: '주문 오류', description: '출고 지점을 선택해주세요.' });
        return;
    }
    // In a real app, this would submit the order to the backend
    console.log("Order completed:", { orderItems, summary: orderSummary });
    toast({ title: '주문 완료', description: '주문이 성공적으로 접수되었습니다.' });
    setOrderItems([]);
    setSelectedBranch(null);
    setSelectedDistrict(null);
    setManualDeliveryFee(0);
  }

  const handleBranchChange = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    setSelectedBranch(branch || null);
  }

  return (
    <div>
      <PageHeader
        title="릴리맥 주문테이블"
        description=""
      />
      <Card className="mb-6">
          <CardHeader>
              <CardTitle>지점 선택</CardTitle>
              <CardDescription>주문을 처리할 지점을 선택해주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-muted-foreground" />
                    <Select onValueChange={handleBranchChange} value={selectedBranch?.id ?? ''} disabled={!!selectedBranch}>
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="지점 선택" />
                        </SelectTrigger>
                        <SelectContent>
                            {branches.filter(b => b.type !== '본사').map(branch => (
                                <SelectItem key={branch.id} value={branch.id}>
                                    {branch.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {selectedBranch && (
                    <p className="text-lg font-medium">
                        안녕하세요, <span className="text-primary">{selectedBranch.name}</span>입니다.
                    </p>
                )}
            </div>
          </CardContent>
      </Card>

      <fieldset disabled={!selectedBranch} className="disabled:opacity-50">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
              <Tabs defaultValue="staff-input">
                  <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="staff-input">직원 전체 입력</TabsTrigger>
                      <TabsTrigger value="split-input" disabled>고객-직원 분리 입력</TabsTrigger>
                  </TabsList>
                  <TabsContent value="staff-input">
                      <Card>
                          <CardHeader>
                              <CardTitle>주문 정보</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                      <Label htmlFor="customer-name">고객명</Label>
                                      <Input id="customer-name" placeholder="고객명 입력" />
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="customer-phone">연락처</Label>
                                      <Input id="customer-phone" placeholder="010-1234-5678" />
                                  </div>
                              </div>
                              <div>
                                <Label>배송 정보</Label>
                                  <Card className="mt-2">
                                      <CardContent className="p-4 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label>배송지</Label>
                                              <Select onValueChange={setSelectedDistrict} value={selectedDistrict ?? ''} disabled={!selectedBranch}>
                                                  <SelectTrigger>
                                                      <SelectValue placeholder="지역 선택" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    {selectedBranch?.deliveryFees?.map(df => (
                                                      <SelectItem key={df.district} value={df.district}>
                                                        {df.district}
                                                      </SelectItem>
                                                    ))}
                                                  </SelectContent>
                                              </Select>
                                            </div>
                                             <div className="space-y-2">
                                                  <Label htmlFor="delivery-address">상세 주소</Label>
                                                  <Input id="delivery-address" placeholder="상세 주소 입력" />
                                              </div>
                                        </div>
                                         <div className="space-y-2">
                                            <Label>배송비</Label>
                                            <RadioGroup defaultValue="auto" className="flex items-center gap-4" onValueChange={(value: "auto" | "manual") => setDeliveryFeeType(value)}>
                                              <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="auto" id="auto" />
                                                <Label htmlFor="auto">자동 계산</Label>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="manual" id="manual" />
                                                <Label htmlFor="manual">직접 입력</Label>
                                              </div>
                                            </RadioGroup>
                                            {deliveryFeeType === 'manual' && (
                                              <Input 
                                                type="number" 
                                                placeholder="배송비 직접 입력" 
                                                value={manualDeliveryFee}
                                                onChange={(e) => setManualDeliveryFee(Number(e.target.value))}
                                                className="mt-2"
                                               />
                                            )}
                                         </div>
                                      </CardContent>
                                  </Card>
                              </div>
                              <div>
                                  <Label>주문 상품</Label>
                                  <Card className="mt-2">
                                      <CardContent className="p-2">
                                      <Table>
                                          <TableHeader>
                                              <TableRow>
                                                  <TableHead>상품</TableHead>
                                                  <TableHead className="w-[120px]">수량</TableHead>
                                                  <TableHead className="w-[120px] text-right">단가</TableHead>
                                                  <TableHead className="w-[120px] text-right">합계</TableHead>
                                                  <TableHead className="w-[50px]"></TableHead>
                                              </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                              {orderItems.length > 0 ? (
                                                orderItems.map(item => (
                                                  <TableRow key={item.id}>
                                                    <TableCell>{item.name}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}><MinusCircle className="h-4 w-4"/></Button>
                                                            <Input type="number" value={item.quantity} onChange={e => updateItemQuantity(item.id, parseInt(e.target.value) || 1)} className="h-8 w-12 text-center" />
                                                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}><PlusCircle className="h-4 w-4"/></Button>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">₩{item.price.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">₩{(item.price * item.quantity).toLocaleString()}</TableCell>
                                                    <TableCell><Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></TableCell>
                                                  </TableRow>
                                                ))
                                              ) : (
                                                <TableRow>
                                                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                    상품을 추가해주세요.
                                                  </TableCell>
                                                </TableRow>
                                              )}
                                          </TableBody>
                                      </Table>
                                      <Button variant="outline" className="mt-2 w-full" onClick={() => setIsAddProductDialogOpen(true)}>
                                          <PlusCircle className="mr-2 h-4 w-4"/> 상품 추가
                                      </Button>
                                      </CardContent>
                                  </Card>
                              </div>
                               <div className="space-y-2">
                                  <Label htmlFor="notes">메모</Label>
                                  <Textarea id="notes" placeholder="특별 요청사항을 입력하세요." />
                              </div>
                          </CardContent>
                      </Card>
                  </TabsContent>
                  <TabsContent value="split-input">
                      <Card>
                           <CardHeader>
                              <CardTitle>분리 입력 모드</CardTitle>
                              <CardDescription>고객과 직원이 각자 정보를 입력합니다.</CardDescription>
                          </CardHeader>
                          <CardContent>
                              <p className="text-muted-foreground">이 모드는 개발 예정입니다.</p>
                          </CardContent>
                      </Card>
                  </TabsContent>
              </Tabs>
          </div>

          <div className="md:col-span-1">
              <Card className="sticky top-6">
                  <CardHeader>
                      <CardTitle>주문 요약</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                      <div className="flex justify-between">
                          <span>상품 합계</span>
                          <span>₩{orderSummary.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                          <span>배송비</span>
                          <span>₩{orderSummary.deliveryFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                          <span>할인</span>
                          <span className="text-destructive">-₩{orderSummary.discount.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                          <span>총 결제 금액</span>
                          <span>₩{orderSummary.total.toLocaleString()}</span>
                      </div>
                  </CardContent>
                  <CardFooter>
                      <Button className="w-full" size="lg" onClick={handleCompleteOrder} disabled={orderItems.length === 0 || !selectedBranch}>주문 완료</Button>
                  </CardFooter>
              </Card>
          </div>
        </div>
      </fieldset>
      <AddProductDialog 
        isOpen={isAddProductDialogOpen}
        onOpenChange={setIsAddProductDialogOpen}
        onAddProduct={handleAddProduct}
      />
    </div>
  );
}
