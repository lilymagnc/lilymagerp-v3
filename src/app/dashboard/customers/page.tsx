
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Search, Download, FileUp } from "lucide-react";
import { CustomerTable } from "./components/customer-table";
import { CustomerForm, CustomerFormValues } from "./components/customer-form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from "@/hooks/use-branches";
import { useCustomers, Customer } from "@/hooks/use-customers";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadXLSX } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { ImportButton } from "@/components/import-button";
import { CustomerDetails } from "./components/customer-details";

export default function CustomersPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("all");
    const [selectedType, setSelectedType] = useState("all");

    const { toast } = useToast();
    const { user } = useAuth();
    const { branches } = useBranches();
    const { customers, loading: customersLoading, addCustomer, updateCustomer, deleteCustomer, bulkAddCustomers } = useCustomers();

    const filteredCustomers = useMemo(() => {
        return customers
            .filter(customer => 
                (selectedBranch === "all" || customer.branch === selectedBranch) &&
                (selectedType === "all" || customer.type === selectedType)
            )
            .filter(customer => 
                customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (customer.companyName && customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
    }, [customers, searchTerm, selectedBranch, selectedType]);

    const handleAdd = () => {
        setSelectedCustomer(null);
        setIsFormOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setIsDetailOpen(false);
        setSelectedCustomer(customer);
        setIsFormOpen(true);
    };

    const handleRowClick = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDetailOpen(true);
    };

    const handleFormSubmit = async (data: CustomerFormValues) => {
        if (selectedCustomer?.id) {
            await updateCustomer(selectedCustomer.id, data);
        } else {
            await addCustomer(data);
        }
        setIsFormOpen(false);
        setSelectedCustomer(null);
    };

    const handleDelete = async (id: string) => {
        await deleteCustomer(id);
    };

    const handleDownloadCurrentList = () => {
        if (filteredCustomers.length === 0) {
            toast({
                variant: "destructive",
                title: "내보낼 데이터 없음",
                description: "현재 필터에 맞는 고객 데이터가 없습니다.",
            });
            return;
        }
        const dataToExport = filteredCustomers.map(c => ({
            '유형': c.type === 'company' ? '기업' : '개인',
            '고객명': c.name,
            '회사명': c.companyName,
            '연락처': c.contact,
            '이메일': c.email,
            '등급': c.grade,
            '담당지점': c.branch,
            '최근 주문일': c.lastOrderDate,
            '누적 구매액': c.totalSpent,
            '사업자등록번호': c.businessNumber,
            '대표자명': c.ceoName
        }));
        downloadXLSX(dataToExport, "customers_list");
        toast({
            title: "목록 다운로드 성공",
            description: `현재 필터링된 ${dataToExport.length}개 고객 정보가 XLSX 파일로 다운로드되었습니다.`,
        });
    };

    const handleImport = async (data: any[]) => {
        await bulkAddCustomers(data, selectedBranch);
    };

    return (
        <div>
            <PageHeader title="통합 고객 관리" description="개인 및 기업 고객 정보를 등록하고 마케팅에 활용하세요.">
                 <div className="flex items-center gap-2">
                    <ImportButton resourceName="고객" onImport={handleImport}>
                        <FileUp className="mr-2 h-4 w-4" />
                        엑셀로 가져오기
                    </ImportButton>
                    <Button onClick={handleAdd}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        고객 추가
                    </Button>
                </div>
            </PageHeader>
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>고객 목록</CardTitle>
                    <CardDescription>
                        지점, 유형별로 고객을 검색하고 관리합니다.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="고객명, 회사명 검색..."
                                className="w-full rounded-lg bg-background pl-8"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                            <SelectTrigger className="w-full sm:w-[160px]">
                                <SelectValue placeholder="지점 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">모든 지점</SelectItem>
                                {branches.map(branch => (
                                    <SelectItem key={branch.id} value={branch.name}>{branch.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger className="w-full sm:w-[160px]">
                                <SelectValue placeholder="고객 유형" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">모든 유형</SelectItem>
                                <SelectItem value="personal">개인</SelectItem>
                                <SelectItem value="company">기업</SelectItem>
                            </SelectContent>
                        </Select>
                         <Button variant="outline" onClick={handleDownloadCurrentList}>
                            <Download className="mr-2 h-4 w-4"/>
                            목록 다운로드
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {customersLoading ? (
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="flex items-center space-x-4 p-2">
                                    <Skeleton className="h-5 w-20" />
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-5 w-48" />
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <CustomerTable
                    customers={filteredCustomers}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRowClick={handleRowClick}
                />
            )}
            <CustomerForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSubmit={handleFormSubmit}
                customer={selectedCustomer}
            />
            <CustomerDetails
                isOpen={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                customer={selectedCustomer}
                onEdit={() => selectedCustomer && handleEdit(selectedCustomer)}
            />
        </div>
    );
}
