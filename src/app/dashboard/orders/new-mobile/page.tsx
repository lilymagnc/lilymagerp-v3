"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, Trash2, Store, Search, Calendar as CalendarIcon, ChevronRight, User, MapPin, CreditCard, ShoppingBag, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches, Branch } from "@/hooks/use-branches";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useOrders, OrderData } from "@/hooks/use-orders";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useProducts, Product } from "@/hooks/use-products";
import { useCustomers, Customer } from "@/hooks/use-customers";
import { useAuth } from "@/hooks/use-auth";
import { useDiscountSettings } from "@/hooks/use-discount-settings";
import { serverTimestamp } from "firebase/firestore";
import { debounce } from "lodash";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

interface OrderItem extends Product {
    quantity: number;
    isCustomProduct?: boolean;
}

type ReceiptType = "store_pickup" | "pickup_reservation" | "delivery_reservation";
type PaymentMethod = "card" | "cash" | "transfer" | "mainpay" | "shopping_mall" | "epay";
type PaymentStatus = "pending" | "paid" | "completed" | "split_payment";
type MessageType = "card" | "ribbon";

declare global {
    interface Window {
        daum: any;
    }
}

export default function NewOrderMobilePage() {
    const { user } = useAuth();
    const { branches, loading: branchesLoading } = useBranches();
    const { products: allProducts, loading: productsLoading } = useProducts();
    const { addOrder } = useOrders();
    const { findCustomersByContact, customers } = useCustomers();
    const { discountSettings, canApplyDiscount, getActiveDiscountRates } = useDiscountSettings();
    const { toast } = useToast();
    const router = useRouter();

    // --- STATE ---
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

    // Custom Product
    const [isCustomProductDialogOpen, setIsCustomProductDialogOpen] = useState(false);
    const [customProductName, setCustomProductName] = useState("");
    const [customProductPrice, setCustomProductPrice] = useState("");
    const [customProductQuantity, setCustomProductQuantity] = useState(1);

    // Orderer
    const [ordererName, setOrdererName] = useState("");
    const [ordererContact, setOrdererContact] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isAnonymous, setIsAnonymous] = useState(false);

    // Fulfillment
    const [receiptType, setReceiptType] = useState<ReceiptType>("store_pickup");
    const [scheduleDate, setScheduleDate] = useState<Date | undefined>(new Date());
    const [scheduleTime, setScheduleTime] = useState("10:00"); // Default time
    const [recipientName, setRecipientName] = useState("");
    const [recipientContact, setRecipientContact] = useState("");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [deliveryAddressDetail, setDeliveryAddressDetail] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [manualDeliveryFee, setManualDeliveryFee] = useState(0);
    const [deliveryFeeType, setDeliveryFeeType] = useState<"auto" | "manual">("auto");

    // Message
    const [messageType, setMessageType] = useState<MessageType>("card");
    const [messageContent, setMessageContent] = useState("");
    const [messageSender, setMessageSender] = useState("");

    // Payment
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");
    // Discount
    const [selectedDiscountRate, setSelectedDiscountRate] = useState<number>(0);
    const [customDiscountRate, setCustomDiscountRate] = useState<number>(0);

    const [usedPoints, setUsedPoints] = useState(0);

    // Common Recipient State (used for both Picker and Delivery Recipient)
    const [isSameAsOrderer, setIsSameAsOrderer] = useState(true);

    // Sync Orderer to Recipient if checkbox checked
    useEffect(() => {
        if (isSameAsOrderer) {
            setRecipientName(ordererName);
            setRecipientContact(ordererContact);
        }
    }, [isSameAsOrderer, ordererName, ordererContact]);

    // UI State
    const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);
    const [activeCategoryTab, setActiveCategoryTab] = useState("flower");
    const [customerSearchQuery, setCustomerSearchQuery] = useState("");
    const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
    const [isCustomerSheetOpen, setIsCustomerSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- DERIVED STATE ---
    const isAdmin = user?.role === '본사 관리자';
    const userBranch = user?.franchise;

    // Filtered Products
    const branchProducts = useMemo(() => {
        if (!selectedBranch) return [];
        return allProducts.filter(p => p.branch === selectedBranch.name);
    }, [allProducts, selectedBranch]);

    const categorizedProducts = useMemo(() => {
        return {
            flower: branchProducts.filter(p => p.mainCategory === '플라워'),
            plant: branchProducts.filter(p => p.mainCategory === '플랜트'),
            wreath: branchProducts.filter(p => p.mainCategory?.includes('화환') || p.midCategory?.includes('화환') || p.name.includes('화환')),
            material: branchProducts.filter(p => p.mainCategory === '자재'),
            other: branchProducts.filter(p => !['플라워', '플랜트', '자재'].includes(p.mainCategory) && !p.name.includes('화환'))
        };
    }, [branchProducts]);

    // Totals
    const orderSummary = useMemo(() => {
        const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

        // Discount Logic
        const appliedDiscountRate = selectedDiscountRate > 0 ? selectedDiscountRate : customDiscountRate;
        const discountAmount = Math.floor(subtotal * (appliedDiscountRate / 100));

        // Delivery Fee logic
        let deliveryFee = 0;
        if (receiptType === 'delivery_reservation') {
            if (deliveryFeeType === 'manual') {
                deliveryFee = manualDeliveryFee;
            } else if (selectedBranch && selectedDistrict) {
                const feeInfo = selectedBranch.deliveryFees?.find(df => df.district === selectedDistrict);
                deliveryFee = feeInfo ? feeInfo.fee : (selectedBranch.deliveryFees?.find(df => df.district === "기타")?.fee ?? 0);
            }
        }

        const discountedSubtotal = subtotal - discountAmount;

        // Points Validation
        const canUsePoints = selectedCustomer && discountedSubtotal >= 5000;
        const maxUsablePoints = canUsePoints ? Math.min(selectedCustomer.points || 0, discountedSubtotal) : 0;
        const actualUsedPoints = Math.min(usedPoints, maxUsablePoints);

        const finalTotal = discountedSubtotal + deliveryFee - actualUsedPoints;

        return { subtotal, discountAmount, discountRate: appliedDiscountRate, deliveryFee, finalTotal, maxUsablePoints, actualUsedPoints, canUsePoints };
    }, [orderItems, selectedDiscountRate, customDiscountRate, receiptType, deliveryFeeType, manualDeliveryFee, selectedBranch, selectedDistrict, usedPoints, selectedCustomer]);


    // --- EFFECTS ---
    useEffect(() => {
        if (!isAdmin && userBranch && !selectedBranch && branches.length > 0) {
            const userBranchData = branches.find(branch => branch.name === userBranch);
            if (userBranchData) setSelectedBranch(userBranchData);
        }
    }, [isAdmin, userBranch, selectedBranch, branches]);

    // --- HANDLERS ---
    const handleAddProduct = (product: Product) => {
        setOrderItems(prev => {
            const existing = prev.find(i => i.docId === product.docId);
            if (existing) {
                return prev.map(i => i.docId === product.docId ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        // Remove toast to reduce noise, visual feedback is enough
        // toast({ description: `${product.name} 추가됨` });
    };

    const updateQuantity = (docId: string, delta: number) => {
        setOrderItems(prev => prev.map(item => {
            if (item.docId === docId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeProduct = (docId: string) => {
        setOrderItems(prev => prev.filter(i => i.docId !== docId));
    };

    const handleCustomerSearch = useCallback(debounce(async (query: string) => {
        if (query.length < 2) return;
        const results = await findCustomersByContact(query); // using contact search for name too effectively? or need separate?
        // The existing hook findCustomersByContact actually searches by contact mainly. 
        // Let's reuse the logic from the main page if possible, or just use the filtered list from 'customers'
        const searchTerm = query.toLowerCase();
        const filtered = customers.filter(c =>
            c.name.includes(searchTerm) ||
            c.contact.includes(searchTerm) ||
            c.companyName?.includes(searchTerm)
        );
        setCustomerSearchResults(filtered);
    }, 300), [customers]);

    const selectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setOrdererName(customer.name);
        setOrdererContact(customer.contact);
        setIsCustomerSheetOpen(false);
    };

    const handleAddressSearch = () => {
        if (window.daum && window.daum.Postcode) {
            new window.daum.Postcode({
                oncomplete: function (data: any) {
                    let fullAddress = data.address;
                    let extraAddress = '';
                    if (data.addressType === 'R') {
                        if (data.bname !== '') extraAddress += data.bname;
                        if (data.buildingName !== '') extraAddress += (extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName);
                        fullAddress += (extraAddress !== '' ? ` (${extraAddress})` : '');
                    }
                    setDeliveryAddress(fullAddress);
                    setDeliveryAddressDetail('');

                    const district = data.sigungu;
                    if (selectedBranch?.deliveryFees?.some(df => df.district === district)) {
                        setSelectedDistrict(district);
                        setDeliveryFeeType('auto');
                    } else {
                        setSelectedDistrict("기타");
                    }
                }
            }).open();
        }
    };

    const handleAddCustomProduct = () => {
        if (!customProductName || !customProductPrice) return;
        const price = parseInt(customProductPrice.replace(/[^0-9]/g, "")) || 0;
        const newItem: OrderItem = {
            docId: `custom-${Date.now()}`,
            name: customProductName,
            price: price,
            stock: 999,
            branch: selectedBranch?.name || "",
            mainCategory: "기타",
            midCategory: "수동입력",
            quantity: customProductQuantity,
            isCustomProduct: true
        } as any;

        handleAddProduct(newItem);
        setCustomProductName("");
        setCustomProductPrice("");
        setCustomProductQuantity(1);
        setIsCustomProductDialogOpen(false);
    };

    const handleUseAllPoints = () => {
        setUsedPoints(orderSummary.maxUsablePoints);
    };

    const handleSubmit = async () => {
        if (!selectedBranch) return toast({ variant: 'destructive', title: "지점 선택 필요" });
        if (orderItems.length === 0) return toast({ variant: 'destructive', title: "상품을 담아주세요" });

        setIsSubmitting(true);
        try {
            const orderPayload: OrderData = {
                branchId: selectedBranch.id,
                branchName: selectedBranch.name,
                orderDate: new Date(),
                status: 'processing',
                orderType: 'store', // Defaulting for mobile, maybe add selector later
                receiptType,
                items: orderItems,
                summary: {
                    subtotal: orderSummary.subtotal,
                    discountAmount: orderSummary.discountAmount,
                    discountRate: orderSummary.discountRate,
                    deliveryFee: orderSummary.deliveryFee,
                    pointsUsed: orderSummary.actualUsedPoints,
                    pointsEarned: 0, // Simplified for beta
                    total: orderSummary.finalTotal,
                },
                orderer: {
                    id: selectedCustomer?.id || "",
                    name: ordererName,
                    contact: ordererContact,
                    company: "", // Simplified
                    email: ""
                },
                isAnonymous,
                registerCustomer: !!selectedCustomer, // Auto register if selected
                payment: {
                    method: paymentMethod,
                    status: paymentStatus,
                    completedAt: (paymentStatus === 'paid' || paymentStatus === 'completed') ? serverTimestamp() as any : undefined,
                    isSplitPayment: false
                },
                pickupInfo: (receiptType !== 'delivery_reservation') ? {
                    date: scheduleDate ? format(scheduleDate, "yyyy-MM-dd") : '',
                    time: scheduleTime,
                    pickerName: recipientName || ordererName, // Use recipientName (Picker) if set, else fallback
                    pickerContact: recipientContact || ordererContact
                } : null,
                deliveryInfo: receiptType === 'delivery_reservation' ? {
                    date: scheduleDate ? format(scheduleDate, "yyyy-MM-dd") : '',
                    time: scheduleTime,
                    recipientName,
                    recipientContact,
                    address: `${deliveryAddress} ${deliveryAddressDetail}`,
                    district: selectedDistrict || ''
                } : null,
                message: {
                    type: messageType,
                    content: messageSender ? `${messageContent}\n---\n${messageSender}` : messageContent
                },
                request: ""
            };

            await addOrder(orderPayload);
            toast({ title: "주문 접수 완료!" });
            router.push('/dashboard/orders');
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: "주문 실패", description: "다시 시도해주세요." });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDER ---
    return (
        <div className="pb-32 bg-gray-50 min-h-screen">
            {/* 1. Header & Branch */}
            <div className="bg-white p-4 sticky top-0 z-10 shadow-sm border-b">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="font-bold text-lg">모바일 주문접수(Beta)</h1>
                    <Button variant="ghost" size="sm" onClick={() => router.back()}><X className="h-5 w-5" /></Button>
                </div>
                {!selectedBranch ? (
                    <Select onValueChange={(v) => {
                        const b = branches.find(b => b.id === v);
                        if (b) setSelectedBranch(b);
                    }}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="지점을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                            {branches.filter(b => b.type !== '본사').map(b => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium" onClick={() => isAdmin && setSelectedBranch(null)}>
                        <Store className="h-4 w-4" />
                        {selectedBranch.name}
                        {isAdmin && <span className="text-xs text-gray-400 ml-auto">(변경)</span>}
                    </div>
                )}
            </div>

            <div className="p-4 space-y-4">
                {/* 2. Orderer Info */}
                <Card>
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base flex justify-between items-center">
                            주문자 정보
                            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setIsCustomerSheetOpen(true)}>
                                <Search className="h-3 w-3 mr-1" /> 고객검색
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-3">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Label className="text-xs text-muted-foreground">이름</Label>
                                <Input value={ordererName} onChange={e => setOrdererName(e.target.value)} className="h-9" />
                            </div>
                            <div className="flex-[1.5]">
                                <Label className="text-xs text-muted-foreground">연락처</Label>
                                <Input value={ordererContact} onChange={e => setOrdererContact(e.target.value)} type="tel" className="h-9" />
                            </div>
                        </div>
                        {selectedCustomer && (
                            <div className="bg-green-50 p-2 rounded text-xs text-green-700 flex justify-between">
                                <span>보유 포인트: {selectedCustomer.points?.toLocaleString() ?? 0}P</span>
                                <span className="font-bold" onClick={() => setSelectedCustomer(null)}>x</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. Products List */}
                <Card>
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">주문 상품</CardTitle>
                        <Button size="sm" onClick={() => setIsProductSheetOpen(true)} disabled={!selectedBranch}>
                            + 상품 추가
                        </Button>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        {orderItems.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground text-sm bg-gray-50 rounded-lg border border-dashed">
                                상품을 추가해주세요
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {orderItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border shadow-sm">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{item.name}</div>
                                            <div className="text-xs text-muted-foreground">{item.price.toLocaleString()}원</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.docId, -1)}><Minus className="h-3 w-3" /></Button>
                                            <span className="w-4 text-center text-sm font-medium">{item.quantity}</span>
                                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.docId, 1)}><Plus className="h-3 w-3" /></Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => removeProduct(item.docId)}><Trash2 className="h-3 w-3" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 4. Fulfillment (Tabs) */}
                <Card>
                    <Tabs value={receiptType} onValueChange={(v) => setReceiptType(v as ReceiptType)} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 p-1">
                            <TabsTrigger value="store_pickup" className="text-xs">매장픽업</TabsTrigger>
                            <TabsTrigger value="pickup_reservation" className="text-xs">픽업예약</TabsTrigger>
                            <TabsTrigger value="delivery_reservation" className="text-xs">배송예약</TabsTrigger>
                        </TabsList>

                        <div className="p-4 space-y-4">
                            {/* Date/Time Common */}
                            {(receiptType !== 'store_pickup') && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs">날짜</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal h-9", !scheduleDate && "text-muted-foreground")}>
                                                    {scheduleDate ? format(scheduleDate, "MM-dd") : <span>선택</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} disabled={(date) => date < new Date("1900-01-01")} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div>
                                        <Label className="text-xs">시간</Label>
                                        <Select value={scheduleTime} onValueChange={setScheduleTime}>
                                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 30 }, (_, i) => {
                                                    const h = Math.floor(i / 2) + 9;
                                                    const m = i % 2 === 0 ? "00" : "30";
                                                    return `${h}:${m}`;
                                                }).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {/* Common Receiver Info (For all types) */}
                            <div className="space-y-3 pt-2 border-t">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold">
                                        {receiptType === 'delivery_reservation' ? '받는 분' : '수령인 정보'}
                                    </Label>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="same-as-orderer"
                                            checked={isSameAsOrderer}
                                            onCheckedChange={(c) => {
                                                setIsSameAsOrderer(c as boolean);
                                                if (!c) { // if unchecked clear values
                                                    setRecipientName("");
                                                    setRecipientContact("");
                                                } else {
                                                    setRecipientName(ordererName);
                                                    setRecipientContact(ordererContact);
                                                }
                                            }}
                                        />
                                        <Label htmlFor="same-as-orderer" className="text-xs font-normal">주문자와 동일</Label>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Input
                                            value={recipientName}
                                            onChange={e => {
                                                setRecipientName(e.target.value);
                                                setIsSameAsOrderer(false);
                                            }}
                                            placeholder="이름"
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="flex-[1.5]">
                                        <Input
                                            value={recipientContact}
                                            onChange={e => {
                                                setRecipientContact(e.target.value);
                                                setIsSameAsOrderer(false);
                                            }}
                                            type="tel"
                                            placeholder="연락처"
                                            className="h-9"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Address */}
                            {receiptType === 'delivery_reservation' && (
                                <div className="space-y-3 pt-2 border-t">
                                    <div>
                                        <Label className="text-xs">배송지</Label>
                                        <div className="flex gap-2">
                                            <Input value={deliveryAddress} readOnly className="h-9 flex-1 bg-gray-50 text-xs" />
                                            <Button variant="outline" size="sm" onClick={handleAddressSearch} className="h-9 px-3">
                                                <Search className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <Input value={deliveryAddressDetail} onChange={e => setDeliveryAddressDetail(e.target.value)} placeholder="상세주소" className="mt-2 h-9 text-xs" />
                                    </div>
                                    <div className="bg-orange-50 p-2 rounded text-xs text-orange-800 flex justify-between items-center">
                                        <span>배송비</span>
                                        <span className="font-bold">{orderSummary.deliveryFee.toLocaleString()}원</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Tabs>
                </Card>

                {/* 5. Message & Payment */}
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <div>
                            <Label className="text-xs font-medium mb-2 block">메시지</Label>
                            <RadioGroup defaultValue="card" onValueChange={(v) => setMessageType(v as MessageType)} className="flex gap-4 mb-2">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="card" id="m1" /><Label htmlFor="m1" className="text-xs">카드</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="ribbon" id="m2" /><Label htmlFor="m2" className="text-xs">리본</Label></div>
                            </RadioGroup>
                            <Textarea placeholder="내용 입력" className="h-20 text-sm" value={messageContent} onChange={e => setMessageContent(e.target.value)} />
                        </div>

                        <Separator />

                        {/* Discount Section */}
                        {selectedBranch && canApplyDiscount(selectedBranch.id, orderSummary.subtotal) && (
                            <div>
                                <Label className="text-xs font-medium mb-2 block">할인 적용</Label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {getActiveDiscountRates(selectedBranch.id).map((rate) => (
                                        <Button
                                            key={rate.rate}
                                            variant={selectedDiscountRate === rate.rate ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => {
                                                setSelectedDiscountRate(rate.rate);
                                                setCustomDiscountRate(0);
                                            }}
                                            className="text-xs h-8"
                                        >
                                            {rate.label}
                                        </Button>
                                    ))}
                                    <div className="flex items-center gap-1 border rounded px-2 bg-white">
                                        <Input
                                            type="number"
                                            placeholder="직접"
                                            className="border-0 h-8 w-12 text-center p-0 text-xs focus-visible:ring-0"
                                            value={customDiscountRate || ''}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setCustomDiscountRate(val);
                                                if (val > 0) setSelectedDiscountRate(0);
                                            }}
                                        />
                                        <span className="text-xs text-muted-foreground">%</span>
                                    </div>
                                </div>
                                {orderSummary.discountAmount > 0 && (
                                    <div className="text-right text-xs text-green-600 font-bold mb-2">
                                        -{orderSummary.discountAmount.toLocaleString()}원 할인
                                    </div>
                                )}
                            </div>
                        )}

                        <Separator />

                        {/* Points Section */}
                        {selectedCustomer && (
                            <div>
                                <Label className="text-xs font-medium mb-2 flex justify-between">
                                    포인트 사용
                                    <span className="text-muted-foreground font-normal">보유: {selectedCustomer.points?.toLocaleString() ?? 0}P</span>
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        value={usedPoints || ''}
                                        onChange={(e) => setUsedPoints(Number(e.target.value))}
                                        placeholder="사용 포인트"
                                        className="h-9 text-right"
                                    />
                                    <Button variant="outline" size="sm" onClick={handleUseAllPoints} className="whitespace-nowrap h-9">전액사용</Button>
                                </div>
                                {!orderSummary.canUsePoints && selectedCustomer.points && selectedCustomer.points > 0 && (
                                    <p className="text-[10px] text-amber-600 mt-1">※ 5,000원 이상 결제 시 사용 가능</p>
                                )}
                            </div>
                        )}

                        <Separator />

                        <div>
                            <Label className="text-xs font-medium mb-2 block">결제 수단</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {["card", "cash", "transfer", "mainpay", "epay", "shopping_mall"].map((m) => (
                                    <div key={m}
                                        className={cn("border rounded p-2 text-center text-xs font-medium cursor-pointer transition-colors",
                                            paymentMethod === m ? "bg-primary text-white border-primary" : "bg-white hover:bg-gray-50")}
                                        onClick={() => setPaymentMethod(m as PaymentMethod)}
                                    >
                                        {m === 'card' ? '카드' : m === 'cash' ? '현금' : m === 'transfer' ? '이체' : m === 'mainpay' ? '메인' : m === 'epay' ? '이페이' : '쇼핑몰'}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
                            <span className="text-xs">결제 상태</span>
                            <Switch checked={paymentStatus === 'paid'} onCheckedChange={(c) => setPaymentStatus(c ? 'paid' : 'pending')} />
                            <span className={cn("text-xs font-bold", paymentStatus === 'paid' ? "text-green-600" : "text-gray-500")}>
                                {paymentStatus === 'paid' ? '결제완료' : '미수금'}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sticky Bottom Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-20 safe-area-bottom">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-gray-500">총 결제금액</span>
                    <span className="text-xl font-bold text-primary">{orderSummary.finalTotal.toLocaleString()}원</span>
                </div>
                <Button className="w-full h-12 text-lg font-bold" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "처리중..." : "주문 접수하기"}
                </Button>
            </div>


            {/* --- SHEETS --- */}

            {/* Product Selection Sheet */}
            <Sheet open={isProductSheetOpen} onOpenChange={setIsProductSheetOpen}>
                <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0 rounded-t-xl">
                    <SheetHeader className="p-4 border-b flex flex-row items-center justify-between">
                        <div>
                            <SheetTitle>상품 선택</SheetTitle>
                            <SheetDescription className="hidden">상품을 선택해주세요</SheetDescription>
                        </div>
                        <Dialog open={isCustomProductDialogOpen} onOpenChange={setIsCustomProductDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="secondary" size="sm" className="h-8 text-xs">직접 입력</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xs rounded-lg">
                                <DialogHeader>
                                    <DialogTitle>수동 상품 추가</DialogTitle>
                                    <DialogDescription>목록에 없는 상품을 직접 입력합니다.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3 py-2">
                                    <div>
                                        <Label className="text-xs">상품명</Label>
                                        <Input value={customProductName} onChange={e => setCustomProductName(e.target.value)} placeholder="예: 장미 꽃다발" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">가격</Label>
                                        <Input type="number" value={customProductPrice} onChange={e => setCustomProductPrice(e.target.value)} placeholder="0" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">수량</Label>
                                        <Input type="number" value={customProductQuantity} onChange={e => setCustomProductQuantity(Number(e.target.value))} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAddCustomProduct}>추가하기</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </SheetHeader>
                    <Tabs defaultValue="flower" value={activeCategoryTab} onValueChange={setActiveCategoryTab} className="flex-1 flex flex-col min-h-0">
                        <TabsList className="grid grid-cols-4 mx-4 mt-2">
                            <TabsTrigger value="flower">플라워</TabsTrigger>
                            <TabsTrigger value="plant">플랜트</TabsTrigger>
                            <TabsTrigger value="wreath">화환</TabsTrigger>
                            <TabsTrigger value="other">기타</TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-y-auto p-4">
                            {Object.entries(categorizedProducts).map(([key, products]) => (
                                <TabsContent key={key} value={key} className="mt-0 grid grid-cols-2 gap-3">
                                    {products.map(p => {
                                        const selectedItem = orderItems.find(item => item.docId === p.docId);
                                        const quantity = selectedItem?.quantity || 0;

                                        return (
                                            <div key={p.docId}
                                                className={cn(
                                                    "flex flex-col border rounded-lg p-3 transition-all relative overflow-hidden",
                                                    quantity > 0 ? "border-blue-500 bg-blue-50" : "active:bg-gray-50"
                                                )}
                                                onClick={() => { handleAddProduct(p); }}
                                            >
                                                {quantity > 0 && (
                                                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                                                        {quantity}개 선택됨
                                                    </div>
                                                )}
                                                <span className={cn("font-semibold text-sm truncate", quantity > 0 && "text-blue-700")}>{p.name}</span>
                                                <span className="text-xs text-gray-500">{p.price.toLocaleString()}원</span>
                                                <span className="text-[10px] text-gray-400 mt-1">재고: {p.stock}</span>
                                            </div>
                                        )
                                    })}
                                    {products.length === 0 && <div className="col-span-2 text-center text-gray-400 py-10">상품이 없습니다</div>}
                                </TabsContent>
                            ))}
                        </div>
                    </Tabs>
                    {orderItems.length > 0 && (
                        <div className="p-4 border-t bg-white safe-area-bottom">
                            <Button className="w-full relative" onClick={() => setIsProductSheetOpen(false)}>
                                <span className="absolute left-4 bg-white/20 px-2 py-0.5 rounded text-xs">
                                    {orderItems.length}개 상품
                                </span>
                                선택 완료
                                <span className="absolute right-4 text-xs opacity-90">
                                    합계: {orderItems.reduce((acc, i) => acc + (i.price * i.quantity), 0).toLocaleString()}원
                                </span>
                            </Button>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Customer Search Sheet */}
            <Sheet open={isCustomerSheetOpen} onOpenChange={setIsCustomerSheetOpen}>
                <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0 rounded-t-xl">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle>고객 검색</SheetTitle>
                        <SheetDescription className="hidden">고객을 검색해주세요</SheetDescription>
                        <Input placeholder="이름 또는 전화번호 검색" value={customerSearchQuery} onChange={(e) => {
                            setCustomerSearchQuery(e.target.value);
                            handleCustomerSearch(e.target.value);
                        }} className="mt-2" />
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto p-4">
                        {customerSearchResults.map(c => (
                            <div key={c.id} className="py-3 border-b flex justify-between items-center" onClick={() => selectCustomer(c)}>
                                <div>
                                    <div className="font-bold">{c.name}</div>
                                    <div className="text-sm text-gray-500">{c.contact}</div>
                                </div>
                                <Badge variant="outline">{c.points?.toLocaleString() ?? 0}P</Badge>
                            </div>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>

        </div >
    );
}
