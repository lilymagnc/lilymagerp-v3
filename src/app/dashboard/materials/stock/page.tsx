
import { PageHeader } from "@/components/page-header";
import { StockMovement } from "../components/stock-movement";

export default function StockMovementPage() {
  return (
    <div>
      <PageHeader
        title="자재 재고 관리"
        description="바코드 스캔을 통해 자재 입출고를 관리합니다."
      />
      <StockMovement />
    </div>
  );
}
