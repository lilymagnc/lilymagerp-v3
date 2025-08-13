
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-user-role";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const { userRole, loading: roleLoading, isHQManager } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (user) {
        // 본사 관리자는 대시보드로, 지점 사용자는 주문 접수 페이지로
        if (isHQManager()) {
          router.push("/dashboard");
        } else {
          router.push("/dashboard/orders/new");
        }
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, roleLoading, isHQManager, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
