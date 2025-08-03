
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { MinusCircle, PlusCircle, Trash2, Store, Search, Calendar as CalendarIcon, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches, Branch, initialBranches } from "@/hooks/use-branches";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
// 20번째 줄 - 이것은 유지
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useOrders, OrderData, Order } from "@/hooks/use-orders";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useProducts, Product } from "@/hooks/use-products";
import { useCustomers, Customer } from "@/hooks/use-customers";
import { useAuth } from "@/hooks/use-auth";
import { Timestamp } from "firebase/firestore";
import { debounce } from "lodash";
import { updateBranchesWithDeliveryFees } from "@/scripts/update-branches-delivery-fees";

interface OrderItem extends Product {
  quantity: number;
}

type OrderType = "store" | "phone" | "naver" | "kakao" | "etc";
type ReceiptType = "pickup" | "delivery";
type MessageType = "card" | "ribbon";
type PaymentMethod = "card" | "cash" | "transfer" | "mainpay" | "shopping_mall" | "epay";
type PaymentStatus = "pending" | "paid";

declare global {
  interface Window {
    daum: any;
  }
}

export default function NewOrderPage() {
  const { user } = useAuth();
  const { branches, loading: branchesLoading, fetchBranches } = useBranches();
  const [isUpdatingDeliveryFees, setIsUpdatingDeliveryFees] = useState(false);
  const { products: allProducts, loading: productsLoading } = useProducts();
  const { orders, loading: ordersLoading, addOrder, updateOrder } = useOrders();
  const { findCustomersByContact, customers } = useCustomers();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');

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
  const [registerCustomer, setRegisterCustomer] = useState(true);

  const [contactSearchResults, setContactSearchResults] = useState<Customer[]>([]);
  const [isContactSearchOpen, setIsContactSearchOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [usedPoints, setUsedPoints] = useState(0);
  
  // 고객 검색 관련 상태
  const [customerSearch, setCustomerSearch] = useState({
    company: "",
    name: "",
    contact: ""
  });
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);

  
  const [orderType, setOrderType] = useState<OrderType>("store");
  const [receiptType, setReceiptType] = useState<ReceiptType>("pickup");
  
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
  const [messageSender, setMessageSender] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");

  const [showTodaysOrders, setShowTodaysOrders] = useState(false);
  const [existingOrder, setExistingOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedMidCategory, setSelectedMidCategory] = useState<string | null>(null);

  // 배송비 정보 업데이트 함수
  const handleUpdateDeliveryFees = async () => {
    setIsUpdatingDeliveryFees(true);
    try {
      const result = await updateBranchesWithDeliveryFees();
      if (result.success) {
        toast({
          title: '성공',
          description: `${result.updatedCount}개 지점의 배송비 정보가 업데이트되었습니다.`,
        });
        // 지점 데이터 새로고침
        await fetchBranches();
      } else {
        toast({
          variant: 'destructive',
          title: '오류',
          description: '배송비 정보 업데이트 중 오류가 발생했습니다.',
        });
      }
    } catch (error) {
      console.error('배송비 업데이트 오류:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '배송비 정보 업데이트 중 오류가 발생했습니다.',
      });
    } finally {
      setIsUpdatingDeliveryFees(false);
    }
  };

  const timeOptions = useMemo(() => {
    const options = [];
    for (let h = 7; h <= 22; h++) {
        for (let m = 0; m < 60; m += 30) {
            if (h === 7 && m < 30) continue;
            if (h === 22 && m > 0) continue;
            const hour = String(h).padStart(2, '0');
            const minute = String(m).padStart(2, '0');
            options.push(`${hour}:${minute}`);
        }
    }
    return options;
  }, []);

  const branchProducts = useMemo(() => {
    if (!selectedBranch) return [];
    return allProducts.filter(p => p.branch === selectedBranch.name);
  }, [allProducts, selectedBranch]);

  const mainCategories = useMemo(() => [...new Set(branchProducts.map(p => p.mainCategory))], [branchProducts]);
  const midCategories = useMemo(() => {
    if (!selectedMainCategory) return [];
    return [...new Set(branchProducts.filter(p => p.mainCategory === selectedMainCategory).map(p => p.midCategory))];
  }, [branchProducts, selectedMainCategory]);

  const filteredProducts = useMemo(() => {
    return branchProducts.filter(p => 
        (!selectedMainCategory || p.mainCategory === selectedMainCategory) &&
        (!selectedMidCategory || p.midCategory === selectedMidCategory)
    );
  }, [branchProducts, selectedMainCategory, selectedMidCategory]);

  const todaysOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return orders.filter(order => {
      if (!selectedBranch || order.branchName !== selectedBranch.name) return false;
      const orderDate = (order.orderDate as Timestamp).toDate();
      orderDate.setHours(0,0,0,0);
      return orderDate.getTime() === today.getTime();
    })
  }, [orders, selectedBranch]);

  // 사용자 역할에 따른 자동 지점 선택
  useEffect(() => {
    if (user && branches.length > 0 && !selectedBranch) {
      // 본사 관리자가 아닌 경우 해당 지점 자동 선택
      if (user.role !== '본사 관리자' && user.franchise && user.franchise !== '본사') {
        const userBranch = branches.find(branch => branch.name === user.franchise);
        if (userBranch) {
          setSelectedBranch(userBranch);
        }
      }
    }
  }, [user, branches, selectedBranch]);

  useEffect(() => {
      if (orderId && !ordersLoading && orders.length > 0 && !productsLoading && allProducts.length > 0 && !branchesLoading && branches.length > 0) {
        const foundOrder = orders.find(o => o.id === orderId);
        if(foundOrder) {
            setExistingOrder(foundOrder);
            const branch = branches.find(b => b.id === foundOrder.branchId);
            setSelectedBranch(branch || null);

            setOrderItems(foundOrder.items.map(item => {
                const product = allProducts.find(p => p.id === item.id && p.branch === foundOrder.branchName);
                return { ...product!, quantity: item.quantity };
            }).filter(item => item.id)); 
            
            if(foundOrder.deliveryInfo?.district && foundOrder.deliveryInfo.district !== '') {
                setDeliveryFeeType("auto");
                setSelectedDistrict(foundOrder.deliveryInfo.district);
            } else {
                setDeliveryFeeType("manual");
                setManualDeliveryFee(foundOrder.summary.deliveryFee);
            }
            
            setOrdererName(foundOrder.orderer.name);
            setOrdererContact(foundOrder.orderer.contact);
            setOrdererCompany(foundOrder.orderer.company || "");
            setOrdererEmail(foundOrder.orderer.email || "");
            setIsAnonymous(foundOrder.isAnonymous);

            setOrderType(foundOrder.orderType);
            setReceiptType(foundOrder.receiptType);
            
            const schedule = foundOrder.pickupInfo || foundOrder.deliveryInfo;
            if(schedule) {
              setScheduleDate(schedule.date ? new Date(schedule.date) : new Date());
              setScheduleTime(schedule.time);
            }
            
            if(foundOrder.pickupInfo){
              setPickerName(foundOrder.pickupInfo.pickerName);
              setPickerContact(foundOrder.pickupInfo.pickerContact);
            }
            
            if(foundOrder.deliveryInfo){
              setRecipientName(foundOrder.deliveryInfo.recipientName);
              setRecipientContact(foundOrder.deliveryInfo.recipientContact);
              setDeliveryAddress(foundOrder.deliveryInfo.address);
              setDeliveryAddressDetail(""); 
            }

            setMessageType(foundOrder.message.type);
            
            // 메시지 내용에서 보내는 사람 분리
            const messageParts = foundOrder.message.content.split('\n---\n');
            if (messageParts.length > 1) {
              setMessageContent(messageParts[0]);
              setMessageSender(messageParts[1]);
            } else {
              setMessageContent(foundOrder.message.content);
              setMessageSender("");
            }
            setSpecialRequest(foundOrder.request || "");

            setPaymentMethod(foundOrder.payment.method);
            setPaymentStatus(foundOrder.payment.status as PaymentStatus);
        }
      }
  }, [orderId, orders, ordersLoading, branches, branchesLoading, allProducts, productsLoading])


  useEffect(() => {
    if (receiptType === 'pickup') {
      setPickerName(ordererName);
      setPickerContact(ordererContact);
      setDeliveryFeeType("manual");
      setManualDeliveryFee(0);
      setSelectedDistrict(null);
    } else if (receiptType === 'delivery') {
      // 배송일 경우 기본값을 자동계산으로 설정
      setDeliveryFeeType("auto");
    }
  }, [ordererName, ordererContact, receiptType]);
  
  // 자동계산이 불가능할 경우 직접입력으로 변경하는 로직 추가
  useEffect(() => {
    if (receiptType === 'delivery' && deliveryFeeType === 'auto') {
      // 지점이 선택되지 않았거나 배송비 정보가 없는 경우
      if (!selectedBranch || !selectedBranch.deliveryFees || selectedBranch.deliveryFees.length === 0) {
        setDeliveryFeeType("manual");
        setManualDeliveryFee(0);
      }
    }
  }, [selectedBranch, deliveryFeeType, receiptType]);
  
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

  const debouncedSearch = useCallback(
    debounce(async (contact: string) => {
      if (contact.length >= 4) {
        const results = await findCustomersByContact(contact);
        setContactSearchResults(results);
        if (results.length > 0) {
            setIsContactSearchOpen(true);
        } else {
            setIsContactSearchOpen(false);
        }
      } else {
        setContactSearchResults([]);
        setIsContactSearchOpen(false);
      }
    }, 300),
    [findCustomersByContact]
  );
  
const handleOrdererContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const formattedPhoneNumber = formatPhoneNumber(e.target.value);
  setOrdererContact(formattedPhoneNumber);
  
  // 고객 검색 실행
  if (formattedPhoneNumber.replace(/[^0-9]/g, '').length >= 4) {
    debouncedSearch(formattedPhoneNumber);
  } else {
    setContactSearchResults([]);
    setIsContactSearchOpen(false);
    setSelectedCustomer(null);
  }
};

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

  const handleGenericContactChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const formattedPhoneNumber = formatPhoneNumber(e.target.value);
    setter(formattedPhoneNumber);
  }

  const handleAddProduct = (docId: string) => {
    const productToAdd = branchProducts.find(p => p.docId === docId);
    if (!productToAdd) return;

    setOrderItems(prevItems => {
        const existingItem = prevItems.find(item => item.docId === productToAdd.docId);
        if (existingItem) {
            const newQuantity = existingItem.quantity + 1;
            if (newQuantity > existingItem.stock) {
                toast({ variant: 'destructive', title: '재고 부족', description: `최대 주문 가능 수량은 ${existingItem.stock}개 입니다.` });
                return prevItems;
            }
            return prevItems.map(item => item.docId === productToAdd.docId ? { ...item, quantity: newQuantity } : item);
        } else {
             if (productToAdd.stock < 1) {
                toast({ variant: 'destructive', title: '재고 없음', description: '선택하신 상품은 재고가 없습니다.' });
                return prevItems;
            }
            return [...prevItems, { ...productToAdd, quantity: 1 }];
        }
    });
  };

  const updateItemQuantity = (docId: string, newQuantity: number) => {
    const itemToUpdate = orderItems.find(item => item.docId === docId);
    if (!itemToUpdate) return;
    
    if (newQuantity > 0 && newQuantity <= itemToUpdate.stock) {
      setOrderItems(orderItems.map(item => item.docId === docId ? { ...item, quantity: newQuantity } : item));
    } else if (newQuantity > itemToUpdate.stock) {
        toast({ variant: 'destructive', title: '재고 부족', description: `최대 주문 가능 수량은 ${itemToUpdate.stock}개 입니다.` });
    }
  };

  const removeItem = (docId: string) => {
    setOrderItems(orderItems.filter(item => item.docId !== docId));
  };
  



  const handleCompleteOrder = async () => {
    setIsSubmitting(true);
    if (orderItems.length === 0) {
      toast({ variant: 'destructive', title: '주문 오류', description: '주문할 상품을 추가해주세요.' });
      setIsSubmitting(false);
      return;
    }
    if (!selectedBranch) {
        toast({ variant: 'destructive', title: '주문 오류', description: '출고 지점을 선택해주세요.' });
        setIsSubmitting(false);
        return;
    }
    
    const orderPayload: OrderData = {
        branchId: selectedBranch.id,
        branchName: selectedBranch.name,
        orderDate: existingOrder?.orderDate || new Date(),
        status: existingOrder?.status || 'processing', 
        orderType: orderType,
        receiptType: receiptType,
        
        items: orderItems.map(({id, name, quantity, price}) => ({id, name, quantity, price})),
        summary: orderSummary,

        orderer: { id: selectedCustomer?.id || "", name: ordererName, contact: ordererContact, company: ordererCompany, email: ordererEmail },
        isAnonymous: isAnonymous,
        registerCustomer: registerCustomer,
        payment: {
            method: paymentMethod,
            status: paymentStatus === "paid" ? "completed" : paymentStatus,
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

        message: { 
          type: messageType, 
          content: messageSender ? `${messageContent}\n---\n${messageSender}` : messageContent 
        },
        request: specialRequest,
    };

    try {
      if (existingOrder) {
        await updateOrder(existingOrder.id, orderPayload);
      } else {
        await addOrder(orderPayload);
      }
      router.push('/dashboard/orders');
    } catch (error) {
      // Error is already handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  }

  // 지점 데이터 디버깅을 위한 useEffect 추가
  useEffect(() => {
    if (selectedBranch) {
      console.log('Selected Branch:', selectedBranch);
      console.log('Delivery Fees:', selectedBranch.deliveryFees);
    }
  }, [selectedBranch]);

  const handleBranchChange = (branchId: string) => {
    if (!branchId) {
      setSelectedBranch(null);
      setOrderItems([]);
      setSelectedDistrict(null);
      setSelectedMainCategory(null);
      setSelectedMidCategory(null);
      return;
    }
    
    const branch = branches.find(b => b.id === branchId);
    if (branch) {
      setSelectedBranch(branch);
    }
    setOrderItems([]);
    setSelectedDistrict(null);
    setSelectedMainCategory(null);
    setSelectedMidCategory(null);
  };

const handleCustomerSelect = (customer: Customer) => {
  setSelectedCustomer(customer);
  setOrdererName(customer.name);
  setOrdererCompany(customer.companyName || "");
  setOrdererEmail(customer.email || "");
  setOrdererContact(customer.contact);
  setIsContactSearchOpen(false);
  setUsedPoints(0);
};

const handleCustomerSearch = async () => {
  setCustomerSearchLoading(true);
  try {
    let results = customers;
    
    // 회사명으로 필터링
    if (customerSearch.company) {
      results = results.filter(c => 
        c.companyName?.toLowerCase().includes(customerSearch.company.toLowerCase())
      );
    }
    
    // 주문자명으로 필터링
    if (customerSearch.name) {
      results = results.filter(c => 
        c.name.toLowerCase().includes(customerSearch.name.toLowerCase())
      );
    }
    
    // 연락처 뒷4자리로 필터링
    if (customerSearch.contact) {
      results = results.filter(c => 
        c.contact.replace(/[^0-9]/g, '').endsWith(customerSearch.contact)
      );
    }
    
    setCustomerSearchResults(results);
  } catch (error) {
    console.error('고객 검색 오류:', error);
    toast({
      variant: 'destructive',
      title: '검색 오류',
      description: '고객 검색 중 오류가 발생했습니다.',
    });
  } finally {
    setCustomerSearchLoading(false);
  }
};

  const orderSummary = useMemo(() => {
    const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const maxUsablePoints = selectedCustomer && subtotal >= 5000 ? Math.min(selectedCustomer.points || 0, subtotal) : 0;
    const pointsToUse = Math.min(subtotal, usedPoints, maxUsablePoints);
    const total = subtotal - pointsToUse + deliveryFee;
    const pointsEarned = Math.floor(subtotal * 0.02);

    return { 
      subtotal, 
      deliveryFee, 
      pointsUsed: pointsToUse, 
      pointsEarned, 
      total, 
      discount: 0,
      availablePoints: selectedCustomer?.points || 0,
      maxUsablePoints
    };
  }, [orderItems, deliveryFee, usedPoints, selectedCustomer]);

  const handleUseAllPoints = () => {
    if (!selectedCustomer) return;
    const maxPoints = Math.min(selectedCustomer.points || 0, orderSummary.subtotal);
    setUsedPoints(maxPoints);
  };




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

  const pageTitle = existingOrder ? '주문 수정' : '주문테이블';
  const pageDescription = existingOrder ? '기존 주문을 수정합니다.' : '새로운 주문을 등록합니다.';

  const isLoading = ordersLoading || productsLoading || branchesLoading;

  return (
    <div>
        <PageHeader
          title={pageTitle}
          description={pageDescription}
        >
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleUpdateDeliveryFees} disabled={isUpdatingDeliveryFees}>
              {isUpdatingDeliveryFees ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  업데이트 중...
                </>
              ) : (
                '배송비 정보 업데이트'
              )}
            </Button>
          </div>
        </PageHeader>
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>지점 선택</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                  {!selectedBranch ? (
                    <div className="flex items-center gap-2">
                        <Store className="h-5 w-5 text-muted-foreground" />
                        <Select 
                          onValueChange={handleBranchChange} 
                          disabled={isLoading || !!existingOrder || (user?.role !== '본사 관리자')}
                        >
                            <SelectTrigger className="w-[300px]">
                                <SelectValue placeholder={
                                  isLoading ? "지점 불러오는 중..." : 
                                  user?.role !== '본사 관리자' ? `${user?.franchise || '지점'} 자동 선택` : 
                                  "지점 선택"
                                } />
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
                          <span className="text-primary">{selectedBranch.name}</span>
                          {user?.role !== '본사 관리자' && (
                            <Badge variant="secondary" className="ml-2">자동 선택</Badge>
                          )}
                      </p>
                      {user?.role === '본사 관리자' && (
                        <Button variant="outline" size="sm" onClick={() => handleBranchChange("")} disabled={!!existingOrder}>
                            지점 변경
                        </Button>
                      )}
                    </div>
                  )}
              </div>
            </CardContent>
        </Card>

        <fieldset disabled={!selectedBranch || isLoading} className="disabled:opacity-50">
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
                                        <TableRow key={item.docId}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.docId, item.quantity - 1)} disabled={item.quantity <= 1}><MinusCircle className="h-4 w-4"/></Button>
                                                <Input type="number" value={item.quantity} onChange={e => updateItemQuantity(item.docId, parseInt(e.target.value) || 1)} className="h-8 w-12 text-center" />
                                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.docId, item.quantity + 1)} disabled={item.quantity >= item.stock}><PlusCircle className="h-4 w-4"/></Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">₩{item.price.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">₩{(item.price * item.quantity).toLocaleString()}</TableCell>
                                        <TableCell><Button variant="ghost" size="icon" onClick={() => removeItem(item.docId)}><Trash2 className="h-4 w-4 text-destructive"/></Button></TableCell>
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
                            <div className="mt-2 p-2 border-t space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <Select 
                                        value={selectedMainCategory || ""}
                                        onValueChange={(value) => {
                                            setSelectedMainCategory(value);
                                            setSelectedMidCategory(null);
                                        }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="대분류 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {mainCategories.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={selectedMidCategory || ""}
                                        onValueChange={(value) => {
                                            setSelectedMidCategory(value);
                                        }}
                                        disabled={!selectedMainCategory}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="중분류 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {midCategories.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                {productsLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Select onValueChange={handleAddProduct} value="">
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="상품을 선택하여 바로 추가하세요..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredProducts.map(p => (
                                                <SelectItem key={p.docId} value={p.docId} disabled={p.stock === 0}>
                                                    {p.name} - ₩{p.price.toLocaleString()} (재고: {p.stock})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                </div>
                            </div>
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
                                    <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="flex items-center flex-wrap gap-4 mt-2">
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
                                    <RadioGroup value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PaymentStatus)} className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="pending" id="status-pending" /><Label htmlFor="status-pending">결제대기</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="paid" id="status-paid" /><Label htmlFor="status-paid">결제완료</Label></div>
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
                                {/* 고객 검색 섹션 */}
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                  <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-medium text-gray-900">고객 검색</h4>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => {
                                        setSelectedCustomer(null);
                                        setUsedPoints(0);
                                      }}
                                      disabled={!selectedCustomer}
                                    >
                                      고객 선택 해제
                                    </Button>
                                  </div>
                                  
                                  {!selectedCustomer ? (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="space-y-2">
                                          <Label className="text-xs">회사명</Label>
                                          <Input 
                                            placeholder="회사명으로 검색"
                                            value={customerSearch.company || ""}
                                            onChange={(e) => setCustomerSearch(prev => ({ ...prev, company: e.target.value }))}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-xs">주문자명</Label>
                                          <Input 
                                            placeholder="주문자명으로 검색"
                                            value={customerSearch.name || ""}
                                            onChange={(e) => setCustomerSearch(prev => ({ ...prev, name: e.target.value }))}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-xs">연락처 뒷4자리</Label>
                                          <Input 
                                            placeholder="연락처 뒷4자리"
                                            value={customerSearch.contact || ""}
                                            onChange={(e) => setCustomerSearch(prev => ({ ...prev, contact: e.target.value }))}
                                          />
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button 
                                          onClick={handleCustomerSearch}
                                          disabled={customerSearchLoading}
                                          className="flex-1"
                                        >
                                          {customerSearchLoading ? (
                                            <>
                                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                              검색 중...
                                            </>
                                          ) : (
                                            <>
                                              <Search className="mr-2 h-4 w-4" />
                                              고객 검색
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                      
                                      {/* 검색 결과 */}
                                      {customerSearchResults.length > 0 && (
                                        <div className="mt-4">
                                          <Label className="text-xs text-muted-foreground mb-2 block">검색 결과</Label>
                                          <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {customerSearchResults.map(customer => (
                                              <div 
                                                key={customer.id}
                                                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                                onClick={() => handleCustomerSelect(customer)}
                                              >
                                                <div className="flex justify-between items-start">
                                                  <div className="flex-1">
                                                    <p className="font-medium">{customer.name}</p>
                                                    {customer.companyName && (
                                                      <p className="text-sm text-gray-600">{customer.companyName}</p>
                                                    )}
                                                    <p className="text-sm text-gray-500">{customer.contact}</p>
                                                    {customer.email && (
                                                      <p className="text-sm text-gray-500">{customer.email}</p>
                                                    )}
                                                  </div>
                                                  <div className="text-right">
                                                    <p className="text-sm font-medium text-blue-600">
                                                      {(customer.points || 0).toLocaleString()} P
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <p className="font-medium text-blue-900">{selectedCustomer.name}</p>
                                          {selectedCustomer.companyName && (
                                            <p className="text-sm text-blue-700">{selectedCustomer.companyName}</p>
                                          )}
                                          {selectedCustomer.email && (
                                            <p className="text-sm text-blue-600">{selectedCustomer.email}</p>
                                          )}
                                          <p className="text-sm text-blue-600 font-medium mt-1">
                                            보유 포인트: {(selectedCustomer.points || 0).toLocaleString()} P
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="orderer-company">회사명</Label>
                                        <Input 
                                            id="orderer-company" 
                                            placeholder="회사명 입력" 
                                            value={ordererCompany} 
                                            onChange={e => setOrdererCompany(e.target.value)} 
                                            disabled={!!selectedCustomer}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="orderer-name">주문자명</Label>
                                        <Input 
                                            id="orderer-name" 
                                            placeholder="주문자명 입력" 
                                            value={ordererName} 
                                            onChange={e => setOrdererName(e.target.value)}
                                            disabled={!!selectedCustomer}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="orderer-contact">주문자 연락처</Label>
                                        <Input 
                                            id="orderer-contact" 
                                            placeholder="010-1234-5678" 
                                            value={ordererContact} 
                                            onChange={(e) => handleGenericContactChange(e, setOrdererContact)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="orderer-email">이메일</Label>
                                        <Input 
                                            id="orderer-email" 
                                            type="email" 
                                            placeholder="email@example.com" 
                                            value={ordererEmail} 
                                            onChange={e => setOrdererEmail(e.target.value)}
                                            disabled={!!selectedCustomer}
                                        />
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
                                <div className="flex items-center space-x-2 mt-4">
                                  <Checkbox id="register-customer" checked={registerCustomer} onCheckedChange={(checked) => setRegisterCustomer(!!checked)} />
                                  <label
                                    htmlFor="register-customer"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    이 주문자 정보를 고객으로 등록/업데이트합니다
                                  </label>
                                </div>
                              </CardContent>
                          </Card>
                      </div>

                      {/* 수령 정보 */}
                      <div>
                          <Label>수령 정보</Label>
                          <RadioGroup value={receiptType} onValueChange={(v) => setReceiptType(v as ReceiptType)} className="flex items-center gap-4 mt-2">
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
                                                      {scheduleDate ? format(scheduleDate, "PPP", { locale: ko }) : <span>날짜 선택</span>}
                                                  </Button>
                                                  </PopoverTrigger>
                                                  <PopoverContent className="w-auto p-0">
                                                  <Calendar locale={ko} mode="single" selected={scheduleDate} onSelect={setScheduleDate} initialFocus />
                                                  </PopoverContent>
                                              </Popover>
                                              <Select value={scheduleTime} onValueChange={setScheduleTime}>
                                                  <SelectTrigger className="w-[120px]">
                                                      <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                      {timeOptions.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
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
                                          <Input id="picker-contact" value={pickerContact} onChange={(e) => handleGenericContactChange(e, setPickerContact)} />
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
                                                      {scheduleDate ? format(scheduleDate, "PPP", { locale: ko }) : <span>날짜 선택</span>}
                                                  </Button>
                                                  </PopoverTrigger>
                                                  <PopoverContent className="w-auto p-0">
                                                  <Calendar locale={ko} mode="single" selected={scheduleDate} onSelect={setScheduleDate} initialFocus />
                                                  </PopoverContent>
                                              </Popover>
                                              <Select value={scheduleTime} onValueChange={setScheduleTime}>
                                                  <SelectTrigger className="w-[120px]">
                                                      <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                      {timeOptions.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
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
                                              <Input id="recipient-contact" placeholder="010-1234-5678" value={recipientContact} onChange={(e) => handleGenericContactChange(e, setRecipientContact)} />
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
                                          <RadioGroup value={deliveryFeeType} className="flex items-center gap-4" onValueChange={(value) => setDeliveryFeeType(value as "auto" | "manual")}>
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
                                              {deliveryFeeType === 'auto' ? (
                                                  <div className="space-y-2 w-full">
                                                      <Select onValueChange={setSelectedDistrict} value={selectedDistrict ?? ''} disabled={!selectedBranch}>
                                                          <SelectTrigger>
                                                              <SelectValue placeholder={!selectedBranch ? "지점을 먼저 선택하세요" : "지역 선택"} />
                                                          </SelectTrigger>
                                                          <SelectContent>
                                                              {selectedBranch?.deliveryFees && selectedBranch.deliveryFees.length > 0 ? (
                                                                  selectedBranch.deliveryFees.map(df => (
                                                                      <SelectItem key={df.district} value={df.district}>
                                                                          {df.district} - ₩{df.fee.toLocaleString()}
                                                                      </SelectItem>
                                                                  ))
                                                              ) : (
                                                                  <SelectItem value="no-data" disabled>
                                                                      배송비 정보가 없습니다
                                                                  </SelectItem>
                                                              )}
                                                          </SelectContent>
                                                      </Select>
                                                      {selectedDistrict && selectedBranch?.deliveryFees && (
                                                          <div className="text-xs text-green-600 bg-green-50 p-2 rounded border">
                                                              ✅ 선택된 지역: {selectedDistrict} - ₩{deliveryFee.toLocaleString()}
                                                          </div>
                                                      )}
                                                      {(!selectedBranch?.deliveryFees || selectedBranch.deliveryFees.length === 0) && (
                                                          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border">
                                                              ⚠️ 이 지점에는 배송비 정보가 설정되지 않았습니다. 직접 입력을 사용하세요.
                                                          </div>
                                                      )}
                                                  </div>
                                              ) : (
                                                  <div className="flex items-center gap-2">
                                                      <span className="text-sm">₩</span>
                                                      <Input
                                                          type="number"
                                                          placeholder="배송비 입력"
                                                          value={manualDeliveryFee}
                                                          onChange={(e) => setManualDeliveryFee(Number(e.target.value))}
                                                          className="w-32"
                                                      />
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  </CardContent>
                              </Card>
                          )}
                      </div>
                      
                      {/* 메시지 */}
                      <div className="space-y-3">
                          <Label>메시지</Label>
                          <RadioGroup value={messageType} onValueChange={(v) => setMessageType(v as MessageType)} className="flex items-center gap-4 mt-2">
                              <div className="flex items-center space-x-2"><RadioGroupItem value="card" id="msg-card" /><Label htmlFor="msg-card">카드 메시지</Label></div>
                              <div className="flex items-center space-x-2"><RadioGroupItem value="ribbon" id="msg-ribbon" /><Label htmlFor="msg-ribbon">리본 메시지</Label></div>
                          </RadioGroup>
                          <div>
                              <Label htmlFor="message-content">메시지 내용</Label>
                              <Textarea 
                                  id="message-content" 
                                  placeholder={messageType === 'card' ? "카드 메시지 내용을 입력하세요." : "리본 문구(좌/우)를 입력하세요."} 
                                  className="mt-2" 
                                  value={messageContent} 
                                  onChange={e => setMessageContent(e.target.value)} 
                              />
                          </div>
                          <div>
                              <Label htmlFor="message-sender">보내는 사람</Label>
                              <Input 
                                  id="message-sender" 
                                  placeholder="보내는 사람 이름을 입력하세요" 
                                  className="mt-2" 
                                  value={messageSender} 
                                  onChange={e => setMessageSender(e.target.value)} 
                              />
                          </div>
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
                <Card>
                    <CardHeader>
                        <CardTitle>주문 요약</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* 기존 주문 요약 내용 */}
                        <div className="flex justify-between">
                            <span>상품 합계</span>
                            <span>₩{orderSummary.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>배송비</span>
                            <span>₩{deliveryFee.toLocaleString()}</span>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                            <Label>포인트 사용</Label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    type="number" 
                                    value={usedPoints}
                                    onChange={(e) => {
                                      const value = Number(e.target.value);
                                      const maxPoints = orderSummary.maxUsablePoints;
                                      setUsedPoints(Math.min(Math.max(0, value), maxPoints));
                                    }}
                                    max={orderSummary.maxUsablePoints}
                                    disabled={!selectedCustomer || orderSummary.availablePoints === 0 || orderSummary.subtotal < 5000}
                                    placeholder={selectedCustomer ? 
                                      (orderSummary.subtotal >= 5000 ? "사용할 포인트 입력" : "5천원 이상 주문 시 사용 가능") : 
                                      "고객을 먼저 선택하세요"
                                    }
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={handleUseAllPoints} 
                                  disabled={!selectedCustomer || orderSummary.availablePoints === 0 || orderSummary.subtotal < 5000}
                                >
                                  전액 사용
                                </Button>
                            </div>
                            {selectedCustomer ? (
                              <div className="text-xs space-y-1">
                                <p className="text-muted-foreground">
                                  보유 포인트: <span className="font-medium text-blue-600">{orderSummary.availablePoints.toLocaleString()} P</span>
                                </p>
                                {orderSummary.subtotal >= 5000 ? (
                                  <p className="text-muted-foreground">
                                    사용 가능: <span className="font-medium text-green-600">{orderSummary.maxUsablePoints.toLocaleString()} P</span>
                                  </p>
                                ) : (
                                  <p className="text-muted-foreground text-amber-600">
                                    ⚠️ 5천원 이상 주문 시 포인트 사용 가능
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                고객을 선택하면 포인트를 사용할 수 있습니다.
                              </p>
                            )}
                        </div>
                        <div className="flex justify-between text-muted-foreground text-sm">
                            <span>포인트 할인</span>
                            <span className="text-destructive">-₩{orderSummary.pointsUsed.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground text-sm">
                            <span>적립 예정 포인트</span>
                            <span>{orderSummary.pointsEarned.toLocaleString()} P</span>
                        </div>

                        <Separator />

                        <div className="flex justify-between font-bold text-lg">
                            <span>총 결제 금액</span>
                            <span>₩{orderSummary.total.toLocaleString()}</span>
                        </div>
                        
                        {/* 주문등록 버튼을 총결제금액 아래에 추가 */}
                        <div className="pt-4">
                            <Button onClick={handleCompleteOrder} disabled={isSubmitting} className="w-full">
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {existingOrder ? "수정 중..." : "등록 중..."}
                                </>
                              ) : (
                                existingOrder ? "주문 수정" : "주문 등록"
                              )}
                            </Button>
                        </div>
                    </CardContent>

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