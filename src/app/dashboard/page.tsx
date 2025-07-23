
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Building, DollarSign, Package, Users } from "lucide-react";
import { RecentOrders } from "./components/recent-orders";
import { LowStockProducts } from "./components/low-stock-products";

export default function DashboardPage() {
  const stats = [
    { title: "총 매출", value: "₩12,345,678", icon: DollarSign, change: "+12.5%" },
    { title: "등록 상품 수", value: "4,590", icon: Package, change: "+201" },
    { title: "총 직원 수", value: "128", icon: Users, change: "+3" },
    { title: "총 가맹점 수", value: "15", icon: Building, change: "+1" },
  ];

  return (
    <div>
      <PageHeader
        title="대시보드"
        description="시스템의 현재 상태를 한 눈에 파악하세요."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                지난 달 대비 {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
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
    </div>
  );
}
