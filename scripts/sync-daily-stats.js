const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, getDoc, updateDoc, setDoc, query, where, Timestamp, serverTimestamp } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyApy5zme7H15h1UZd1B9hBDOOWgpbvOLJ4",
    authDomain: "lilymagerp-fs1.firebaseapp.com",
    projectId: "lilymagerp-fs1",
    storageBucket: "lilymagerp-fs1.firebasestorage.app",
    messagingSenderId: "1069828102888",
    appId: "1:1069828102888:web:24927eab4719f3e75d475d",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function syncDailyStats(targetDateStr) {
    console.log(`🔍 [${targetDateStr}] 통계 재집계 시작...`);
    try {
        const from = new Date(targetDateStr + 'T00:00:00');
        const to = new Date(targetDateStr + 'T23:59:59');

        const ordersRef = collection(db, "orders");
        const ordersSnapshot = await getDocs(ordersRef);

        console.log(`📊 전체 주문 건수: ${ordersSnapshot.docs.length}`);

        const branchStats = {};
        let totalRevenue = 0;
        let totalSettledAmount = 0;
        let totalOrderCount = 0;

        ordersSnapshot.docs.forEach(orderDoc => {
            const data = orderDoc.data();
            const orderDate = data.orderDate instanceof Timestamp ? data.orderDate.toDate() : new Date(data.orderDate);

            // 주문일 기준 매출 집계
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
                if (isTransferred) {
                    const pBranchName = data.transferInfo.processBranchName;
                    if (!branchStats[pBranchName]) branchStats[pBranchName] = { revenue: 0, settledAmount: 0, orderCount: 0 };
                    branchStats[pBranchName].revenue += processBranchShare;
                    totalRevenue += processBranchShare;
                }

                // 수금액 집계 (이미 결제된 경우)
                // 실제로는 completedAt 기준으로 해야 하지만, 주문일=결제일인 경우가 많으므로 일단 주문일 기준으로 재집계
                const isSettled = (data.payment?.status === 'paid' || data.payment?.status === 'completed');
                if (isSettled) {
                    branchStats[branchName].settledAmount += orderBranchShare;
                    totalSettledAmount += orderBranchShare;

                    if (isTransferred) {
                        const pBranchName = data.transferInfo.processBranchName;
                        branchStats[pBranchName].settledAmount += processBranchShare;
                        totalSettledAmount += processBranchShare;
                    }
                }
            }
        });

        // 결과 출력
        console.log("\n📈 재집계 결과:");
        console.log(`- 전체 매출: ${totalRevenue}`);
        console.log(`- 전체 수금: ${totalSettledAmount}`);
        console.log(`- 전체 주문: ${totalOrderCount}`);

        console.log("\n🏢 지점별 상세:");
        const branchesData = {};
        Object.entries(branchStats).forEach(([name, stat]) => {
            console.log(`[${name}] 매출: ${stat.revenue}, 수금: ${stat.settledAmount}, 건수: ${stat.orderCount}`);
            branchesData[name.replace(/\./g, '_')] = stat;
        });

        // dailyStats 업데이트
        const statsRef = doc(db, 'dailyStats', targetDateStr);
        await setDoc(statsRef, {
            date: targetDateStr,
            totalRevenue,
            totalSettledAmount,
            totalOrderCount,
            branches: branchesData,
            lastUpdated: serverTimestamp(),
            isSynced: true
        });

        console.log(`\n✅ [${targetDateStr}] dailyStats 문서가 성공적으로 업데이트되었습니다.`);
    } catch (error) {
        console.error("❌ 오류 발생:", error);
    }
}

// 오늘 날짜로 실행
const today = "2026-01-25";
syncDailyStats(today).then(() => {
    process.exit(0);
});
