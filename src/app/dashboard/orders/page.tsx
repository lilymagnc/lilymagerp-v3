
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle } from "lucide-react";
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const mockOrders = [
    { id: "ORD-001", customer: "김민준", date: "2023-10-26", amount: 123000, status: "completed" },
    { id: "ORD-002", customer: "이서연", date: "2023-10-26", amount: 78000, status: "processing" },
    { id: "ORD-003", customer: "박지훈", date: "2023-10-25", amount: 210000, status: "completed" },
    { id: "ORD-004", customer: "최수아", date: "2023-10-25", amount: 45000, status: "canceled" },
    { id: "ORD-005", customer: "정다은", date: "2023-10-24", amount: 92000, status: "completed" },
    { id: "ORD-006", customer: "강현우", date: "2023-10-24", amount: 150000, status: "processing" },
]

export default function OrdersPage() {
  return (
    <div>
      <PageHeader
        title="주문 관리"
        description="모든 주문 내역을 확인하고 관리하세요."
      >
        <Button asChild>
            <Link href="/dashboard/orders/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                주문 접수
            </Link>
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
            <CardTitle>주문 내역</CardTitle>
            <CardDescription>최근 주문 목록입니다.</CardDescription>
        </CardHeader>
        <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>주문 ID</TableHead>
              <TableHead>고객명</TableHead>
              <TableHead>주문일</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">금액</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>{order.date}</TableCell>
                <TableCell>
                    <Badge variant={order.status === 'completed' ? 'default' : order.status === 'processing' ? 'secondary' : 'destructive'}>
                        {order.status === 'completed' ? '완료' : order.status === 'processing' ? '처리중' : '취소'}
                    </Badge>
                </TableCell>
                <TableCell className="text-right">₩{order.amount.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </CardContent>
      </Card>
    </div>
  );
}
