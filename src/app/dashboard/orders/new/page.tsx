
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { MinusCircle, PlusCircle, Trash2, Store, Search, Calendar as CalendarIcon } from "lucide-react";
import { AddProductDialog } from "./components/add-product-dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches, Branch } from "@/hooks/use-branches";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";


interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  stock: number;
}

type OrderType = "store" | "phone" | "naver" | "kakao" | "etc";
type ReceiptType = "pickup" | "delivery";
type MessageType = "card" | "ribbon";

declare global {
  interface Window {
    daum: any;
  }
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
  
  // New state variables for the form overhaul
  const [ordererName, setOrdererName] = useState("");
  const [ordererContact, setOrdererContact] = useState("");
  const [ordererCompany, setOrdererCompany] = useState("");
  const [ordererEmail, setOrdererEmail] = useState("");
  
  const [orderType, setOrderType] = useState<OrderType>("phone");
  const [receiptType, setReceiptType] = useState<ReceiptType>("delivery");
  
  const [pickupDate, setPickupDate] = useState<Date | undefined>(new Date());
  const [pickupTime, setPickupTime] = useState("10:00");
  const [pickerName, setPickerName] = useState("");
  const [pickerContact, setPickerContact] = useState("");

  const [recipientName, setRecipientName] = useState("");
  const [recipientContact, setRecipientContact] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryAddressDetail, setDeliveryAddressDetail] = useState("");

  const [messageType, setMessageType] = useState<MessageType>("card");
  const [messageContent, setMessageContent] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");

  // Auto-fill picker info when orderer info changes
  useEffect(() => {
    if (receiptType === 'pickup') {
      setPickerName(ordererName);
      setPickerContact(ordererContact);
    }
  }, [ordererName, ordererContact, receiptType]);


  const deliveryFee = useMemo(() => {
    if (receiptType === 'pickup') return 0;
    if (deliveryFeeType === 'manual') {
      return manualDeliveryFee;
    }
    if (!selectedBranch || !selectedDistrict) {
      return 0;
    }
    const feeInfo = selectedBranch.deliveryFees?.find(df => df.district === selectedDistrict);
    return feeInfo ? feeInfo.fee : (selectedBranch.deliveryFees?.find(df => df.district === "기타")?.fee ?? 0);
  }, [deliveryFeeType, manualDeliveryFee, selectedBranch, selectedDistrict, receiptType]);


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
    console.log("Order completed:", { 
      branch: selectedBranch.name,
      items: orderItems, 
      summary: orderSummary,
      orderer: { name: ordererName, contact: ordererContact, company: ordererCompany, email: ordererEmail },
      orderType,
      receiptType,
      pickupInfo: receiptType === 'pickup' ? { date: pickupDate, time: pickupTime, pickerName, pickerContact } : null,
      deliveryInfo: receiptType === 'delivery' ? { recipientName, recipientContact, address: `${deliveryAddress} ${deliveryAddressDetail}` } : null,
      message: { type: messageType, content: messageContent },
      request: specialRequest,
     });
    toast({ title: '주문 완료', description: '주문이 성공적으로 접수되었습니다.' });
    setOrderItems([]);
    // Reset all form fields
  }

  const handleBranchChange = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    setSelectedBranch(branch || null);
  }

  const resetBranchSelection = () => {
    setSelectedBranch(null);
    setOrderItems([]);
    setSelectedDistrict(null);
  }

  const handleAddressSearch = () => {
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function(data: any) {
          let fullAddress = data.address;
          let extraAddress = '';

          if (data.addressType === 'R') {
            if (data.bname !== '') {
              extraAddress += data.bname;
            }
            if (data.buildingName !== '') {
              extraAddress += (extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName);
            }
            fullAddress += (extraAddress !== '' ? ` (${extraAddress})` : '');
          }
          
          setDeliveryAddress(fullAddress);

          const district = data.sigungu;
          if(selectedBranch?.deliveryFees?.some(df => df.district === district)) {
            setSelectedDistrict(district);
          } else {
            setSelectedDistrict("기타");
          }
        }
      }).open();
    }
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
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
                {!selectedBranch ? (
                  <div className="flex items-center gap-2">
                      <Store className="h-5 w-5 text-muted-foreground" />
                      <Select onValueChange={handleBranchChange} value={selectedBranch?.id ?? ''}>
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
                ) : (
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-medium">
                        안녕하세요, <span className="text-primary">{selectedBranch.name}</span>입니다.
                    </p>
                    <Button variant="outline" size="sm" onClick={resetBranchSelection}>
                        지점 변경
                    </Button>
                  </div>
                )}
            </div>
          </CardContent>
      </Card>

      <fieldset disabled={!selectedBranch} className="disabled:opacity-50">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>주문 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* 주문 상품 */}
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

                    {/* 주문자 정보 */}
                    <div>
                        <Label>주문자 정보</Label>
                        <Card className="mt-2">
                            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="orderer-company">회사명</Label>
                                    <Input id="orderer-company" placeholder="회사명 입력" value={ordererCompany} onChange={e => setOrdererCompany(e.target.value)} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="orderer-name">주문자명</Label>
                                    <Input id="orderer-name" placeholder="주문자명 입력" value={ordererName} onChange={e => setOrdererName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="orderer-contact">연락처</Label>
                                    <Input id="orderer-contact" placeholder="010-1234-5678" value={ordererContact} onChange={e => setOrdererContact(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="orderer-email">이메일</Label>
                                    <Input id="orderer-email" type="email" placeholder="email@example.com" value={ordererEmail} onChange={e => setOrdererEmail(e.target.value)} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 주문 유형 */}
                     <div>
                        <Label>주문 유형</Label>
                        <RadioGroup value={orderType} onValueChange={(v: OrderType) => setOrderType(v)} className="flex items-center gap-4 mt-2">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="store" id="type-store" /><Label htmlFor="type-store">매장방문</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="phone" id="type-phone" /><Label htmlFor="type-phone">전화</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="naver" id="type-naver" /><Label htmlFor="type-naver">네이버</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="kakao" id="type-kakao" /><Label htmlFor="type-kakao">카카오톡</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="etc" id="type-etc" /><Label htmlFor="type-etc">기타</Label></div>
                        </RadioGroup>
                    </div>

                    {/* 수령 정보 */}
                    <div>
                        <Label>수령 정보</Label>
                         <RadioGroup value={receiptType} onValueChange={(v: ReceiptType) => setReceiptType(v)} className="flex items-center gap-4 mt-2">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="pickup" id="receipt-pickup" /><Label htmlFor="receipt-pickup">매장픽업</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="delivery" id="receipt-delivery" /><Label htmlFor="receipt-delivery">배송</Label></div>
                        </RadioGroup>
                        
                        {receiptType === 'pickup' && (
                             <Card className="mt-2">
                                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label>픽업일시</Label>
                                        <div className="flex gap-2">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn("w-full justify-start text-left font-normal", !pickupDate && "text-muted-foreground")}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {pickupDate ? format(pickupDate, "PPP") : <span>날짜 선택</span>}
                                                </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={pickupDate} onSelect={setPickupDate} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                            <Select value={pickupTime} onValueChange={setPickupTime}>
                                                <SelectTrigger className="w-[120px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({length: 12}, (_, i) => `${10+i}:00`).map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div/>
                                    <div className="space-y-2">
                                        <Label htmlFor="picker-name">픽업자 이름</Label>
                                        <Input id="picker-name" value={pickerName} onChange={e => setPickerName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="picker-contact">픽업자 연락처</Label>
                                        <Input id="picker-contact" value={pickerContact} onChange={e => setPickerContact(e.target.value)} />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {receiptType === 'delivery' && (
                            <Card className="mt-2">
                                <CardContent className="p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="recipient-name">받는 분 이름</Label>
                                            <Input id="recipient-name" placeholder="이름 입력" value={recipientName} onChange={e => setRecipientName(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="recipient-contact">받는 분 연락처</Label>
                                            <Input id="recipient-contact" placeholder="010-1234-5678" value={recipientContact} onChange={e => setRecipientContact(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>배송지</Label>
                                        <div className="flex gap-2">
                                        <Input id="delivery-address" placeholder="주소 검색 버튼을 클릭하세요" value={deliveryAddress} readOnly />
                                        <Button type="button" variant="outline" onClick={handleAddressSearch}>
                                            <Search className="mr-2 h-4 w-4" /> 주소 검색
                                        </Button>
                                        </div>
                                        <Input id="delivery-address-detail" placeholder="상세 주소 입력" value={deliveryAddressDetail} onChange={(e) => setDeliveryAddressDetail(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>배송비</Label>
                                        <RadioGroup value={deliveryFeeType} className="flex items-center gap-4" onValueChange={(value: "auto" | "manual") => setDeliveryFeeType(value)}>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="auto" id="auto" />
                                            <Label htmlFor="auto">자동 계산</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="manual" id="manual" />
                                            <Label htmlFor="manual">직접 입력</Label>
                                        </div>
                                        </RadioGroup>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Select onValueChange={setSelectedDistrict} value={selectedDistrict ?? ''} disabled={!selectedBranch || deliveryFeeType !== 'auto'}>
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
                                            {deliveryFeeType === 'manual' && (
                                            <Input 
                                                type="number" 
                                                placeholder="배송비 직접 입력" 
                                                value={manualDeliveryFee}
                                                onChange={(e) => setManualDeliveryFee(Number(e.target.value))}
                                            />
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    
                    {/* 메시지 */}
                    <div>
                        <Label>메시지</Label>
                         <RadioGroup value={messageType} onValueChange={(v: MessageType) => setMessageType(v)} className="flex items-center gap-4 mt-2">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="card" id="msg-card" /><Label htmlFor="msg-card">카드 메시지</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="ribbon" id="msg-ribbon" /><Label htmlFor="msg-ribbon">리본 메시지</Label></div>
                        </RadioGroup>
                        <Textarea id="message-content" placeholder={messageType === 'card' ? "카드 메시지 내용을 입력하세요." : "리본 문구(좌/우)를 입력하세요."} className="mt-2" value={messageContent} onChange={e => setMessageContent(e.target.value)} />
                    </div>

                     {/* 요청사항 */}
                      <div className="space-y-2">
                          <Label htmlFor="special-request">요청 사항</Label>
                          <Textarea id="special-request" placeholder="특별 요청사항을 입력하세요." value={specialRequest} onChange={e => setSpecialRequest(e.target.value)} />
                      </div>
                </CardContent>
            </Card>
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

    