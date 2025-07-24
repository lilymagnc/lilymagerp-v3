
"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Printer, Search } from "lucide-react";
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useOrders, Order } from "@/hooks/use-orders";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from "@/hooks/use-branches";

export default function OrdersPage() {
  const { orders, loading } = useOrders();
  const { branches, loading: branchesLoading } = useBranches();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  
  const handlePrint = (orderId: string) => {
    router.push(`/dashboard/orders/print-preview/${orderId}`);
  };

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

  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => 
        (selectedBranch === "all" || order.branchName === selectedBranch)
      )
      .filter(order => 
        order.orderer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [orders, searchTerm, selectedBranch]);


  return (
    <>
      <PageHeader
        title="주문 현황"
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
            <CardDescription>최근 주문 목록을 검색하고 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
              <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                      type="search"
                      placeholder="주문자명, 주문ID 검색..."
                      className="w-full rounded-lg bg-background pl-8 sm:w-[200px] lg:w-[300px]"
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="지점 선택" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">모든 지점</SelectItem>
                      {!branchesLoading && branches.map(branch => (
                          <SelectItem key={branch.id} value={branch.name}>
                              {branch.name}
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
          </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>주문 ID</TableHead>
              <TableHead>주문자</TableHead>
              <TableHead>주문일</TableHead>
              <TableHead>출고지점</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">금액</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
               Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
              ))
            ) : (
              filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.slice(0, 8)}...</TableCell>
                  <TableCell>{order.orderer.name}</TableCell>
                  <TableCell>{format(order.orderDate.toDate(), 'yyyy-MM-dd')}</TableCell>
                  <TableCell>{order.branchName}</TableCell>
                  <TableCell>
                      {getStatusBadge(order.status)}
                  </TableCell>
                  <TableCell className="text-right">₩{order.summary.total.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handlePrint(order.id)}>
                      <Printer className="h-4 w-4" />
                      <span className="sr-only">주문서 출력</span>
                    </Button>
                  </TableCell>
                  </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </CardContent>
      </Card>
    </>
  );
}
