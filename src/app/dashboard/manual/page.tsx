"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen, ChevronRight, LayoutDashboard, ShoppingCart,
  ClipboardList, ExternalLink, Truck, MapPin,
  BookUser, Briefcase, FileText, UserPlus,
  Package, Hammer, History, Receipt,
  Store, DollarSign, Target, BarChart3,
  Users, UserCog, Settings, Search, Menu, X,
  Camera, Plus, Copy, Building, AlertCircle,
  Boxes, Images, TrendingUp, Calendar
} from "lucide-react";

// --- UI Mockup Components (Visual Aids) ---

const BrowserFrame = ({ url, children }: { url: string; children: React.ReactNode }) => (
  <div className="border rounded-lg overflow-hidden shadow-sm bg-background my-6 ring-1 ring-slate-200">
    <div className="bg-slate-100 border-b px-4 py-2 flex items-center gap-2">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-amber-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
      </div>
      <div className="ml-4 bg-white px-3 py-1 rounded-md text-xs text-slate-500 font-mono flex-1 border shadow-sm truncate">
        {url}
      </div>
    </div>
    <div className="p-0 bg-slate-50/50 min-h-[200px] max-h-[500px] overflow-y-auto custom-scrollbar">
      {children}
    </div>
  </div>
);

const FeatureCard = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <Card className="bg-slate-50 border-slate-200 shadow-sm">
    <CardHeader className="pb-3 pt-5">
      <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
        <Icon className="h-4 w-4 text-blue-600" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="text-sm text-slate-600 space-y-2">
      {children}
    </CardContent>
  </Card>
);

const StepGuide = ({ steps }: { steps: string[] }) => (
  <div className="ml-2 relative border-l-2 border-slate-200 pl-6 space-y-6 my-4">
    {steps.map((step, i) => (
      <div key={i} className="relative">
        <div className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-2 ring-slate-200 text-xs font-bold text-slate-600">
          {i + 1}
        </div>
        <p className="text-sm text-slate-700 leading-relaxed font-medium">{step}</p>
      </div>
    ))}
  </div>
);

const Highlight = ({ children }: { children: React.ReactNode }) => (
  <span className="font-semibold text-blue-700 bg-blue-50 px-1 py-0.5 rounded mx-1">{children}</span>
);

export default function ManualPage() {
  const { user } = useAuth();
  const [activeHash, setActiveHash] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const observerRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const isHQ = user?.role === '본사 관리자' || user?.email === 'lilymag0301@gmail.com';

  // --- Scroll Spy Logic ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHash(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px" } // Trigger when element is near top
    );

    Object.values(observerRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      setActiveHash(id);
      setIsMobileMenuOpen(false);
    }
  };

  // --- Menu Structure Definition ---
  const menuSections = [
    {
      title: "공통 메뉴",
      items: [
        { id: "dashboard", label: "1. 대시보드", icon: LayoutDashboard },
        { id: "sample-albums", label: "2. 샘플앨범", icon: Images },
        { id: "orders-new", label: "3. 주문 접수 (PC)", icon: ShoppingCart },
        { id: "orders-mobile", label: "4. 주문 접수 (Mobile)", icon: ShoppingCart },
        { id: "orders-list", label: "5. 주문 현황", icon: ClipboardList },
        { id: "outsource", label: "6. 외부 발주 관리", icon: ExternalLink },
        { id: "pickup-delivery", label: "7. 픽업/배송예약관리", icon: Truck },
        { id: "recipients", label: "8. 수령자 관리", icon: MapPin },
        { id: "customers", label: "9. 고객 관리", icon: BookUser },
        { id: "partners", label: "10. 거래처 관리", icon: Briefcase },
        { id: "quotations", label: "11. 견적서 관리", icon: ClipboardList },
        { id: "hr-requests", label: "12. 인사 서류 신청", icon: Briefcase },
      ]
    },
    ...(isHQ ? [{
      title: "본사 관리자 전용",
      items: [
        { id: "products", label: "13. 상품 관리", icon: Boxes },
        { id: "materials", label: "14. 자재 관리", icon: Hammer },
        { id: "stock-history", label: "15. 재고 변동 기록", icon: History },
        { id: "material-request", label: "16. 자재 요청 (관리)", icon: Package },
        { id: "purchase", label: "17. 구매 관리", icon: ShoppingCart },
        { id: "simple-expenses", label: "18. 간편 지출관리", icon: Receipt },
        { id: "branches", label: "19. 지점 관리", icon: Store },
        { id: "expenses", label: "20. 비용 관리", icon: DollarSign },
        { id: "budgets", label: "21. 예산 관리", icon: Target },
        { id: "reports", label: "22. 리포트 분석", icon: BarChart3 },
        { id: "hr-management", label: "23. 인사 관리/신청서", icon: Users },
        { id: "users", label: "24. 사용자 관리", icon: UserCog },
        { id: "settings", label: "25. 시스템 설정", icon: Settings },
      ]
    }] : [{
      title: "지점 사용자 전용",
      items: [
        { id: "material-request", label: "자재 요청", icon: Package },
        { id: "materials", label: "자재 관리", icon: Hammer },
        { id: "simple-expenses", label: "간편 지출관리", icon: Receipt },
      ]
    }])
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden sticky top-14 left-0 right-0 z-20 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <span className="font-semibold text-sm">목차 보기</span>
        <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex container mx-auto max-w-7xl pt-4 lg:pt-8 gap-8 px-4 lg:px-6">

        {/* Left Sidebar Navigation (Sticky) */}
        <aside className={cn(
          "fixed inset-0 z-30 bg-white lg:bg-transparent lg:static lg:block lg:w-64 shrink-0 transition-transform duration-300 lg:translate-x-0 border-r lg:border-r-0 lg:border-none p-4 lg:p-0 overflow-y-auto lg:overflow-visible h-screen lg:h-auto",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="lg:sticky lg:top-24 space-y-8">
            <div className="flex items-center justify-between lg:hidden mb-4">
              <span className="font-bold text-lg">매뉴얼 목차</span>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}><X /></Button>
            </div>

            {menuSections.map((section, idx) => (
              <div key={idx}>
                <h4 className="font-bold text-slate-900 mb-3 px-2 text-sm uppercase tracking-wide">{section.title}</h4>
                <nav className="space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all text-left",
                        activeHash === item.id
                          ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", activeHash === item.id ? "text-blue-600" : "text-slate-400")} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 space-y-16 pb-24">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">사용자 매뉴얼</h1>
            <div className="text-slate-500 text-lg">
              LilyMag ERP v3.0 시스템 사용을 위한 상세 가이드입니다.<br />
              현재 로그인하신 <Badge variant="outline" className="ml-1 font-bold">{isHQ ? "본사 관리자" : "지점 사용자"}</Badge> 권한에 맞는 기능만 표시됩니다.
            </div>
          </div>

          <Separator />

          {/* 1. Dashboard */}
          <section id="dashboard" ref={el => { if (el) observerRefs.current["dashboard"] = el; }} className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><LayoutDashboard className="h-6 w-6" /></div>
              <h2 className="text-2xl font-bold">1. 대시보드</h2>
            </div>
            <div className="prose max-w-none text-slate-600">
              <p>로그인 후 가장 먼저 만나는 화면입니다. 매장의 매출 현황, 일정, 공지사항 및 게시판을 한눈에 파악할 수 있는 통합 컨트롤 패널입니다.</p>

              <BrowserFrame url="/dashboard">
                <div className="p-6 grid gap-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-4 gap-4">
                    {['오늘 매출', '신규 고객', '주간 주문', '미결제 주문'].map((t, i) => (
                      <div key={i} className="bg-white p-4 rounded border shadow-sm h-24 flex flex-col justify-between">
                        <span className="text-xs text-gray-500 font-medium">{t}</span>
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-bold text-slate-800">{i === 0 ? '₩125,000' : 10 + i * 5}</span>
                          <TrendingUp className="h-4 w-4 text-green-500 mb-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Main Visuals: Chart & Schedule */}
                  <div className="grid grid-cols-3 gap-4 h-64">
                    <div className="col-span-2 bg-white border rounded p-4 flex flex-col gap-4">
                      <div className="text-sm font-bold">매출 추이 (최근 14일)</div>
                      <div className="flex-1 flex items-end gap-2 px-2 pb-2">
                        {[40, 60, 45, 70, 85, 50, 90].map((h, i) => (
                          <div key={i} className="flex-1 bg-blue-500/20 rounded-t hover:bg-blue-500/40 transition-colors" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                    <div className="bg-white border rounded p-4 flex flex-col gap-3">
                      <div className="text-sm font-bold flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-600" /> 오늘/내일 일정</div>
                      <div className="space-y-2 overflow-y-auto">
                        <div className="text-[10px] p-2 bg-slate-50 border-l-2 border-orange-400 rounded">14:00 픽업 (홍길동)</div>
                        <div className="text-[10px] p-2 bg-slate-50 border-l-2 border-blue-400 rounded">16:30 배송 (이영희)</div>
                      </div>
                    </div>
                  </div>
                  {/* Bulletin Board Widget */}
                  <div className="bg-white border rounded p-4">
                    <div className="text-sm font-bold mb-3 flex items-center justify-between">
                      <span>최신 공지 및 자유 게시판</span>
                      <Button variant="ghost" className="h-6 text-[10px]">더보기</Button>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between border-b pb-1"><span>[공지] 이번 주말 영업 시간 안내...</span><span className="text-slate-400">05/20</span></div>
                      <div className="flex justify-between border-b pb-1"><span>서초점 자재 여유분 나눔합니다.</span><span className="text-slate-400">05/19</span></div>
                    </div>
                  </div>
                </div>
              </BrowserFrame>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <FeatureCard title="통계 및 실시간 정보" icon={TrendingUp}>
                  <p>상단 카드에서 <strong>실시간 매출 및 미결/미처리 주문 건수</strong>를 확인하세요. 날씨 위젯을 통해 배송 환경(비/눈 등)을 미리 대비할 수 있습니다.</p>
                </FeatureCard>
                <FeatureCard title="통합 게시판 (Bulletin)" icon={ClipboardList}>
                  <p>지점 간 소통과 본사 공지 확인을 위한 공간입니다. 댓글 기능을 통해 실시간으로 업무 피드백을 주고받을 수 있습니다.</p>
                </FeatureCard>
              </div>
            </div>
          </section>

          <Separator />

          {/* 2. Sample Albums */}
          <section id="sample-albums" ref={el => { if (el) observerRefs.current["sample-albums"] = el; }} className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-pink-100 rounded-lg text-pink-600"><Images className="h-6 w-6" /></div>
              <h2 className="text-2xl font-bold">2. 샘플앨범</h2>
            </div>
            <p className="text-slate-600">고객 상담 시 실제 제작 사례를 보여줄 수 있는 고화질 포트폴리오입니다. 태그를 사용하여 고객의 요구에 맞는 상품을 즉시 제안하세요.</p>

            <div className="grid md:grid-cols-2 gap-4 my-4">
              <div className="border p-4 rounded-lg bg-white">
                <h4 className="font-bold flex items-center gap-2 mb-2"><Search className="h-4 w-4" /> 스마트 태그 검색</h4>
                <p className="text-sm text-slate-600">#레드 #꽃다발 #축하 등 멀티 태그를 선택하여 정교한 검색이 가능합니다. 자주 사용하는 검색 조건은 즐겨찾기 할 수 있습니다.</p>
              </div>
              <div className="border p-4 rounded-lg bg-white">
                <h4 className="font-bold flex items-center gap-2 mb-2"><Camera className="h-4 w-4" /> 제작 완료 사진 연동</h4>
                <p className="text-sm text-slate-600">주문 처리 과정에서 업로드한 제작 완료 사진을 바로 샘플앨범으로 등록하여 포트폴리오를 자동으로 확장할 수 있습니다.</p>
              </div>
            </div>
          </section>

          <Separator />

          {/* 3. Orders (PC) */}
          <section id="orders-new" ref={el => { if (el) observerRefs.current["orders-new"] = el; }} className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg text-green-600"><ShoppingCart className="h-6 w-6" /></div>
              <h2 className="text-2xl font-bold">3. 주문 접수 (PC)</h2>
            </div>
            <p className="text-slate-600">체계적이고 상세한 주문 정보를 단계별로 입력하는 표준 접수 화면입니다.</p>

            <div className="bg-slate-50 p-6 rounded-lg border space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded border shadow-sm">
                  <div className="font-bold text-sm mb-2 border-b pb-1">주문자/수령인</div>
                  <p className="text-xs text-slate-500 leading-relaxed">회원 번호로 검색 시 포인트 및 등급 정보가 자동 연동됩니다.</p>
                </div>
                <div className="bg-white p-4 rounded border shadow-sm">
                  <div className="font-bold text-sm mb-2 border-b pb-1">수령 방식 선택</div>
                  <p className="text-xs text-slate-500 leading-relaxed">매장픽업, 배송, 택배를 선택하며 배송 지역에 따른 배송비가 자동 계산됩니다.</p>
                </div>
                <div className="bg-white p-4 rounded border shadow-sm">
                  <div className="font-bold text-sm mb-2 border-b pb-1">상품 및 메시지</div>
                  <p className="text-xs text-slate-500 leading-relaxed">상품별 포장 타입, 카드/리본 메시지를 출력 양식에 맞게 입력합니다.</p>
                </div>
              </div>
              <div className="p-4 bg-teal-50 border border-teal-100 rounded text-xs text-teal-800">
                <strong>[영수증 자동 발행]:</strong> 접수 완료와 동시에 디지털 영수증 링크가 생성되어 고객에게 알림톡으로 전송 가능합니다.
              </div>
            </div>
          </section>

          <Separator />

          {/* 4. Orders (Mobile) */}
          <section id="orders-mobile" ref={el => { if (el) observerRefs.current["orders-mobile"] = el; }} className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><ShoppingCart className="h-6 w-6" /></div>
              <h2 className="text-2xl font-bold">4. 주문 접수 (Mobile)</h2>
            </div>
            <p className="text-slate-600">바쁜 현장이나 태블릿 상담에 최적화된 터치 중심의 인터페이스입니다.</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FeatureCard title="카테고리 퀵 선택" icon={Menu}>
                  <p className="text-sm">이미지 위주의 메뉴판 구성을 통해 상담 시간을 단축합니다. 각 지점의 추천 상품이 상단에 배치됩니다.</p>
                </FeatureCard>
                <FeatureCard title="현장 카드 결제 연동" icon={DollarSign}>
                  <p className="text-sm">포터블 결제 단말기와 블루투스 연동하여 현장에서 즉시 결제 승인을 처리할 수 있습니다.</p>
                </FeatureCard>
              </div>
              <div className="bg-slate-200 rounded-xl aspect-[3/4] flex items-center justify-center text-slate-400 font-bold border-4 border-slate-300 shadow-inner">Mobile UI Preview</div>
            </div>
          </section>

          <Separator />

          {/* 5. Order List */}
          <section id="orders-list" ref={el => { if (el) observerRefs.current["orders-list"] = el; }} className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-violet-100 rounded-lg text-violet-600"><ClipboardList className="h-6 w-6" /></div>
              <h2 className="text-2xl font-bold">5. 주문 현황</h2>
            </div>
            <p className="text-slate-600">실시간으로 인입되는 주문을 관리하고, 제작/배송 프로세스를 제어하는 핵심 화면입니다.</p>

            <BrowserFrame url="/dashboard/orders">
              <div className="p-4">
                <div className="flex gap-2 mb-4">
                  <Badge className="bg-blue-600">전체 (42)</Badge>
                  <Badge variant="outline">신규 접수 (3)</Badge>
                  <Badge variant="outline">제작 중 (5)</Badge>
                  <Badge variant="outline">배송 대기 (2)</Badge>
                </div>
                <div className="border rounded-lg overflow-hidden bg-white text-xs">
                  <div className="bg-slate-50 border-b p-3 font-bold grid grid-cols-6 items-center">
                    <div>수령일시</div><div>주문자</div><div>상품</div><div>금액</div><div>상태</div><div>작업</div>
                  </div>
                  <div className="p-3 border-b grid grid-cols-6 items-center">
                    <div className="font-bold">05/20 14:00</div>
                    <div>김철수<br /><span className="text-[10px] text-slate-400">서초점</span></div>
                    <div className="truncate">작약 꽃바구니 외 1</div>
                    <div className="font-mono">₩85,000</div>
                    <div><Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[9px]">제작 중</Badge></div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7"><ExternalLink className="h-3 w-3" /></Button>
                      <Button size="icon" variant="outline" className="h-7 w-7"><Truck className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </div>
              </div>
            </BrowserFrame>

            <div className="grid md:grid-cols-2 gap-6">
              <FeatureCard title="주문 이관 (Transfer)" icon={ExternalLink}>
                <p className="text-sm">타 지점으로 주문을 넘기거나(발주) 받는 업무입니다. 거리에 따른 지점 선정 시 <strong>주문 이관 다이얼로그</strong>가 팝업됩니다.</p>
              </FeatureCard>
              <FeatureCard title="일일 정산" icon={DollarSign}>
                <p className="text-sm">상단 <strong>[오늘의 매출/정산]</strong> 버튼을 통해 카드, 현금, 이체 내역별 매출을 합산하고 시재 확인 후 마감합니다.</p>
              </FeatureCard>
            </div>
          </section>

          <Separator />

          {/* 6. Outsource */}
          <section id="outsource" ref={el => { if (el) observerRefs.current["outsource"] = el; }} className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><ExternalLink className="h-6 w-6" /></div>
              <h2 className="text-2xl font-bold">6. 외부 발주 관리</h2>
            </div>
            <p className="text-slate-600">직접 제작이 불가능한 원거리 배송이나 특정 상품을 외부 협력사(파트너)에 발주하는 기능입니다.</p>
            <FeatureCard title="파트너 자동 전송" icon={Settings}>
              <p className="text-sm">버튼 클릭 시 등록된 협력사 정보와 주문 내역이 <strong>카카오 알림톡/문자 발주서</strong> 형태로 자동 전송됩니다. 파트너의 접수 확인 여부를 실시간으로 모니터링하세요.</p>
            </FeatureCard>
          </section>

          <Separator />

          {/* 7. Pickup/Delivery */}
          <section id="pickup-delivery" ref={el => { if (el) observerRefs.current["pickup-delivery"] = el; }} className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Truck className="h-6 w-6" /></div>
              <h2 className="text-2xl font-bold">7. 픽업/배송예약관리</h2>
            </div>
            <p className="text-slate-600">배송 현황을 시각적으로 파악하고, 기사 배정 및 사진 전송 업무를 수행합니다.</p>
            <div className="bg-white border rounded-xl overflow-hidden">
              <div className="p-4 bg-slate-50 border-b font-bold text-sm">배송 현황판</div>
              <div className="grid grid-cols-4 divide-x h-32">
                <div className="p-3 text-center"><div className="text-xs text-slate-500 mb-2">미배정</div><div className="text-2xl font-bold">3</div></div>
                <div className="p-3 text-center"><div className="text-xs text-slate-500 mb-2">배차완료</div><div className="text-2xl font-bold">5</div></div>
                <div className="p-3 text-center bg-blue-50/50"><div className="text-xs text-blue-600 mb-2 font-bold">배송중</div><div className="text-2xl font-bold text-blue-600">2</div></div>
                <div className="p-3 text-center"><div className="text-xs text-slate-500 mb-2">배송완료</div><div className="text-2xl font-bold">12</div></div>
              </div>
            </div>
            <p className="text-sm text-slate-500 italic mt-2">• 배송 완료 시 현장 사진을 업로드하면 고객에게 배송 완료 알림톡과 함께 사진이 전송됩니다.</p>
          </section>

          <Separator />

          {/* 8. Recipients */}
          <section id="recipients" ref={el => { if (el) observerRefs.current["recipients"] = el; }} className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><MapPin className="h-6 w-6" /></div>
              <h2 className="text-2xl font-bold">8. 수령자 관리</h2>
            </div>
            <p className="text-slate-600">반복적으로 배송이 이루어지는 수령 주소(전시장, 웨딩홀, 사무실 등)를 미리 저장하여 주문 접수 효율을 높입니다.</p>
          </section>

          <Separator />

          {/* 9. Customers */}
          <section id="customers" ref={el => { if (el) observerRefs.current["customers"] = el; }} className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-pink-100 rounded-lg text-pink-600"><BookUser className="h-6 w-6" /></div>
              <h2 className="text-2xl font-bold">9. 고객 관리</h2>
            </div>
            <FeatureCard title="고객 CRM 및 포인트" icon={TrendingUp}>
              <p className="text-sm">고객별 누적 구매액, 선호 스타일, 포인트 적립 현황을 관리합니다. 특정 고객의 <strong>과거 주문 내역</strong>을 즉시 조회하여 맞춤형 상담을 진행하세요.</p>
            </FeatureCard>
          </section>

          <Separator />

          {/* 10. Partners */}
          <section id="partners" ref={el => { if (el) observerRefs.current["partners"] = el; }} className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Briefcase className="h-6 w-6" /></div>
              <h2 className="text-2xl font-bold">10. 거래처 관리</h2>
            </div>
            <p className="text-slate-600">꽃 매입처, 도매상, 외부 발주 파트너의 정보를 통합 관리합니다. 사업자 정보 및 담당자 연락처를 항상 최신으로 유지하세요.</p>
          </section>

          <Separator />

          {/* 11. Quotations */}
          <section id="quotations" ref={el => { if (el) observerRefs.current["quotations"] = el; }} className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><ClipboardList className="h-6 w-6" /></div>
              <h2 className="text-2xl font-bold">11. 견적서 관리</h2>
            </div>
            <p className="text-slate-600">대량 주문이나 기업용 견적서(Quotation)를 생성하고 관리합니다. PDF 내보내기를 통해 공식 문서를 이메일로 즉시 발송할 수 있습니다.</p>
          </section>

          <Separator />

          {/* 12. HR Requests */}
          <section id="hr-requests" ref={el => { if (el) observerRefs.current["hr-requests"] = el; }} className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><Briefcase className="h-6 w-6" /></div>
              <h2 className="text-2xl font-bold">12. 인사 서류 신청</h2>
            </div>
            <p className="text-slate-600">휴가 신청(연차/반차), 재직증명서 발급 등 인사 관련 요청을 본사에 신청하는 창구입니다.</p>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-xs text-amber-800">
              <strong>상태 추적:</strong> 내 신청건의 승인/반려 상태를 실시간으로 확인하고, 승인 완료된 증명서는 직접 PDF 다운로드가 가능합니다.
            </div>
          </section>

          <Separator className="h-2 bg-slate-100 my-12" />
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
            <h3 className="text-xl font-bold text-blue-800 mb-2">여기서부터는 역할별 상세 기능입니다</h3>
            <p className="text-blue-600">현재 <strong>{isHQ ? "본사 관리자" : "지점 사용자"}</strong> 화면에 맞춰 설명이 표시됩니다.</p>
          </div>


          {/* 13. Products (HQ Only) */}
          {isHQ && (
            <section id="products" ref={el => { if (el) observerRefs.current["products"] = el; }} className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Boxes className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold">13. 상품 관리</h2>
              </div>
              <p className="text-slate-600">전 지점에서 판매될 상품군을 등록하고 관리합니다. 상품명, 가격, 옵션(포장/메시지카드 등)을 설정할 수 있습니다.</p>
              <FeatureCard title="지점별 판매 제어" icon={Target}>
                <p className="text-sm">특정 꽃 자재의 수급 문제 발생 시, 해당 자재가 포함된 모든 상품을 <strong>일괄 품절 처리</strong>하거나 특정 지점에서만 미노출되도록 제어할 수 있습니다.</p>
              </FeatureCard>
              <Separator />
            </section>
          )}

          {/* 14. Materials & 15. Stock History */}
          <section id="materials" ref={el => { if (el) observerRefs.current["materials"] = el; }} className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Hammer className="h-6 w-6" /></div>
              <h2 className="text-2xl font-bold">{isHQ ? "14. 자재 관리" : "자재 관리 (지점)"}</h2>
            </div>
            <p className="text-slate-600">포장지, 리본, 화기 등 부자재의 마스터 정보와 재고를 관리합니다.</p>
            {isHQ ? (
              <p className="text-sm">본사 창고의 실재고를 관리하고 입고 처리를 수행합니다. 최소 유지 재고 이하로 떨어지면 대시보드에서 알림을 줍니다.</p>
            ) : (
              <p className="text-sm">지점에서 보유한 부자재 수량을 확인하고, 실제 수량과 차이가 날 경우 재고 조정을 통해 전산 재고를 맞춥니다.</p>
            )}

            {isHQ && (
              <div id="stock-history" ref={el => { if (el) observerRefs.current["stock-history"] = el; }} className="pt-8 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><History className="h-5 w-5" /></div>
                  <h3 className="text-xl font-bold">15. 재고 변동 기록</h3>
                </div>
                <p className="text-sm text-slate-600">입고, 지점 출고, 소진 등 모든 재고 변화의 로그를 추적합니다. 특정 시점에 재고가 어떠한 이유로 변동되었는지 상세 사유와 담당자를 확인할 수 있습니다.</p>
              </div>
            )}
          </section>

          <Separator />

          {/* 16. Material Request */}
          <section id="material-request" ref={el => { if (el) observerRefs.current["material-request"] = el; }} className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><Package className="h-6 w-6" /></div>
              <h2 className="text-2xl font-bold">{isHQ ? "16. 자재 요청 관리" : "자재 요청"}</h2>
            </div>
            {isHQ ? (
              <FeatureCard title="승인 및 배송 처리" icon={Truck}>
                <p className="text-sm">지점에서 올린 요청 건을 검토하여 <strong>승인/반려</strong>합니다. 승인 시 본사 재고가 차감되며 지점 배송 상태로 전환됩니다.</p>
              </FeatureCard>
            ) : (
              <StepGuide steps={[
                "필요한 자재를 카테고리에서 찾아 장바구니에 담습니다.",
                "최종 수량을 확인한 후 [본사 요청] 버튼을 누릅니다.",
                "본사 승인 후 배송 현황을 탭에서 실시간으로 확인합니다."
              ]} />
            )}
          </section>

          <Separator />

          {/* 17. Purchase (HQ Only) */}
          {isHQ && (
            <section id="purchase" ref={el => { if (el) observerRefs.current["purchase"] = el; }} className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><ShoppingCart className="h-6 w-6" /></div>
                <h2 className="text-2xl font-bold">17. 구매 관리</h2>
              </div>
              <p className="text-slate-600">거래처에 발주를 넣고 세금계산서 대조 및 매입액을 관리합니다. 발주서(PO)를 생성하여 이메일이나 카카오톡으로 전송하세요.</p>
              <Separator />
            </section>
          )}

          {/* 18. Simple Expenses */}
          <section id="simple-expenses" ref={el => { if (el) observerRefs.current["simple-expenses"] = el; }} className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-teal-100 rounded-lg text-teal-600"><Receipt className="h-6 w-6" /></div>
              <h2 className="text-2xl font-bold">{isHQ ? "18. 간편 지출관리" : "간편 지출관리"}</h2>
            </div>
            <Tabs defaultValue="input" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="input">지출 입력</TabsTrigger>
                <TabsTrigger value="fixed">고정비</TabsTrigger>
                <TabsTrigger value="history">내역 조회</TabsTrigger>
                <TabsTrigger value="charts">분석 차트</TabsTrigger>
              </TabsList>
              <TabsContent value="input" className="space-y-4">
                <p className="text-sm text-slate-600">일일 발생하는 소액 지출을 기록합니다. 영수증 사진을 첨부하여 증빙을 남길 수 있으며, 금액만 직접 입력도 가능합니다.</p>
                <div className="bg-slate-50 p-4 rounded border text-xs">
                  <strong>지점 마감 팁:</strong> 당일 입력한 지출 합계가 [오늘의 매출/정산] 화면에 자동으로 차감 반영됩니다.
                </div>
              </TabsContent>
              <TabsContent value="fixed" className="space-y-4">
                <p className="text-sm text-slate-600">월세, 정수기렌탈료 등 매달 반복되는 지출을 템플릿으로 저장합니다. 매월 클릭 한 번으로 일괄 등록하세요.</p>
              </TabsContent>
              {isHQ && (
                <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-100 text-xs text-blue-700">
                  <strong>본사 관리 탭:</strong> 본사 관리자는 모든 지점의 지출 내역을 취합하여 보고서를 생성하고 엑셀로 추출할 수 있습니다.
                </div>
              )}
            </Tabs>
          </section>

          {isHQ && (
            <div className="space-y-12">
              <Separator />

              {/* 19. Branches */}
              <section id="branches" ref={el => { if (el) observerRefs.current["branches"] = el; }} className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Store className="h-6 w-6" /></div>
                  <h2 className="text-2xl font-bold">19. 지점 관리</h2>
                </div>
                <p className="text-slate-600">전국 지점의 마스터 정보를 관리합니다. 신규 지점 개설 시 지점 코드, 주소, 담당자 및 배송 가능 지역을 설정합니다.</p>
                <div className="bg-slate-50 p-4 rounded border text-xs">
                  <strong>권한 설정:</strong> 각 지점의 사용자가 자신의 지점 데이터만 볼 수 있도록 하는 '데이터 격리'의 기준이 됩니다.
                </div>
              </section>

              <Separator />

              {/* 20. Expenses */}
              <section id="expenses" ref={el => { if (el) observerRefs.current["expenses"] = el; }} className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-red-100 rounded-lg text-red-600"><DollarSign className="h-6 w-6" /></div>
                  <h2 className="text-2xl font-bold">20. 비용 관리</h2>
                </div>
                <p className="text-slate-600">정식 결재 프로세스가 필요한 대규모 지출이나 법인카드 내역을 관리합니다.</p>
                <ul className="list-disc pl-5 text-sm space-y-2 text-slate-700">
                  <li><strong>비용 신청:</strong> 영수증과 함께 지출 목적을 적어 결재를 올립니다.</li>
                  <li><strong>승인 관리:</strong> 관리자는 신청 내역을 검토하여 [승인] 또는 [반려] 처리합니다.</li>
                  <li><strong>분석:</strong> 부서별/프로젝트별 비용 집행 현황을 대시보드에서 확인합니다.</li>
                </ul>
              </section>

              <Separator />

              {/* 21. Budgets */}
              <section id="budgets" ref={el => { if (el) observerRefs.current["budgets"] = el; }} className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Target className="h-6 w-6" /></div>
                  <h2 className="text-2xl font-bold">21. 예산 관리</h2>
                </div>
                <p className="text-slate-600">지점별 또는 분기별 예산을 편성합니다. 실제 집행된 비용(Expenses)과 대조하여 <strong>예산 대비 집행률</strong>을 실시간으로 추적합니다.</p>
              </section>

              <Separator />

              {/* 22. Reports */}
              <section id="reports" ref={el => { if (el) observerRefs.current["reports"] = el; }} className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><BarChart3 className="h-6 w-6" /></div>
                  <h2 className="text-2xl font-bold">22. 리포트 분석</h2>
                </div>
                <p className="text-slate-600">사업의 성과를 데이터로 증명하는 공간입니다. 다양한 시각화 리포트를 제공합니다.</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <FeatureCard title="매출 분석" icon={TrendingUp}>
                    <p>기간별, 지점별, 상품 카테고리별 매출 비중을 분석합니다. 전년 동기 대비 성장률을 확인하세요.</p>
                  </FeatureCard>
                  <FeatureCard title="고객 분석" icon={Users}>
                    <p>신규 고객 유입률, 재방문 주기, 고객 등급별 기여도를 분석하여 마케팅 전략을 수립합니다.</p>
                  </FeatureCard>
                </div>
              </section>

              <Separator />

              {/* 23. HR Management */}
              <section id="hr-management" ref={el => { if (el) observerRefs.current["hr-management"] = el; }} className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><Users className="h-6 w-6" /></div>
                  <h2 className="text-2xl font-bold">23. 인사 관리/신청서</h2>
                </div>
                <p className="text-slate-600">전 직원의 근태와 인사 서류 신청 현황을 관리합니다.</p>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b flex justify-between items-center font-bold text-sm">
                    신청서 관리 (본사 승인용)
                    <Badge className="bg-orange-500">대기 5건</Badge>
                  </div>
                  <div className="p-4 text-xs text-slate-500 leading-relaxed italic border-b">"직원들이 신청한 연차, 증명서 발급 요청을 여기서 한꺼번에 검토하고 승인합니다."</div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs border-b pb-2">
                      <span>[서초점] 김지수 - 연차 신청 (5/25)</span>
                      <div className="flex gap-1"><Button size="sm" className="h-6 text-[10px] bg-blue-600">승인</Button><Button size="sm" variant="outline" className="h-6 text-[10px]">반려</Button></div>
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              {/* 24. Users */}
              <section id="users" ref={el => { if (el) observerRefs.current["users"] = el; }} className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><UserCog className="h-6 w-6" /></div>
                  <h2 className="text-2xl font-bold">24. 사용자 관리</h2>
                </div>
                <p className="text-slate-600">시스템 접속 계정을 관리합니다. 각 사용자별로 <strong>본사 관리자 / 지점 관리자 / 지점 스태프</strong> 등 역할(Role)을 부여하여 메뉴 접근 권한을 제어합니다.</p>
              </section>

              <Separator />

              {/* 25. Settings */}
              <section id="settings" ref={el => { if (el) observerRefs.current["settings"] = el; }} className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Settings className="h-6 w-6" /></div>
                  <h2 className="text-2xl font-bold">25. 시스템 설정</h2>
                </div>
                <p className="text-slate-600">ERP 전반에 적용되는 기초 설정을 수행합니다. 포인트 적립률, 공지사항 알림 설정, API 연동 키 관리 등이 포함됩니다.</p>
              </section>
            </div>
          )}

          <Separator className="my-12" />

          {/* Footer Navigation */}
          <div className="flex items-center justify-between py-12 border-t text-sm text-slate-500">
            <div className="flex flex-col gap-1">
              <p>© 2024 LilyMag Flowers ERP. All rights reserved.</p>
              <p>시스템 사용 문의: 본사 전산팀 (02-540-****)</p>
            </div>
            <Button variant="ghost" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="gap-2">
              맨 위로 이동 <ChevronRight className="h-4 w-4 rotate-[-90deg]" />
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}

const Badge = ({ children, className, variant = "default" }: { children: React.ReactNode, className?: string, variant?: "default" | "outline" }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${variant === "outline" ? "bg-white text-slate-600 ring-slate-200" : "bg-blue-50 text-blue-700 ring-blue-700/10"
    } ${className}`}>
    {children}
  </span>
);
