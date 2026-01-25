"use client";

import { useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

export function DeliveryExpenseFix() {
    const { user } = useAuth();

    useEffect(() => {
        // 본사 관리자나 가맹점 관리자가 접속했을 때 1회성으로 실행
        if (user?.role === '본사 관리자' || user?.role === '가맹점 관리자') {
            const runFix = async () => {
                // 이미 실행했는지 확인 (세션 내 1회)
                if (sessionStorage.getItem('delivery-expense-fix-executed')) return;

                console.log('🔍 [시스템] 배송비 지출 날짜 정합성 검사 시작...');
                try {
                    const expensesRef = collection(db, 'simpleExpenses');
                    // 운송비(transport) 카테고리이면서 주문과 연관된 지출 조회
                    const q = query(expensesRef, where('category', '==', 'transport'));
                    const snapshot = await getDocs(q);

                    let fixedCount = 0;
                    for (const expenseDoc of snapshot.docs) {
                        const expenseData = expenseDoc.data();
                        const orderId = expenseData.relatedOrderId;

                        if (!orderId) continue;

                        // 관련 주문 정보 가져오기
                        const orderDoc = await getDoc(doc(db, 'orders', orderId));
                        if (!orderDoc.exists()) continue;

                        const orderData = orderDoc.data();
                        // 배송일 또는 픽업일
                        const targetDateStr = orderData.deliveryInfo?.date || orderData.pickupInfo?.date;
                        if (!targetDateStr) continue;

                        // 날짜 객체 생성 (로컬 시간 기준)
                        const dateObj = new Date(targetDateStr + (typeof targetDateStr === 'string' && !targetDateStr.includes('T') ? 'T00:00:00' : ''));
                        if (isNaN(dateObj.getTime())) continue;

                        const targetTimestamp = Timestamp.fromDate(dateObj);

                        // 현재 지출 날짜와 주문 배송일이 다르면 보정
                        if (expenseData.date?.toMillis() !== targetTimestamp.toMillis()) {
                            console.log(`🔄 [보정] 주문 ID: ${orderId}, 지출 ID: ${expenseDoc.id}`);
                            console.log(`   - 기존: ${expenseData.date?.toDate().toLocaleDateString()}`);
                            console.log(`   - 변경: ${targetTimestamp.toDate().toLocaleDateString()} (배차/배송일)`);

                            await updateDoc(expenseDoc.ref, {
                                date: targetTimestamp,
                                updatedAt: Timestamp.now()
                            });
                            fixedCount++;
                        }
                    }

                    if (fixedCount > 0) {
                        console.log(`✅ [시스템] 배송비 지출 날짜 보정 완료: ${fixedCount}건 수정되었습니다.`);
                    } else {
                        console.log('✅ [시스템] 모든 배송비 지출 날짜가 정성입니다.');
                    }

                    sessionStorage.setItem('delivery-expense-fix-executed', 'true');
                } catch (error) {
                    console.error('[시스템] 배송비 지출 보정 중 오류 발생:', error);
                }
            };

            runFix();
        }
    }, [user]);

    return null;
}
