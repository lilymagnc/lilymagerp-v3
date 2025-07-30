"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { useRecipients, Recipient } from "@/hooks/use-recipients";
import { useBranches } from "@/hooks/use-branches";
import { useAuth } from "@/hooks/use-auth";
import { Search, MapPin, Phone, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function RecipientsPage() {
  const { recipients, loading, fetchRecipients, getRecipientsByDistrict, getFrequentRecipients } = useRecipients();
  const { branches } = useBranches();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "stats">("list");

  // 사용자 권한에 따른 지점 필터링
  const isAdmin = user?.role === '본사 관리자';
  const userBranch = user?.franchise;

  // 사용자가 볼 수 있는 지점 목록
  const availableBranches = useMemo(() => {
    if (isAdmin) {
      return branches; // 관리자는 모든 지점
    } else {
      return branches.filter(branch => branch.name === userBranch); // 직원은 소속 지점만
    }
  }, [branches, isAdmin, userBranch]);

  // 직원의 경우 자동으로 소속 지점으로 필터링
  useEffect(() => {
    if (!isAdmin && userBranch && selectedBranch === "all") {
      setSelectedBranch(userBranch);
    }
  }, [isAdmin, userBranch, selectedBranch]);

  useEffect(() => {
    if (selectedBranch === "all") {
      fetchRecipients();
    } else {
      fetchRecipients(selectedBranch);
    }
  }, [selectedBranch, fetchRecipients]);

  // 필터링된 수령자 목록
  const filteredRecipients = useMemo(() => {
    let filtered = recipients.filter(recipient => {
      const matchesSearch = recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recipient.contact.includes(searchTerm) ||
                           recipient.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDistrict = selectedDistrict === "all" || recipient.district === selectedDistrict;
      return matchesSearch && matchesDistrict;
    });

    // 권한에 따른 지점 필터링
    if (!isAdmin && userBranch) {
      filtered = filtered.filter(recipient => recipient.branchName === userBranch);
    }

    return filtered;
  }, [recipients, searchTerm, selectedDistrict, isAdmin, userBranch]);

  // 지역별 통계
  const districtStats = getRecipientsByDistrict();
  const frequentRecipients = getFrequentRecipients();

  // 고유 지역 목록
  const uniqueDistricts = [...new Set(recipients.map(r => r.district))].filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title="수령자 관리"
        description={`배송 수령자 정보를 관리하고 마케팅에 활용하세요${!isAdmin ? ` (${userBranch})` : ''}`}
      />

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 수령자</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recipients.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">단골 수령자</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{frequentRecipients.length}</div>
            <p className="text-xs text-muted-foreground">3회 이상 주문</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">지역 수</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(districtStats).length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 신규</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recipients.filter(r => {
                const now = new Date();
                const recipientDate = r.lastOrderDate.toDate();
                return recipientDate.getMonth() === now.getMonth() && 
                       recipientDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle>필터 및 검색</CardTitle>
          {!isAdmin && (
            <CardDescription>
              현재 {userBranch} 지점의 수령자만 표시됩니다.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="search">검색</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="수령자명, 연락처, 주소 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            {isAdmin && (
              <div>
                <Label htmlFor="branch">지점</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="지점 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 지점</SelectItem>
                    {availableBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.name}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="지역 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 지역</SelectItem>
                {uniqueDistricts.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 메인 콘텐츠 */}
      {viewMode === "list" ? (
        <Card>
          <CardHeader>
            <CardTitle>수령자 목록 ({filteredRecipients.length}명)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>수령자명</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>주소</TableHead>
                    <TableHead>지역</TableHead>
                    <TableHead>지점</TableHead>
                    <TableHead>주문횟수</TableHead>
                    <TableHead>최근주문</TableHead>
                    <TableHead>등급</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        로딩 중...
                      </TableCell>
                    </TableRow>
                  ) : filteredRecipients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        수령자가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecipients.map((recipient) => (
                      <TableRow key={recipient.id}>
                        <TableCell className="font-medium">{recipient.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{recipient.contact}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{recipient.address}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{recipient.district}</Badge>
                        </TableCell>
                        <TableCell>{recipient.branchName}</TableCell>
                        <TableCell>
                          <Badge variant={recipient.orderCount >= 3 ? "default" : "secondary"}>
                            {recipient.orderCount}회
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(recipient.lastOrderDate.toDate(), "yyyy-MM-dd", { locale: ko })}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={recipient.orderCount >= 5 ? "default" : 
                                   recipient.orderCount >= 3 ? "secondary" : "outline"}
                          >
                            {recipient.orderCount >= 5 ? "VIP" : 
                             recipient.orderCount >= 3 ? "단골" : "일반"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* 지역별 통계 */}
          <Card>
            <CardHeader>
              <CardTitle>지역별 통계</CardTitle>
              <CardDescription>지역별 수령자 및 주문 현황</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(districtStats)
                  .sort(([,a], [,b]) => b.totalOrders - a.totalOrders)
                  .map(([district, stats]) => (
                  <div key={district} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{district}</div>
                      <div className="text-sm text-muted-foreground">
                        수령자 {stats.count}명 • 총 주문 {stats.totalOrders}회
                      </div>
                    </div>
                    <Badge variant="outline">
                      평균 {Math.round(stats.totalOrders / stats.count)}회
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* 단골 수령자 */}
          <Card>
            <CardHeader>
              <CardTitle>단골 수령자 TOP 10</CardTitle>
              <CardDescription>주문 횟수가 많은 수령자</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {frequentRecipients
                  .sort((a, b) => b.orderCount - a.orderCount)
                  .slice(0, 10)
                  .map((recipient, index) => (
                  <div key={recipient.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <div className="font-medium">{recipient.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {recipient.district} • {recipient.contact}
                        </div>
                      </div>
                    </div>
                    <Badge variant="default">
                      {recipient.orderCount}회
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}