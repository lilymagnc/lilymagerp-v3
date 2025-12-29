
"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { db } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { syncOrderToSupabase } from '@/hooks/use-orders';
import { syncCustomerToSupabase } from '@/hooks/use-customers';
import { syncProductToSupabase } from '@/hooks/use-products';
import { syncBranchToSupabase } from '@/hooks/use-branches';
import { syncMaterialToSupabase } from '@/hooks/use-materials';
import { syncEventToSupabase } from '@/hooks/use-calendar';
import { syncPartnerToSupabase } from '@/hooks/use-partners';
import { syncTransferToSupabase } from '@/hooks/use-order-transfers';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Database, Zap, CheckCircle2, AlertCircle, Loader2, ArrowRightCircle } from 'lucide-react';

export default function SupabaseGranularMigrationPage() {
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState<string>('');
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const { toast } = useToast();

    const addLog = (msg: string) => {
        setLogs(prev => [`${new Date().toLocaleTimeString()} - ${msg}`, ...prev.slice(0, 99)]);
    };

    const migrationTargets = [
        { id: 'branches', name: '지점 정보', icon: '🏪', sync: syncBranchToSupabase },
        { id: 'partners', name: '거래처 정보', icon: '🤝', sync: syncPartnerToSupabase },
        { id: 'customers', name: '고객 데이터', icon: '👥', sync: syncCustomerToSupabase },
        { id: 'products', name: '상품 리스트', icon: '📦', sync: syncProductToSupabase },
        { id: 'materials', name: '자재 리스트', icon: '🧵', sync: syncMaterialToSupabase },
        { id: 'calendarEvents', name: '예약/일정', icon: '📅', sync: syncEventToSupabase },
        { id: 'order_transfers', name: '이관 기록', icon: '🔄', sync: syncTransferToSupabase },
        { id: 'orders', name: '전체 주문', icon: '📝', sync: syncOrderToSupabase },
    ];

    const runMigration = async (targetId: string) => {
        const target = migrationTargets.find(t => t.id === targetId);
        if (!target) return;

        setLoading(true);
        setCurrentStep(target.name);
        setProgress(0);
        addLog(`>>> [${target.name}] 마이그레이션 시작...`);

        try {
            const snap = await getDocs(collection(db, target.id));
            const total = snap.docs.length;
            addLog(`${total}개의 데이터를 처리합니다.`);

            for (let i = 0; i < total; i++) {
                const docSnap = snap.docs[i];
                const data = docSnap.data();

                try {
                    if (target.id === 'products' || target.id === 'materials') {
                        await target.sync({ docId: docSnap.id, ...data } as any);
                    } else if (target.id === 'calendarEvents') {
                        await target.sync({
                            id: docSnap.id,
                            ...data,
                            startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate),
                            endDate: data.endDate?.toDate ? data.endDate.toDate() : (data.endDate ? new Date(data.endDate) : null),
                            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
                        } as any);
                    } else {
                        await target.sync({ id: docSnap.id, ...data } as any);
                    }
                } catch (err: any) {
                    addLog(`오류 (ID:${docSnap.id}): ${err.message}`);
                }
                setProgress(Math.round(((i + 1) / total) * 100));
            }

            // 재고 이력 별도 처리 (target이 orders나 materials일 때 같이 하는 경우가 많음)
            if (targetId === 'materials') {
                addLog('재고 이력(stockHistory) 동기화 중...');
                const stockSnap = await getDocs(query(collection(db, 'stockHistory'), orderBy('date', 'desc')));
                for (let k = 0; k < stockSnap.docs.length; k++) {
                    const docSnap = stockSnap.docs[k];
                    const data = docSnap.data();
                    await supabase.from('stock_history').upsert({
                        doc_id: docSnap.id,
                        item_id: data.itemId,
                        item_name: data.itemName,
                        type: data.type,
                        quantity: data.quantity,
                        resulting_stock: data.resultingStock || 0,
                        branch: data.branch,
                        operator: data.operator,
                        created_at: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
                        raw_data: data
                    });
                }
                addLog('재고 이력 완료.');
            }

            addLog(`✔ [${target.name}] 마이그레이션 완료!`);
            toast({ title: `${target.name} 완료`, description: "성공적으로 이전되었습니다." });
        } catch (error: any) {
            addLog(`❗ 치명적 오류: ${error.message}`);
        } finally {
            setLoading(false);
            setCurrentStep('');
        }
    };

    const migrateAll = async () => {
        if (!confirm('순차적으로 모든 데이터를 이전하시겠습니까?')) return;
        for (const target of migrationTargets) {
            await runMigration(target.id);
        }
        toast({ title: "슈퍼 마이그레이션 완료", description: "모든 데이터가 동기화되었습니다." });
    };

    return (
        <div className="space-y-6 p-6">
            <PageHeader title="Supabase 데이터 이사 센터" description="필요한 데이터만 선택해서 옮기거나, 전체를 한꺼번에 옮길 수 있습니다." />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>항목별 데이터 이전</CardTitle>
                                <CardDescription>원하는 데이터 그룹을 선택하여 수파베이스로 복제합니다.</CardDescription>
                            </div>
                            <Button variant="outline" onClick={migrateAll} disabled={loading}>
                                <Zap className="mr-2 h-4 w-4 text-yellow-500 fill-yellow-500" />
                                전체 순차 이사
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {migrationTargets.map((target) => (
                                    <div key={target.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{target.icon}</span>
                                            <span className="font-medium">{target.name}</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => runMigration(target.id)}
                                            disabled={loading}
                                        >
                                            <ArrowRightCircle className="h-5 w-5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {loading && (
                        <Card className="border-primary/50 bg-primary/5 animate-in fade-in slide-in-from-bottom-2">
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 font-bold text-primary">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {currentStep} 이사 중...
                                        </div>
                                        <span className="text-sm font-mono">{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-3" />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Database className="h-4 w-4" />
                                마이그레이션 실시간 로그
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-[500px]">
                            <div className="bg-slate-950 text-emerald-400 font-mono text-[11px] p-4 h-[500px] overflow-y-auto rounded-md border border-slate-800">
                                {logs.length > 0 ? (
                                    <div className="space-y-1">
                                        {logs.map((log, i) => (
                                            <div key={i} className="whitespace-pre-wrap opacity-90 border-b border-white/5 pb-1">
                                                {log.includes('✔') ? <span className="text-blue-400">{log}</span> :
                                                    log.includes('❗') ? <span className="text-red-400 font-bold">{log}</span> :
                                                        log.startsWith('>>>') ? <span className="text-yellow-400 font-bold">{log}</span> : log}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center p-4">
                                        <Database className="h-12 w-12 mb-2 opacity-10" />
                                        <p>이사할 항목을 선택하시면<br />진행 로그가 표시됩니다.</p>
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
