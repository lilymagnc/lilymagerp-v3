"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Building, DollarSign, Package, Users, Loader2 } from "lucide-react";
import { RecentOrders } from "./components/recent-orders";
import { LowStockProducts } from "./components/low-stock-products";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
export default function DashboardPage() {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            try {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const ordersSnapshot = await getDocs(collection(db, "orders"));
                const productsSnapshot = await getDocs(collection(db, "products"));
                const branchesSnapshot = await getDocs(collection(db, "branches"));
                const employeesSnapshot = await getDocs(collection(db, "employees"));
                const totalRevenue = ordersSnapshot.docs.reduce((acc, doc) => {
                    const data = doc.data();
                    return acc + (data.summary?.total || 0);
                }, 0);
                const lastMonthRevenue = ordersSnapshot.docs
                    .filter(doc => {
                    const data = doc.data();
                    // Defensive check for orderDate and its toDate method
                    return data.orderDate && typeof data.orderDate.toDate === 'function' && data.orderDate.toDate() > thirtyDaysAgo;
                })
                    .reduce((acc, doc) => {
                    const data = doc.data();
                    return acc + (data.summary?.total || 0);
                }, 0);
                const totalProducts = productsSnapshot.size;
                const totalBranches = branchesSnapshot.docs.filter(doc => doc.data().type !== "본사").length;
                const totalEmployees = employeesSnapshot.size;
                setStats([
                    { title: "총 매출", value: `₩${totalRevenue.toLocaleString()}`, icon: DollarSign, change: `지난 30일: ₩${lastMonthRevenue.toLocaleString()}` },
                    { title: "등록 상품 수", value: totalProducts.toLocaleString(), icon: Package },
                    { title: "총 직원 수", value: totalEmployees.toLocaleString(), icon: Users },
                    { title: "총 가맹점 수", value: totalBranches.toLocaleString(), icon: Building },
                ]);
            }
            catch (error) {
                console.error("Error fetching dashboard stats:", error);
                setStats([
                    { title: "총 매출", value: "데이터 로딩 실패", icon: DollarSign },
                    { title: "등록 상품 수", value: "데이터 로딩 실패", icon: Package },
                    { title: "총 직원 수", value: "데이터 로딩 실패", icon: Users },
                    { title: "총 가맹점 수", value: "데이터 로딩 실패", icon: Building },
                ]);
            }
            finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);
    return (<div>
      <PageHeader title="대시보드" description="시스템의 현재 상태를 한 눈에 파악하세요."/>
      {loading ? (<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (<Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium"><Loader2 className="h-4 w-4 animate-spin"/></CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">-</div>
                      <p className="text-xs text-muted-foreground">-</p>
                    </CardContent>
                </Card>))}
        </div>) : (<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (<Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground"/>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change && (<p className="text-xs text-muted-foreground">
                    {stat.change}
                  </p>)}
              </CardContent>
            </Card>))}
        </div>)}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
         <Card>
            <CardHeader>
                <CardTitle>최근 주문</CardTitle>
            </CardHeader>
            <CardContent>
                <RecentOrders />
            </CardContent>
         </Card>
         <Card>
            <CardHeader>
                <CardTitle>재고 부족 상품</CardTitle>
            </CardHeader>
            <CardContent>
                <LowStockProducts />
            </CardContent>
         </Card>
      </div>
    </div>);
}
