"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, Printer, Download } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, startOfDay, endOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { useCustomers } from "@/hooks/use-customers";
import { useOrders } from "@/hooks/use-orders";
import { useBranches } from "@/hooks/use-branches";
import { useToast } from "@/hooks/use-toast";
import { PrintableStatement, StatementData } from "./components/printable-statement";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadXLSX } from "@/lib/utils";

export default function StatementPage() {
    const { customers, loading: customersLoading } = useCustomers();
    const { branches } = useBranches();
    const { toast } = useToast();
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [statementData, setStatementData] = useState<StatementData | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!selectedCustomer || !dateRange?.from || !dateRange?.to) {
            toast({
                variant: "destructive",
                title: "조회 조건 오류",
                description: "고객과 기간을 모두 선택해주세요.",
            });
            return;
        }

        setLoading(true);
        try {
            // 선택된 고객 정보 가져오기
            const customer = customers.find(c => c.id === selectedCustomer);
            if (!customer) {
                throw new Error("고객 정보를 찾을 수 없습니다.");
            }

            // 기간 내 주문 조회
            const startDate = startOfDay(dateRange.from);
            const endDate = endOfDay(dateRange.to);
            
            const ordersQuery = query(
                collection(db, "orders"),
                where("orderer.contact", "==", customer.contact),
                where("orderDate", ">=", Timestamp.fromDate(startDate)),
                where("orderDate", "<=", Timestamp.fromDate(endDate))
            );
            
            const ordersSnapshot = await getDocs(ordersQuery);
            const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 지점 정보 가져오기
            const branch = branches.find(b => b.name === customer.branch);
            const branchInfo = {
                name: branch?.name || customer.branch,
                address: branch?.address || "",
                contact: branch?.contact || "",
                account: branch?.account || ""
            };

            // 거래명세서 데이터 생성
            const statementOrders = orders.map((order: any) => ({
                id: order.id,
                orderDate: format((order.orderDate as Timestamp).toDate(), "yyyy-MM-dd", { locale: ko }),
                items: order.items.map((item: any) => item.name + "(" + item.quantity + "개)").join(", "),
                subtotal: order.summary?.subtotal || 0,
                deliveryFee: order.summary?.deliveryFee || 0,
                total: order.summary?.total || 0,
                paymentMethod: order.payment?.method || "미지정",
                paymentStatus: order.payment?.status || "pending"
            }));

            const summary = {
                totalOrders: orders.length,
                totalAmount: statementOrders.reduce((sum, order) => sum + order.subtotal, 0),
                totalDeliveryFee: statementOrders.reduce((sum, order) => sum + order.deliveryFee, 0),
                grandTotal: statementOrders.reduce((sum, order) => sum + order.total, 0)
            };

            const data: StatementData = {
                customer: {
                    name: customer.name,
                    companyName: customer.companyName || "",
                    contact: customer.contact,
                    email: customer.email || "",
                    branch: customer.branch
                },
                period: {
                    from: format(dateRange.from, "yyyy-MM-dd", { locale: ko }),
                    to: format(dateRange.to, "yyyy-MM-dd", { locale: ko })
                },
                orders: statementOrders,
                summary,
                branchInfo
            };

            setStatementData(data);
            
            if (orders.length === 0) {
                toast({
                    title: "조회 결과 없음",
                    description: "선택한 기간에 해당하는 주문 내역이 없습니다.",
                });
            } else {
                toast({
                    title: "조회 완료",
                    description: orders.length + "건의 주문 내역을 조회했습니다.",
                });
            }
        } catch (error) {
            console.error("거래명세서 조회 오류:", error);
            toast({
                variant: "destructive",
                title: "조회 오류",
                description: "거래명세서 조회 중 오류가 발생했습니다.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (!statementData) return;
        
        const printWindow = window.open("", "_blank");
        if (printWindow) {
            const printContent = `
                <div style="background: white; padding: 32px; color: black; font-family: Arial, sans-serif; font-size: 12px;">
                    <!-- 제목 -->
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="font-size: 36px; font-weight: bold; margin: 0; letter-spacing: 12px; border: 3px solid black; padding: 15px; display: inline-block;">거 래 명 세 서</h1>
                    </div>

                    <!-- 상단 정보 - 2열 구조 -->
                    <div style="display: flex; gap: 20px; margin-bottom: 24px;">
                        <!-- 왼쪽: 공급받는자 (고객정보) -->
                        <div style="flex: 1;">
                            <table style="width: 100%; border-collapse: collapse; border: 2px solid black;">
                                <thead>
                                    <tr>
                                        <th style="border: 1px solid black; padding: 12px; text-align: center; font-weight: bold; font-size: 16px; background-color: #e8e8e8;" colspan="2">
                                            공급받는자
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="border: 1px solid black; padding: 8px; font-weight: bold; background-color: #f5f5f5; width: 25%;">발행일</td>
                                        <td style="border: 1px solid black; padding: 8px;">
                                            ${format(new Date(), 'yyyy년 MM월 dd일', { locale: ko })}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="border: 1px solid black; padding: 8px; font-weight: bold; background-color: #f5f5f5;">거래처명</td>
                                        <td style="border: 1px solid black; padding: 8px; font-weight: 600;">${statementData.customer.companyName}</td>
                                    </tr>
                                    <tr>
                                        <td style="border: 1px solid black; padding: 8px; font-weight: bold; background-color: #f5f5f5;">담당자/연락처</td>
                                        <td style="border: 1px solid black; padding: 8px; font-size: 11px;">${statementData.customer.name} / ${statementData.customer.contact}</td>
                                    </tr>
                                    <tr>
                                        <td style="border: 1px solid black; padding: 8px; font-weight: bold; background-color: #f5f5f5;">총합계</td>
                                        <td style="border: 1px solid black; padding: 8px; text-align: right; font-weight: bold; color: black;">
                                            ₩${statementData.summary.grandTotal.toLocaleString()}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- 오른쪽: 공급자 (지점정보) -->
                        <div style="flex: 1;">
                            <table style="width: 100%; border-collapse: collapse; border: 2px solid black;">
                                <thead>
                                    <tr>
                                        <th style="border: 1px solid black; padding: 12px; text-align: center; font-weight: bold; font-size: 16px; background-color: #e8e8e8;" colspan="2">
                                            공급자
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="border: 1px solid black; padding: 8px; font-weight: bold; background-color: #f5f5f5; width: 30%;">사업자번호</td>
                                        <td style="border: 1px solid black; padding: 8px;">123-45-67890</td>
                                    </tr>
                                    <tr>
                                        <td style="border: 1px solid black; padding: 8px; font-weight: bold; background-color: #f5f5f5;">업체명</td>
                                        <td style="border: 1px solid black; padding: 8px; font-weight: 600;">${statementData.branchInfo.name}</td>
                                    </tr>
                                    <tr>
                                        <td style="border: 1px solid black; padding: 8px; font-weight: bold; background-color: #f5f5f5;">주소</td>
                                        <td style="border: 1px solid black; padding: 8px;">${statementData.branchInfo.address}</td>
                                    </tr>
                                    <tr>
                                        <td style="border: 1px solid black; padding: 8px; font-weight: bold; background-color: #f5f5f5;">종목</td>
                                        <td style="border: 1px solid black; padding: 8px;">꽃 도매업</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- 품목 테이블 -->
                    <table style="width: 100%; border-collapse: collapse; border: 2px solid black; margin-bottom: 20px;">
                        <thead>
                            <tr>
                                <th style="border: 1px solid black; padding: 12px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 6%;">No</th>
                                <th style="border: 1px solid black; padding: 12px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 25%;">품 명</th>
                                <th style="border: 1px solid black; padding: 12px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 12%;">규격</th>
                                <th style="border: 1px solid black; padding: 12px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 8%;">수량</th>
                                <th style="border: 1px solid black; padding: 12px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 12%;">단가</th>
                                <th style="border: 1px solid black; padding: 12px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 12%;">공급가액</th>
                                <th style="border: 1px solid black; padding: 12px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 10%;">배송비</th>
                                <th style="border: 1px solid black; padding: 12px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 15%;">합계</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${statementData.orders.map((order, index) => `
                                <tr>
                                    <td style="border: 1px solid black; padding: 8px; text-align: center;">${index + 1}</td>
                                    <td style="border: 1px solid black; padding: 8px;">${order.items}</td>
                                    <td style="border: 1px solid black; padding: 8px; text-align: center;">혼합</td>
                                    <td style="border: 1px solid black; padding: 8px; text-align: center;">1</td>
                                    <td style="border: 1px solid black; padding: 8px; text-align: right;">${order.subtotal.toLocaleString()}</td>
                                    <td style="border: 1px solid black; padding: 8px; text-align: right;">₩ ${order.subtotal.toLocaleString()}</td>
                                    <td style="border: 1px solid black; padding: 8px; text-align: right;">₩ ${order.deliveryFee.toLocaleString()}</td>
                                    <td style="border: 1px solid black; padding: 8px; text-align: right; font-weight: 600;">₩ ${order.total.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                            ${Array.from({ length: Math.max(0, 8 - statementData.orders.length) }, (_, i) => `
                                <tr>
                                    <td style="border: 1px solid black; padding: 8px; height: 35px;"></td>
                                    <td style="border: 1px solid black; padding: 8px;"></td>
                                    <td style="border: 1px solid black; padding: 8px;"></td>
                                    <td style="border: 1px solid black; padding: 8px;"></td>
                                    <td style="border: 1px solid black; padding: 8px;"></td>
                                    <td style="border: 1px solid black; padding: 8px;"></td>
                                    <td style="border: 1px solid black; padding: 8px;"></td>
                                    <td style="border: 1px solid black; padding: 8px;"></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <!-- 합계 행 -->
                    <table style="width: 100%; border-collapse: collapse; border: 2px solid black; margin-bottom: 24px;">
                        <tbody>
                            <tr>
                                <td style="border: 1px solid black; padding: 12px; text-align: center; font-weight: bold; background-color: #e8e8e8; width: 18%;">합 계</td>
                                <td style="border: 1px solid black; padding: 12px; width: 20%;"></td>
                                <td style="border: 1px solid black; padding: 12px; width: 12%;"></td>
                                <td style="border: 1px solid black; padding: 12px; width: 8%;"></td>
                                <td style="border: 1px solid black; padding: 12px; width: 12%;"></td>
                                <td style="border: 1px solid black; padding: 12px; text-align: right; font-weight: bold; width: 12%;">₩ ${statementData.summary.totalAmount.toLocaleString()}</td>
                                <td style="border: 1px solid black; padding: 12px; text-align: right; font-weight: bold; width: 10%;">₩ ${statementData.summary.totalDeliveryFee.toLocaleString()}</td>
                                <td style="border: 1px solid black; padding: 12px; text-align: right; font-weight: bold; width: 8%;">₩ ${statementData.summary.grandTotal.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- 입금계좌 정보 -->
                    <div style="border: 2px solid black; padding: 12px; text-align: center; background-color: #f8f9fa;">
                        <div style="font-size: 10px;">
                            <span style="font-weight: 500;">계좌번호:</span> ${statementData.branchInfo.account} | 
                            <span style="font-weight: 500;">연락처:</span> ${statementData.branchInfo.contact}
                        </div>
                    </div>
                </div>
            `;

            const htmlContent = [
                "<!DOCTYPE html>",
                "<html>",
                "<head>",
                "<title>거래명세서</title>",
                "<style>",
                "body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }",
                "@media print { ",
                "  body { margin: 0; padding: 10px; } ",
                "  .no-print { display: none !important; }",
                "}",
                "table { page-break-inside: avoid; }",
                "</style>",
                "</head>",
                "<body>",
                printContent,
                "<script>",
                "window.onload = function() {",
                "setTimeout(() => {",
                "window.print();",
                "window.close();",
                "}, 500);",
                "}",
                "</script>",
                "</body>",
                "</html>"
            ].join("");
            
            printWindow.document.write(htmlContent);
            printWindow.document.close();
        }
    };

    const handleDownload = () => {
        if (!statementData) return;
        
        const dataToExport = statementData.orders.map(order => ({
            "주문일": order.orderDate,
            "주문번호": order.id,
            "주문내용": order.items,
            "상품금액": order.subtotal,
            "배송비": order.deliveryFee,
            "합계": order.total,
            "결제방법": order.paymentMethod,
        }));
        
        const fileName = "거래명세서_" + statementData.customer.name + "_" + statementData.period.from + "_" + statementData.period.to;
        downloadXLSX(dataToExport, fileName);
        
        toast({
            title: "다운로드 완료",
            description: "거래명세서가 Excel 파일로 다운로드되었습니다.",
        });
    };

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
                                <label htmlFor="customer-select" className="text-sm font-medium">고객사</label>
                                <Select onValueChange={setSelectedCustomer} disabled={customersLoading}>
                                    <SelectTrigger id="customer-select">
                                        <SelectValue placeholder="고객사를 선택하세요..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map(customer => (
                                            <SelectItem key={customer.id} value={customer.id}>
                                                {customer.companyName || customer.name} ({customer.name})
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
                                                    <>{format(dateRange.from, "yyyy-MM-dd")} - {format(dateRange.to, "yyyy-MM-dd")}</>
                                                ) : (
                                                    format(dateRange.from, "yyyy-MM-dd")
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
                            <Button className="w-full" onClick={handleSearch} disabled={loading}>
                                {loading ? "조회 중..." : "조회하기"}
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
                            {statementData && (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={handleDownload}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Excel 다운로드
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handlePrint}>
                                        <Printer className="mr-2 h-4 w-4" />
                                        인쇄
                                    </Button>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-md min-h-[600px] overflow-auto">
                                {loading ? (
                                    <div className="p-6 space-y-4">
                                        <Skeleton className="h-8 w-48" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </div>
                                ) : statementData ? (
                                    <PrintableStatement data={statementData} type="statement" />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-muted-foreground">고객사와 기간을 선택하고 조회 버튼을 누르세요.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}