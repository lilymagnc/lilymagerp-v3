"use client";

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DailyStatsSync() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSyncing, setIsSyncing] = useState(false);

    const syncStats = async (targetDateStr: string) => {
        setIsSyncing(true);
        try {
            const from = new Date(targetDateStr + 'T00:00:00');
            const to = new Date(targetDateStr + 'T23:59:59');

            // 1. 해당 날짜인 주문 모두 가져오기 (성능을 위해 전체를 가져온 후 필터링하거나 쿼리 최적화 가능)
            // 여기서는 안전하게 전체를 가져와서 필터링 (주문량이 아주 많지 않다고 가정)
            const ordersRef = collection(db, "orders");
            const ordersSnapshot = await getDocs(ordersRef);

            const branchStats: Record<string, { revenue: number, settledAmount: number, orderCount: number }> = {};
            let totalRevenue = 0;
            let totalSettledAmount = 0;
            let totalOrderCount = 0;

            ordersSnapshot.docs.forEach(orderDoc => {
                const data = orderDoc.data();
                const orderDateRaw = data.orderDate;
                const orderDate = orderDateRaw instanceof Timestamp ? orderDateRaw.toDate() : new Date(orderDateRaw);

                // 주문일 기준 매출/건수 집계
                if (orderDate >= from && orderDate <= to && data.status !== 'canceled') {
                    const branchName = data.branchName;
                    const amount = data.summary?.total || 0;

                    // 이관 지분 계산
                    const isTransferred = data.transferInfo?.isTransferred &&
                        (data.transferInfo?.status === 'accepted' || data.transferInfo?.status === 'completed');
                    const split = data.transferInfo?.amountSplit || { orderBranch: 100, processBranch: 0 };

                    const orderBranchShare = isTransferred ? Math.round(amount * (split.orderBranch / 100)) : amount;
                    const processBranchShare = amount - orderBranchShare;

                    // 발주지점 통계
                    if (!branchStats[branchName]) branchStats[branchName] = { revenue: 0, settledAmount: 0, orderCount: 0 };
                    branchStats[branchName].revenue += orderBranchShare;
                    branchStats[branchName].orderCount += 1;
                    totalRevenue += orderBranchShare;
                    totalOrderCount += 1;

                    // 수주지점 통계 (이관된 경우)
                    if (isTransferred && data.transferInfo.processBranchName) {
                        const pBranchName = data.transferInfo.processBranchName;
                        if (!branchStats[pBranchName]) branchStats[pBranchName] = { revenue: 0, settledAmount: 0, orderCount: 0 };
                        branchStats[pBranchName].revenue += processBranchShare;
                        totalRevenue += processBranchShare;
                    }

                    // 수금액 집계 (이미 결제된 경우)
                    const isSettled = (data.payment?.status === 'paid' || data.payment?.status === 'completed');
                    if (isSettled) {
                        branchStats[branchName].settledAmount += orderBranchShare;
                        totalSettledAmount += orderBranchShare;

                        if (isTransferred && data.transferInfo.processBranchName) {
                            const pBranchName = data.transferInfo.processBranchName;
                            branchStats[pBranchName].settledAmount += processBranchShare;
                            totalSettledAmount += processBranchShare;
                        }
                    }
                }
            });

            // 2. dailyStats 업데이트
            const branchesData: Record<string, any> = {};
            Object.entries(branchStats).forEach(([name, stat]) => {
                branchesData[name.replace(/\./g, '_')] = {
                    revenue: stat.revenue,
                    settledAmount: stat.settledAmount,
                    orderCount: stat.orderCount
                };
            });

            const statsRef = doc(db, 'dailyStats', targetDateStr);
            await setDoc(statsRef, {
                date: targetDateStr,
                totalRevenue,
                totalSettledAmount,
                totalOrderCount,
                branches: branchesData,
                lastUpdated: serverTimestamp(),
                isSynced: true
            }, { merge: true });

            toast({
                title: "통계 동기화 완료",
                description: `${targetDateStr}의 데이터가 실제 주문 기반으로 재집계되었습니다.`,
            });

            // 페이지 새로고침 (차트 업데이트 반영)
            window.location.reload();

        } catch (error) {
            console.error("Stats sync error:", error);
            toast({
                title: "동기화 실패",
                description: "통계를 재집계하는 중 오류가 발생했습니다.",
                variant: "destructive"
            });
        } finally {
            setIsSyncing(false);
        }
    };

    // 관리자 등급인 경우 자동으로 오늘 날짜 동기화 시도 (이미 동기화되지 않은 경우)
    useEffect(() => {
        if (user?.role === '본사 관리자') {
            const todayStr = new Date().toISOString().split('T')[0];
            const lastSync = localStorage.getItem(`last-stats-sync-${todayStr}`);

            if (!lastSync) {
                // 처음 접속 시 1회 자동 동기화
                syncStats(todayStr);
                localStorage.setItem(`last-stats-sync-${todayStr}`, new Date().getTime().toString());
            }
        }
    }, [user]);

    if (user?.role !== '본사 관리자') return null;

    return null;
}
