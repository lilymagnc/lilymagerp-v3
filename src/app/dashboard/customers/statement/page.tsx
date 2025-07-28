
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, Printer } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { useCustomers, Customer } from "@/hooks/use-customers";
import { useBranches, Branch } from "@/hooks/use-branches";
import { useOrders, Order } from "@/hooks/use-orders";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function StatementPage() {
    const { customers, loading: customersLoading } = useCustomers();
    const { branches, loading: branchesLoading } = useBranches();
    const { getOrdersByCustomerAndDateRange, loading: ordersLoading } = useOrders();
    const { toast } = useToast();

    const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
    });

    const [statementData, setStatementData] = useState<{branch: Branch, customer: Customer, orders: Order[]} | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const companyCustomers = useMemo(() => {
        return customers.filter(c => c.type === 'company');
    }, [customers]);

    const handleSearch = async () => {
        if (!selectedBranchId || !selectedCustomerId || !dateRange?.from) {
            toast({
                variant: "destructive",
                title: "입력 오류",
                description: "지점, 고객사, 기간을 모두 선택해주세요.",
            });
            return;
        }

        setIsLoading(true);
        setStatementData(null);
        
        const branch = branches.find(b => b.id === selectedBranchId);
        const customer = customers.find(c => c.id === selectedCustomerId);

        if (!branch || !customer) {
            toast({ variant: "destructive", title: "정보 없음", description: "지점 또는 고객 정보를 찾을 수 없습니다." });
            setIsLoading(false);
            return;
        }

        const orders = await getOrdersByCustomerAndDateRange(customer.id, dateRange.from, dateRange.to || dateRange.from, branch.name);
        
        setStatementData({ branch, customer, orders });
        setIsLoading(false);
    }

    return (
        <div>
            <PageHeader title="거래명세서 발급" description="기간별 거래 내역을 조회하고 명세서를 출력합니다." />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>조회 조건</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="branch-select" className="text-sm font-medium">발급 지점</label>
                                <Select onValueChange={setSelectedBranchId} disabled={branchesLoading}>
                                    <SelectTrigger id="branch-select">
                                        <SelectValue placeholder="지점을 선택하세요..." />
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
                            <div className="space-y-2">
                                <label htmlFor="customer-select" className="text-sm font-medium">고객사</label>
                                <Select onValueChange={setSelectedCustomerId} disabled={customersLoading}>
                                    <SelectTrigger id="customer-select">
                                        <SelectValue placeholder="고객사를 선택하세요..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companyCustomers.map(customer => (
                                            <SelectItem key={customer.id} value={customer.id}>
                                                {customer.companyName} ({customer.name})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="date-range" className="text-sm font-medium">기간</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="date-range"
                                            variant={"outline"}
                                            className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (
                                                dateRange.to ? (
                                                    <>{format(dateRange.from, "yyyy/MM/dd")} - {format(dateRange.to, "yyyy/MM/dd")}</>
                                                ) : (
                                                    format(dateRange.from, "yyyy/MM/dd")
                                                )
                                            ) : (
                                                <span>날짜 범위를 선택하세요</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={dateRange?.from}
                                            selected={dateRange}
                                            onSelect={setDateRange}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <Button className="w-full" onClick={handleSearch} disabled={isLoading || customersLoading || branchesLoading || ordersLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                조회하기
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>거래명세서 미리보기</CardTitle>
                                <CardDescription>출력할 내용을 확인하세요.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" disabled={!statementData}>
                                <Printer className="mr-2 h-4 w-4" />
                                인쇄
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-md min-h-[600px] flex items-center justify-center p-4">
                                {isLoading ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                ) : statementData ? (
                                    <div className="w-full text-sm">
                                        <h2 className="text-2xl font-bold text-center mb-6">거래명세서</h2>
                                        
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="border p-2 rounded-md">
                                                <h3 className="font-semibold border-b pb-1 mb-2">공급자</h3>
                                                <p><strong>상호:</strong> {statementData.branch.name}</p>
                                                <p><strong>대표:</strong> {statementData.branch.manager}</p>
                                                <p><strong>사업자번호:</strong> {statementData.branch.businessNumber}</p>
                                                <p><strong>주소:</strong> {statementData.branch.address}</p>
                                                <p><strong>연락처:</strong> {statementData.branch.phone}</p>
                                            </div>
                                             <div className="border p-2 rounded-md">
                                                <h3 className="font-semibold border-b pb-1 mb-2">공급받는자</h3>
                                                <p><strong>상호:</strong> {statementData.customer.companyName}</p>
                                                <p><strong>대표:</strong> {statementData.customer.ceoName}</p>
                                                <p><strong>사업자번호:</strong> {statementData.customer.businessNumber}</p>
                                                <p><strong>주소:</strong> {statementData.customer.businessAddress}</p>
                                                <p><strong>연락처:</strong> {statementData.customer.contact}</p>
                                            </div>
                                        </div>
                                        
                                        <p className="mb-2"><strong>거래기간:</strong> {dateRange?.from && format(dateRange.from, 'yyyy-MM-dd')} ~ {dateRange?.to && format(dateRange.to, 'yyyy-MM-dd')}</p>
                                        
                                        <p className="text-right mb-2"> (단위: 원) </p>

                                        {/* Future detailed table will go here */}
                                        <div className="border rounded-md min-h-80 flex items-center justify-center">
                                            {statementData.orders.length > 0 ? (
                                                <p>{statementData.orders.length}건의 거래 내역이 있습니다.</p>
                                            ): (
                                                <p className="text-muted-foreground">해당 기간에 거래 내역이 없습니다.</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">지점, 고객사, 기간을 선택하고 조회 버튼을 누르세요.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

```
  </change>
  <change>
    <file>/src/hooks/use-orders.ts</file>
    <content><![CDATA[
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, addDoc, writeBatch, serverTimestamp, Timestamp, query, orderBy, runTransaction, where, updateDoc, getDoc, Firestore, Transaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';
import type { Customer } from './use-customers';

// Simplified version for the form
interface OrderItemForm {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderData {
  branchId: string;
  branchName: string;
  orderDate: Date | Timestamp;
  status: 'processing' | 'completed' | 'canceled';
  
  items: OrderItemForm[];
  summary: {
    subtotal: number;
    discount: number;
    deliveryFee: number;
    total: number;
    pointsUsed: number;
    pointsEarned: number;
  };

  orderer: {
    id?: string;
    name: string;
    contact: string;
    company: string;
    email: string;
  };
  isAnonymous: boolean;
  registerCustomer: boolean;
  orderType: "store" | "phone" | "naver" | "kakao" | "etc";
  receiptType: "pickup" | "delivery";

  payment: {
    method: "card" | "cash" | "transfer" | "mainpay" | "shopping_mall" | "epay";
    status: "pending" | "paid";
  };

  pickupInfo: {
    date: string;
    time: string;
    pickerName: string;
    pickerContact: string;
  } | null;

  deliveryInfo: {
    date: string;
    time: string;
    recipientName: string;
    recipientContact: string;
    address: string;
    district: string;
  } | null;

  message: {
    type: "card" | "ribbon";
    content: string;
  };

  request: string;
}

export interface Order extends Omit<OrderData, 'orderDate'> {
  id: string;
  orderDate: Timestamp;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const ordersCollection = collection(db, 'orders');
      const q = query(ordersCollection, orderBy("orderDate", "desc"));
      const querySnapshot = await getDocs(q);
      
      const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData);

    } catch (error) {
      console.error("Error fetching orders: ", error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '주문 정보를 불러오는 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  const updateCustomerOnOrder = (
    transaction: Transaction,
    customerDocRef: any,
    customerData: Customer,
    orderData: OrderData
  ) => {
    const pointsChange = orderData.summary.pointsEarned - orderData.summary.pointsUsed;
    const updatedData = {
        lastOrderDate: serverTimestamp(),
        totalSpent: (customerData.totalSpent || 0) + orderData.summary.total,
        orderCount: (customerData.orderCount || 0) + 1,
        points: (customerData.points || 0) + pointsChange,
    };
    transaction.update(customerDocRef, updatedData);
  }

  const addCustomerFromOrder = (
    transaction: Transaction,
    orderData: OrderData
  ): string => {
    const { orderer } = orderData;
    const newCustomerData = {
        name: orderer.name,
        contact: orderer.contact,
        email: orderer.email || '',
        companyName: orderer.company || '',
        branch: orderData.branchName,
        type: orderer.company ? 'company' : 'personal',
        lastOrderDate: serverTimestamp(),
        totalSpent: orderData.summary.total,
        orderCount: 1,
        points: orderData.summary.pointsEarned - orderData.summary.pointsUsed,
        grade: '신규',
        createdAt: serverTimestamp(),
        isDeleted: false,
    };
    const newCustomerRef = doc(collection(db, 'customers'));
    transaction.set(newCustomerRef, newCustomerData);
    return newCustomerRef.id;
  }


  const addOrder = async (orderData: OrderData) => {
    setLoading(true);
    
    try {
      await runTransaction(db, async (transaction) => {
        // --- 1. READ PHASE ---
        const productReads = orderData.items.map(async (item) => {
          const productQuery = query(
            collection(db, "products"),
            where("id", "==", item.id),
            where("branch", "==", orderData.branchName)
          );
          // Use getDocs directly inside transaction for reads
          const productSnapshot = await getDocs(productQuery); 
          if (productSnapshot.empty) {
            throw new Error(`상품을 찾을 수 없습니다: '${item.name}' (${orderData.branchName})`);
          }
          const productDocRef = productSnapshot.docs[0].ref;
          const productDoc = await transaction.get(productDocRef);
          if (!productDoc.exists()) {
            throw new Error(`상품 문서를 찾을 수 없습니다: ${item.name}`);
          }
          return { productDocRef, productDoc, item };
        });

        const productsToUpdate = await Promise.all(productReads);

        let customerDocRef;
        let customerDoc;
        if (orderData.registerCustomer && orderData.orderer.id) {
            customerDocRef = doc(db, 'customers', orderData.orderer.id);
            customerDoc = await transaction.get(customerDocRef);
        }

        // --- 2. WRITE PHASE ---
        const getOrderDate = () => {
            const { orderDate } = orderData;
            if (orderDate instanceof Timestamp) return orderDate.toDate();
            if (orderDate instanceof Date) return orderDate;
            const parsedDate = new Date(orderDate);
            return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
        };
        const orderDate = getOrderDate();
        const { registerCustomer, ...restOfOrderData } = orderData;
        const orderPayload = { ...restOfOrderData, orderDate: Timestamp.fromDate(orderDate) };
        if (orderPayload.orderer.id === undefined) {
          delete orderPayload.orderer.id;
        }
        const orderRef = doc(collection(db, 'orders'));
        transaction.set(orderRef, orderPayload);

        if (registerCustomer) {
            if (customerDocRef && customerDoc?.exists()) {
                updateCustomerOnOrder(transaction, customerDocRef, customerDoc.data() as Customer, orderData);
            } else {
                addCustomerFromOrder(transaction, orderData);
            }
        }
        
        for (const { productDocRef, productDoc, item } of productsToUpdate) {
            const currentStock = productDoc.data()?.stock || 0;
            const newStock = currentStock - item.quantity;
            if (newStock < 0) {
              throw new Error(`재고 부족: '${item.name}' (현재 ${currentStock}개)`);
            }
            transaction.update(productDocRef, { stock: newStock });
  
            const historyDocRef = doc(collection(db, "stockHistory"));
            transaction.set(historyDocRef, {
              date: Timestamp.fromDate(orderDate),
              type: "out",
              itemType: "product",
              itemId: item.id,
              itemName: item.name,
              quantity: item.quantity,
              fromStock: currentStock,
              toStock: newStock,
              resultingStock: newStock,
              branch: orderData.branchName,
              operator: user?.email || "Unknown User",
              price: item.price,
              totalAmount: item.price * item.quantity,
            });
        }
      });
      
      toast({
        title: '성공',
        description: '새 주문이 추가되고 재고 및 고객 정보가 업데이트되었습니다.',
      });
      await fetchOrders();
      
    } catch (error) {
      console.error("Error adding order transaction: ", error);
      toast({
        variant: 'destructive',
        title: '주문 처리 오류',
        description: error instanceof Error ? error.message : '주문 추가 중 오류가 발생했습니다.',
        duration: 5000,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const updateOrder = async (orderId: string, orderData: OrderData) => {
     try {
       setLoading(true);
       const orderRef = doc(db, "orders", orderId);
       const { registerCustomer, ...restOfOrderData } = orderData;
       const orderPayload = { ...restOfOrderData };
       if (orderPayload.orderer.id === undefined) {
          delete orderPayload.orderer.id;
       }
       await setDoc(orderRef, orderPayload, { merge: true });
       toast({
         title: "성공",
         description: "주문 정보가 업데이트되었습니다."
       });
       await fetchOrders();
     } catch(error) {
        console.error("Error updating order:", error);
        toast({
            variant: "destructive",
            title: "오류",
            description: "주문 업데이트 중 오류가 발생했습니다."
        });
     } finally {
        setLoading(false);
     }
  }


  const updateOrderStatus = async (orderId: string, newStatus: 'processing' | 'completed' | 'canceled') => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status: newStatus });
        toast({
            title: '상태 변경 성공',
            description: `주문 상태가 '${newStatus}'(으)로 변경되었습니다.`,
        });
        await fetchOrders();
    } catch (error) {
        console.error("Error updating order status:", error);
        toast({
            variant: 'destructive',
            title: '오류',
            description: '주문 상태 변경 중 오류가 발생했습니다.',
        });
    }
  };

  const updatePaymentStatus = async (orderId: string, newStatus: 'pending' | 'paid') => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { 'payment.status': newStatus });
        toast({
            title: '결제 상태 변경 성공',
            description: `결제 상태가 '${newStatus === 'paid' ? '결제완료' : '결제대기'}'(으)로 변경되었습니다.`,
        });
        await fetchOrders();
    } catch (error) {
        console.error("Error updating payment status:", error);
        toast({
            variant: 'destructive',
            title: '오류',
            description: '결제 상태 변경 중 오류가 발생했습니다.',
        });
    }
  };

  const getOrdersByCustomerAndDateRange = useCallback(async (customerId: string, from: Date, to: Date, branchName: string): Promise<Order[]> => {
    try {
        setLoading(true);
        const ordersCollection = collection(db, 'orders');
        const q = query(
            ordersCollection, 
            where("orderer.id", "==", customerId),
            where("branchName", "==", branchName),
            where("orderDate", ">=", Timestamp.fromDate(from)),
            where("orderDate", "<=", Timestamp.fromDate(to)),
            orderBy("orderDate", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
        console.error("Error fetching orders by customer and date range:", error);
        toast({
            variant: 'destructive',
            title: '조회 오류',
            description: '주문 내역을 불러오는 중 오류가 발생했습니다.',
        });
        return [];
    } finally {
        setLoading(false);
    }
  }, [toast]);

  return { orders, loading, addOrder, updateOrder, fetchOrders, updateOrderStatus, updatePaymentStatus, getOrdersByCustomerAndDateRange };
}
