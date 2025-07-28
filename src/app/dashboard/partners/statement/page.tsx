
"use client";

import { useState } from "react";
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
import { usePartners } from "@/hooks/use-partners";

export default function StatementPage() {
    const { partners, loading: partnersLoading } = usePartners();
    const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

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
                                <label htmlFor="partner-select" className="text-sm font-medium">거래처</label>
                                <Select onValueChange={setSelectedPartner} disabled={partnersLoading}>
                                    <SelectTrigger id="partner-select">
                                        <SelectValue placeholder="거래처를 선택하세요..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {partners.map(partner => (
                                            <SelectItem key={partner.id} value={partner.id}>
                                                {partner.name}
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
                                                    <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                                                ) : (
                                                    format(dateRange.from, "LLL dd, y")
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
                            <Button className="w-full">
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
                            <Button variant="outline" size="sm">
                                <Printer className="mr-2 h-4 w-4" />
                                인쇄
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-md min-h-[600px] flex items-center justify-center">
                                <p className="text-muted-foreground">거래처와 기간을 선택하고 조회 버튼을 누르세요.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

