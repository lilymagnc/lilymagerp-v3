"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from '@/hooks/use-branches';
import { usePartners } from '@/hooks/use-partners';
import { useAuth } from '@/hooks/use-auth';
import { Branch } from '@/hooks/use-branches';
import { Partner } from '@/hooks/use-partners';
import { PageHeader } from '@/components/page-header';

export default function PartnersStatementPage() {
  const { user } = useAuth();
  const { branches, loading: branchesLoading } = useBranches();
  const { partners, loading: partnersLoading } = usePartners();
  
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statementData, setStatementData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const isAdmin = user?.role === '본사 관리자';
  const loading = branchesLoading || partnersLoading;

  const generateStatement = async () => {
    if (!selectedBranch || !selectedPartner || !startDate || !endDate) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    try {
      const branch = branches.find(b => b.id === selectedBranch);
      const partner = partners.find(p => p.id === selectedPartner);
      
      if (!branch || !partner) {
        throw new Error('지점 또는 파트너 정보를 찾을 수 없습니다.');
      }

      // 거래명세서 데이터 생성 로직
      const statement = {
        branch: {
          name: branch.name,
          address: branch.address,
          phone: branch.phone || "",
          manager: branch.manager
        },
        partner: {
          name: partner.name,
          address: partner.address,
          phone: partner.phone || "",
          businessNumber: partner.businessNumber
        },
        period: {
          start: startDate,
          end: endDate
        },
        items: [], // 실제 거래 데이터를 여기에 추가
        totals: {
          amount: 0,
          tax: 0,
          total: 0
        }
      };

      setStatementData([statement]);
    } catch (error) {
      console.error('Error generating statement:', error);
      alert('거래명세서 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const printStatement = () => {
    window.print();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="파트너 거래명세서" 
        description="파트너와의 거래명세서를 생성합니다."
      />
      
      <Card>
        <CardHeader>
          <CardTitle>거래명세서 생성</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">지점 선택</label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="지점을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch: Branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">파트너 선택</label>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger>
                  <SelectValue placeholder="파트너를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner: Partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">시작일</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">종료일</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={generateStatement}
              disabled={isGenerating}
            >
              {isGenerating ? '생성 중...' : '거래명세서 생성'}
            </Button>
            
            {statementData.length > 0 && (
              <Button variant="outline" onClick={printStatement}>
                인쇄
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {statementData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>거래명세서</CardTitle>
          </CardHeader>
          <CardContent>
            {statementData.map((statement, index) => (
              <div key={index} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold">지점 정보</h3>
                    <p>{statement.branch.name}</p>
                    <p>{statement.branch.address}</p>
                    <p>{statement.branch.phone}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">파트너 정보</h3>
                    <p>{statement.partner.name}</p>
                    <p>{statement.partner.address}</p>
                    <p>{statement.partner.phone}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold">거래 기간</h3>
                  <p>{statement.period.start} ~ {statement.period.end}</p>
                </div>
                
                {/* 거래 내역 테이블 */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">날짜</th>
                        <th className="px-4 py-2 text-left">품목</th>
                        <th className="px-4 py-2 text-right">수량</th>
                        <th className="px-4 py-2 text-right">단가</th>
                        <th className="px-4 py-2 text-right">금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statement.items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            해당 기간에 거래 내역이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        statement.items.map((item: any, itemIndex: number) => (
                          <tr key={itemIndex} className="border-t">
                            <td className="px-4 py-2">{item.date}</td>
                            <td className="px-4 py-2">{item.name}</td>
                            <td className="px-4 py-2 text-right">{item.quantity}</td>
                            <td className="px-4 py-2 text-right">{item.price.toLocaleString()}원</td>
                            <td className="px-4 py-2 text-right">{item.amount.toLocaleString()}원</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t">
                      <tr>
                        <td colSpan={4} className="px-4 py-2 text-right font-semibold">합계</td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {statement.totals.total.toLocaleString()}원
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}