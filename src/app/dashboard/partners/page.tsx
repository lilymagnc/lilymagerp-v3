"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Search, Download, FileUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePartners } from "@/hooks/use-partners";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadXLSX } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { ImportButton } from "@/components/import-button";
import { PartnerTable } from "./components/partner-table";
import { PartnerForm, PartnerFormValues } from "./components/partner-form";

export default function PartnersPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("all");

    const { toast } = useToast();
    const { user } = useAuth();
    const { partners, loading: partnersLoading, addPartner, updatePartner, deletePartner } = usePartners();

    const filteredPartners = useMemo(() => {
        return partners
            .filter(partner => 
                (selectedType === "all" || partner.type === selectedType)
            )
            .filter(partner => 
                partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (partner.managerName && partner.managerName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
    }, [partners, searchTerm, selectedType]);

    const handleAdd = () => {
        setSelectedPartner(null);
        setIsFormOpen(true);
    };

    const handleEdit = (partner: any) => {
        setSelectedPartner(partner);
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (data: PartnerFormValues) => {
        if (selectedPartner?.id) {
            await updatePartner(selectedPartner.id, data);
        } else {
            await addPartner(data);
        }
        setIsFormOpen(false);
        setSelectedPartner(null);
    };

    const handleDelete = async (id: string) => {
        await deletePartner(id);
    };

    const handleDownloadCurrentList = () => {
        if (filteredPartners.length === 0) {
            toast({
                variant: "destructive",
                title: "내보낼 데이터 없음",
                description: "현재 필터에 맞는 거래처 데이터가 없습니다.",
            });
            return;
        }
        const dataToExport = filteredPartners.map(p => ({
            '거래처명': p.name,
            '유형': p.type === 'purchase' ? '매입처' : '매출처',
            '사업자등록번호': p.businessNumber,
            '대표자명': p.ceoName,
            '업태': p.businessType,
            '종목': p.businessItem,
            '주소': p.address,
            '담당자명': p.managerName,
            '연락처': p.contact,
            '이메일': p.email,
        }));
        downloadXLSX(dataToExport, "partners_list");
        toast({
            title: "목록 다운로드 성공",
            description: `현재 필터링된 ${dataToExport.length}개 거래처 정보가 XLSX 파일로 다운로드되었습니다.`,
        });
    };
    
    return (
        <div>
            <PageHeader title="거래처 관리" description="매입처 및 매출처 정보를 등록하고 관리합니다.">
                 <div className="flex items-center gap-2">
                    <Button onClick={handleAdd}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        거래처 추가
                    </Button>
                </div>
            </PageHeader>
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>거래처 목록</CardTitle>
                    <CardDescription>
                        유형별로 거래처를 검색하고 관리합니다.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="거래처명, 담당자명 검색..."
                                className="w-full rounded-lg bg-background pl-8"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger className="w-full sm:w-[160px]">
                                <SelectValue placeholder="거래처 유형" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">모든 유형</SelectItem>
                                <SelectItem value="purchase">매입처</SelectItem>
                                <SelectItem value="sales">매출처</SelectItem>
                            </SelectContent>
                        </Select>
                         <Button variant="outline" onClick={handleDownloadCurrentList}>
                            <Download className="mr-2 h-4 w-4"/>
                            목록 다운로드
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {partnersLoading ? (
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
                <PartnerTable
                    partners={filteredPartners}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}
            <PartnerForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSubmit={handleFormSubmit}
                partner={selectedPartner}
            />
        </div>
    );
}
