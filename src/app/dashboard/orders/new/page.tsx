
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { MinusCircle, PlusCircle, Trash2, Store, Search, Calendar as CalendarIcon, Loader2, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches, Branch } from "@/hooks/use-branches";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useOrders, OrderData, Order } from "@/hooks/use-orders";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useProducts, Product } from "@/hooks/use-products";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";


interface OrderItem extends Product {
  quantity: number;
}

type OrderType = "store" | "phone" | "naver" | "kakao" | "etc";
type ReceiptType = "pickup" | "delivery";
type MessageType = "card" | "ribbon";
type PaymentMethod = "card" | "cash" | "transfer" | "mainpay" | "shopping_mall" | "epay";
type PaymentStatus = "pending" | "completed";


declare global {
  interface Window {
    daum: any;
  }
}

export default function NewOrderPage() {
  const { branches } = useBranches();
  const { products: allProducts, loading: productsLoading } = useProducts();
  const { orders, addOrder, loading: isSubmitting } = useOrders();
  const router = useRouter();

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const { toast } = useToast();
  
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [deliveryFeeType, setDeliveryFeeType] = useState<"auto" | "manual">("auto");
  const [manualDeliveryFee, setManualDeliveryFee] = useState(0);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  
  const [ordererName, setOrdererName] = useState("");
  const [ordererContact, setOrdererContact] = useState("");
  const [ordererCompany, setOrdererCompany] = useState("");
  const [ordererEmail, setOrdererEmail] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  const [orderType, setOrderType] = useState<OrderType>("phone");
  const [receiptType, setReceiptType] = useState<ReceiptType>("delivery");
  
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(new Date());
  const [scheduleTime, setScheduleTime] = useState("10:00");
  
  const [pickerName, setPickerName] = useState("");
  const [pickerContact, setPickerContact] = useState("");

  const [recipientName, setRecipientName] = useState("");
  const [recipientContact, setRecipientContact] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryAddressDetail, setDeliveryAddressDetail] = useState("");

  const [messageType, setMessageType] = useState<MessageType>("card");
  const [messageContent, setMessageContent] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("completed");

  const [showTodaysOrders, setShowTodaysOrders] = useState(false);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [productFilter, setProductFilter] = useState({ mainCategory: 'all', midCategory: 'all' });

  const branchProducts = useMemo(() => {
    if (!selectedBranch) return [];
    return allProducts.filter(p => p.branch === selectedBranch.name);
  }, [allProducts, selectedBranch]);

  const mainCategories = useMemo(() => ['all', ...new Set(branchProducts.map(p => p.mainCategory))], [branchProducts]);
  const midCategories = useMemo(() => {
      if (productFilter.mainCategory === 'all') {
          return ['all', ...new Set(branchProducts.map(p => p.midCategory))];
      }
      return ['all', ...new Set(branchProducts.filter(p => p.mainCategory === productFilter.mainCategory).map(p => p.midCategory))];
  }, [branchProducts, productFilter.mainCategory]);

  const filteredProductsForSearch = useMemo(() => {
      return branchProducts.filter(p => 
          (productFilter.mainCategory === 'all' || p.mainCategory === productFilter.mainCategory) &&
          (productFilter.midCategory === 'all' || p.midCategory === productFilter.midCategory)
      );
  }, [branchProducts, productFilter]);


  const todaysOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return orders.filter(order => {
        const orderDate = order.orderDate.toDate();
        orderDate.setHours(0,0,0,0);
        return orderDate.getTime() === today.getTime();
    })
  }, [orders])

  useEffect(() => {
    if (receiptType === 'pickup') {
      setPickerName(ordererName);
      setPickerContact(ordererContact);
    }
  }, [ordererName, ordererContact, receiptType]);

  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 8) {
        return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    }
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
  }

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const formattedPhoneNumber = formatPhoneNumber(e.target.value);
    setter(formattedPhoneNumber);
  }

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
    setSelectedDistrict(null);
  }, [selectedBranch]);


  const handleAddProduct = (product: Product) => {
    const existingItem = orderItems.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        updateItemQuantity(product.id, existingItem.quantity + 1);
      } else {
        toast({ variant: 'destructive', title: '재고 부족', description: '더 이상 추가할 수 없습니다.' });
      }
    } else {
       if (product.stock > 0) {
        setOrderItems([...orderItems, { ...product, quantity: 1 }]);
      } else {
         toast({ variant: 'destructive', title: '재고 없음', description: '이 상품은 현재 재고가 없습니다.' });
      }
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

  const handleCompleteOrder = async () => {
    if (orderItems.length === 0) {
      toast({ variant: 'destructive', title: '주문 오류', description: '주문할 상품을 추가해주세요.' });
      return;
    }
    if (!selectedBranch) {
        toast({ variant: 'destructive', title: '주문 오류', description: '출고 지점을 선택해주세요.' });
        return;
    }
    
    const newOrder: OrderData = {
        branchId: selectedBranch.id,
        branchName: selectedBranch.name,
        orderDate: new Date(),
        status: 'processing', // "processing", "completed", "canceled"
        
        items: orderItems.map(({id, name, quantity, price}) => ({id, name, quantity, price})),
        summary: orderSummary,

        orderer: { name: ordererName, contact: ordererContact, company: ordererCompany, email: ordererEmail },
        isAnonymous: isAnonymous,
        orderType,
        receiptType,

        payment: {
            method: paymentMethod,
            status: paymentStatus,
        },

        pickupInfo: receiptType === 'pickup' ? { 
            date: scheduleDate ? format(scheduleDate, "yyyy-MM-dd") : '', 
            time: scheduleTime, 
            pickerName, 
            pickerContact 
        } : null,
        
        deliveryInfo: receiptType === 'delivery' ? { 
            date: scheduleDate ? format(scheduleDate, "yyyy-MM-dd") : '', 
            time: scheduleTime,
            recipientName, 
            recipientContact, 
            address: `${deliveryAddress} ${deliveryAddressDetail}`,
            district: selectedDistrict ?? '',
        } : null,

        message: { type: messageType, content: messageContent },
        request: specialRequest,
    };

    await addOrder(newOrder);
    router.push('/dashboard/orders');
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
          setDeliveryAddressDetail('');

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
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">완료</Badge>;
      case 'processing':
        return <Badge variant="secondary">처리중</Badge>;
      case 'canceled':
        return <Badge variant="destructive">취소</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
                        <Select onValueChange={handleBranchChange}>
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
                            <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                                <PopoverTrigger asChild>
                                <Button variant="outline" className="mt-2 w-full" disabled={productsLoading}>
                                    {productsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4"/>}
                                    상품 검색 및 추가
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[600px] p-0" align="start">
                                    <Command
                                      filter={(value, search, keywords) => {
                                          const lowerCaseSearch = search.toLowerCase();
                                          const valueAndKeywords = `${value.toLowerCase()} ${keywords?.join(' ')}`.trim();
                                          return valueAndKeywords.includes(lowerCaseSearch) ? 1 : 0;
                                      }}
                                    >
                                        <div className="flex items-center border-b px-3">
                                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                            <CommandInput placeholder="상품명 또는 ID로 검색..." className="h-11 border-0 pl-0" />
                                        </div>
                                         <div className="flex items-center gap-2 border-b p-2">
                                            <Select 
                                                value={productFilter.mainCategory} 
                                                onValueChange={(value) => setProductFilter({ mainCategory: value, midCategory: 'all' })}>
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="대분류" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {mainCategories.map(cat => <SelectItem key={cat} value={cat}>{cat === 'all' ? '전체 대분류' : cat}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <Select 
                                                value={productFilter.midCategory} 
                                                onValueChange={(value) => setProductFilter(prev => ({...prev, midCategory: value}))}>
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="중분류" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {midCategories.map(cat => <SelectItem key={cat} value={cat}>{cat === 'all' ? '전체 중분류' : cat}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <CommandList>
                                            <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                                            <CommandGroup>
                                            {filteredProductsForSearch.map((product) => (
                                                <CommandItem
                                                    key={product.id}
                                                    value={product.name}
                                                    keywords={[product.id]}
                                                    onSelect={() => {
                                                        handleAddProduct(product);
                                                        setIsSearchOpen(false);
                                                    }}
                                                    disabled={product.stock === 0}
                                                    className="flex justify-between"
                                                >
                                                  <div>
                                                    <p>{product.name} <span className="text-xs text-muted-foreground">{product.id}</span></p>
                                                    <p className="text-xs text-muted-foreground">가격: ₩{product.price.toLocaleString()} | 재고: {product.stock}</p>
                                                  </div>
                                                  {orderItems.some(item => item.id === product.id) && <CheckCircle className="h-5 w-5 text-primary"/>}
                                                </CommandItem>
                                            ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            </CardContent>
                          </Card>
                      </div>

                       {/* 결제 정보 */}
                      <div>
                          <Label>결제 정보</Label>
                          <Card className="mt-2">
                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">결제 수단</Label>
                                    <RadioGroup value={paymentMethod} onValueChange={(v: PaymentMethod) => setPaymentMethod(v)} className="flex items-center flex-wrap gap-4 mt-2">
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="card" id="pay-card" /><Label htmlFor="pay-card">카드</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="cash" id="pay-cash" /><Label htmlFor="pay-cash">현금</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="transfer" id="pay-transfer" /><Label htmlFor="pay-transfer">계좌이체</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="mainpay" id="pay-mainpay" /><Label htmlFor="pay-mainpay">메인페이</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="shopping_mall" id="pay-mall" /><Label htmlFor="pay-mall">쇼핑몰</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="epay" id="pay-epay" /><Label htmlFor="pay-epay">이페이</Label></div>
                                    </RadioGroup>
                                </div>
                                 <div>
                                    <Label className="text-xs text-muted-foreground">결제 상태</Label>
                                    <RadioGroup value={paymentStatus} onValueChange={(v: PaymentStatus) => setPaymentStatus(v)} className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="pending" id="status-pending" /><Label htmlFor="status-pending">미결</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="completed" id="status-completed" /><Label htmlFor="status-completed">완결</Label></div>
                                    </RadioGroup>
                                </div>
                            </CardContent>
                          </Card>
                      </div>

                      {/* 주문자 정보 */}
                      <div>
                          <Label>주문자 정보</Label>
                          <Card className="mt-2">
                              <CardContent className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        <Input id="orderer-contact" placeholder="010-1234-5678" value={ordererContact} onChange={(e) => handleContactChange(e, setOrdererContact)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="orderer-email">이메일</Label>
                                        <Input id="orderer-email" type="email" placeholder="email@example.com" value={ordererEmail} onChange={e => setOrdererEmail(e.target.value)} />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 mt-4">
                                  <Checkbox id="anonymous" checked={isAnonymous} onCheckedChange={(checked) => setIsAnonymous(!!checked)} />
                                  <label
                                    htmlFor="anonymous"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    익명으로 보내기 (인수증에 주문자 정보 미표시)
                                  </label>
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
                                                      className={cn("w-full justify-start text-left font-normal", !scheduleDate && "text-muted-foreground")}
                                                  >
                                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                                      {scheduleDate ? format(scheduleDate, "PPP") : <span>날짜 선택</span>}
                                                  </Button>
                                                  </PopoverTrigger>
                                                  <PopoverContent className="w-auto p-0">
                                                  <Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} initialFocus />
                                                  </PopoverContent>
                                              </Popover>
                                              <Select value={scheduleTime} onValueChange={setScheduleTime}>
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
                                          <Input id="picker-contact" value={pickerContact} onChange={(e) => handleContactChange(e, setPickerContact)} />
                                      </div>
                                  </CardContent>
                              </Card>
                          )}

                          {receiptType === 'delivery' && (
                              <Card className="mt-2">
                                  <CardContent className="p-4 space-y-4">
                                      <div className="space-y-2">
                                          <Label>배송일시</Label>
                                          <div className="flex gap-2">
                                              <Popover>
                                                  <PopoverTrigger asChild>
                                                  <Button
                                                      variant={"outline"}
                                                      className={cn("w-full justify-start text-left font-normal", !scheduleDate && "text-muted-foreground")}
                                                  >
                                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                                      {scheduleDate ? format(scheduleDate, "PPP") : <span>날짜 선택</span>}
                                                  </Button>
                                                  </PopoverTrigger>
                                                  <PopoverContent className="w-auto p-0">
                                                  <Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} initialFocus />
                                                  </PopoverContent>
                                              </Popover>
                                              <Select value={scheduleTime} onValueChange={setScheduleTime}>
                                                  <SelectTrigger className="w-[120px]">
                                                      <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                      {Array.from({length: 12}, (_, i) => `${10+i}:00`).map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                                                  </SelectContent>
                                              </Select>
                                          </div>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                              <Label htmlFor="recipient-name">받는 분 이름</Label>
                                              <Input id="recipient-name" placeholder="이름 입력" value={recipientName} onChange={e => setRecipientName(e.target.value)} />
                                          </div>
                                          <div className="space-y-2">
                                              <Label htmlFor="recipient-contact">받는 분 연락처</Label>
                                              <Input id="recipient-contact" placeholder="010-1234-5678" value={recipientContact} onChange={(e) => handleContactChange(e, setRecipientContact)} />
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
                    <CardFooter className="flex-col gap-2 items-stretch">
                        <Button className="w-full" size="lg" onClick={handleCompleteOrder} disabled={orderItems.length === 0 || !selectedBranch || isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            주문 완료
                        </Button>
                    </CardFooter>
                </Card>
            </div>
          </div>
          
          <div className="mt-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>오늘 주문 현황</CardTitle>
                        <CardDescription>오늘 접수된 주문 목록입니다.</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setShowTodaysOrders(prev => !prev)}>
                        {showTodaysOrders ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                        {showTodaysOrders ? "숨기기" : "오늘 주문 현황 보기"}
                    </Button>
                </CardHeader>
                {showTodaysOrders && (
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>주문ID</TableHead>
                                    <TableHead>주문자</TableHead>
                                    <TableHead>받는분</TableHead>
                                    <TableHead>상태</TableHead>
                                    <TableHead className="text-right">총액</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {todaysOrders.length > 0 ? todaysOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                                        <TableCell>{order.orderer.name}</TableCell>
                                        <TableCell>{order.deliveryInfo?.recipientName || order.pickupInfo?.pickerName || '-'}</TableCell>
                                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        <TableCell className="text-right">₩{order.summary.total.toLocaleString()}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            오늘 접수된 주문이 없습니다.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                )}
            </Card>
        </div>

        </fieldset>
    </div>
  );
}
