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
  Boxes, Images, TrendingUp, Calendar, ArrowRightLeft, Download, Eye, Info
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
      title: "매장 운영 핵심 메뉴",
      items: [
        { id: "ch1-dashboard", label: "대시보드 및 정산", icon: LayoutDashboard },
        { id: "ch2-calendar", label: "전사 일정 관리", icon: Calendar },
        { id: "ch3-checklist", label: "체크리스트 관리", icon: ClipboardList },
        { id: "ch4-sample", label: "샘플앨범(포트폴리오)", icon: Images },
      ]
    },
    {
      title: "주문 및 배송 관리",
      items: [
        { id: "ch5-orders-new", label: "주문 접수 (PC/모바일)", icon: ShoppingCart },
        { id: "ch6-orders-list", label: "주문 현황 및 내역", icon: ClipboardList },
        { id: "ch7-outsource", label: "외부 발주(파트너)", icon: ExternalLink },
        { id: "ch8-pickup", label: "픽업/배송예약관리", icon: Truck },
        { id: "ch9-recipients", label: "수령자/배송지 관리", icon: MapPin },
      ]
    },
    {
      title: "CRM 및 인사 관리",
      items: [
        { id: "ch10-customers", label: "고객 CRM/포인트", icon: BookUser },
        { id: "ch11-partners", label: "거래처/매입처 관리", icon: Briefcase },
        { id: "ch12-quotations", label: "견적서 생성/관리", icon: FileText },
        { id: "ch13-hr-requests", label: "인사 서류 신청", icon: UserPlus },
      ]
    },
    ...(isHQ ? [{
      title: "본사 관리자 전용 메뉴",
      items: [
        { id: "ch14-products", label: "통합 상품 마스터", icon: Boxes },
        { id: "ch15-materials", label: "자재 및 재고 관리", icon: Hammer },
        { id: "ch16-mat-req-admin", label: "지점 자재요청 승인", icon: Package },
        { id: "ch17-purchase", label: "본사 구매/매입 관리", icon: ShoppingCart },
        { id: "ch18-expenses", label: "비용 결재 및 관리", icon: DollarSign },
        { id: "ch19-simple-expenses", label: "지점 간편지출/마감", icon: Receipt },
        { id: "ch20-branches", label: "전국 지점/조직 관리", icon: Store },
        { id: "ch21-reports", label: "리포트/성과 분석", icon: BarChart3 },
        { id: "ch22-hr-admin", label: "인사/사용자/권한설정", icon: UserCog },
      ]
    }] : [{
      title: "지점 사용자 편의 기능",
      items: [
        { id: "ch-mat-req-branch", label: "자재 요청 (보충)", icon: Package },
        { id: "ch-mat-branch", label: "지점 자재 재고", icon: Hammer },
        { id: "ch-exp-branch", label: "일일 지출 입력", icon: Receipt },
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
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">LilyMag ERP 사용자 매뉴얼</h1>
            <div className="text-slate-500 text-lg leading-relaxed max-w-3xl">
              LilyMag Flowers ERP 시스템의 기능을 체계적으로 안내합니다.
              현재 <Badge variant="outline" className="ml-1 font-bold text-blue-600 border-blue-200 bg-blue-50 leading-none py-1">{isHQ ? "본사 관리자" : "지점 사용자"}</Badge> 권한으로 접속 중이며, 권한에 최적화된 콘텐츠가 표시됩니다.
            </div>
          </div>

          <Separator />

          {/* 제 1장. 대시보드 */}
          <section id="ch1-dashboard" ref={el => { if (el) observerRefs.current["ch1-dashboard"] = el; }} className="scroll-mt-24 space-y-10">
            <div className="border-b-2 border-slate-100 pb-4">
              <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                <LayoutDashboard className="h-8 w-8 text-blue-600" />
                제 1장. 대시보드 및 정산 (Dashboard)
              </h2>
            </div>

            <div className="space-y-8">
              <div className="prose max-w-none text-slate-600 text-lg leading-relaxed font-medium">
                <p>시스템 로그인 시 가장 먼저 만나는 화면으로, 매장의 핵심 지표와 실시간 현황을 제공합니다.</p>
              </div>

              {/* 주요 버튼 설명 추가 */}
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
                  <Settings className="h-5 w-5 text-blue-600" />
                  주요 버튼 및 클릭 시 동작
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="font-bold text-blue-700 flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4" /> [오늘의 매출/정산] 버튼
                    </div>
                    <p className="text-sm text-slate-600">오늘 발생한 현금/카드/이체 매출을 합산하여 실제 시재와 맞추는 <strong>마감 팝업</strong>을 엽니다.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="font-bold text-blue-700 flex items-center gap-2 mb-1">
                      <LayoutDashboard className="h-4 w-4" /> [지점 선택] 드롭다운 (본사 전용)
                    </div>
                    <p className="text-sm text-slate-600">특정 지점을 선택하면 해당 지점의 데이터로 대시보드 전체가 실시간 필터링됩니다.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="font-bold text-blue-700 flex items-center gap-2 mb-1">
                      <Plus className="h-4 w-4" /> [새 주문] 버튼
                    </div>
                    <p className="text-sm text-slate-600">주문 접수(PC) 페이지로 즉시 이동하여 신규 고객 주문을 생성합니다.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="font-bold text-blue-700 flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4" /> [일정 상세보기] 버튼
                    </div>
                    <p className="text-sm text-slate-600">대시보드 우측 일정 위젯에서 해당 건을 클릭하면 주문의 상세 내역 팝업이 바로 뜹니다.</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <FeatureCard title="핵심 요약 지표 카드" icon={Target}>
                  <p className="mb-2 text-slate-500">년 매출, 등록 고객, 주간 주문, 처리 대기 등 목표 달성 현황을 상단 카드에서 확인하세요.</p>
                </FeatureCard>
                <FeatureCard title="매출 분석 차트" icon={BarChart3}>
                  <p className="mb-2 text-slate-500">일별/주간/월별 매출 추이를 그래프로 시각화하여 변화 흐름을 한눈에 파악합니다.</p>
                </FeatureCard>
              </div>

              <BrowserFrame url="/dashboard">
                <div className="p-6 bg-white space-y-6">
                  <div className="flex justify-between items-center px-2">
                    <div className="h-8 w-32 bg-slate-100 rounded animate-pulse" />
                    <div className="h-8 w-32 bg-blue-600 rounded-md text-white text-[10px] flex items-center justify-center font-bold">오늘의 매출/정산</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="bg-slate-50 p-4 border rounded-lg h-20" />)}
                  </div>
                  <div className="h-40 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="h-10 w-10 text-blue-200" />
                  </div>
                </div>
              </BrowserFrame>
            </div>
          </section>

          <Separator className="my-12" />

          {/* 제 2장. 일정 관리 */}
          <section id="ch2-calendar" ref={el => { if (el) observerRefs.current["ch2-calendar"] = el; }} className="scroll-mt-24 space-y-10">
            <div className="border-b-2 border-slate-100 pb-4">
              <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                <Calendar className="h-8 w-8 text-emerald-600" />
                제 2장. 전사 일정 관리 (Calendar)
              </h2>
            </div>

            <div className="space-y-8">
              <p className="text-slate-600 text-lg leading-relaxed font-medium">전사 또는 지점의 모든 일정을 월/주/일 단위로 모니터링합니다.</p>

              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-800">
                  <Settings className="h-5 w-5 text-emerald-600" />
                  주요 버튼 및 액션
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-4 bg-white p-3 rounded-xl border border-emerald-50">
                    <Badge className="bg-emerald-100 text-emerald-800 h-6 shrink-0">[새 일정추가]</Badge>
                    <p className="text-sm text-slate-600">달력의 빈 날짜를 클릭하거나 우측 상단 버튼을 눌러 매장 공지나 개인 일정을 등록합니다.</p>
                  </div>
                  <div className="flex items-start gap-4 bg-white p-3 rounded-xl border border-emerald-50">
                    <Badge className="bg-emerald-100 text-emerald-800 h-6 shrink-0">[날짜 드래그]</Badge>
                    <p className="text-sm text-slate-600">등록된 일정 블록을 다른 날짜로 드래그하면 <strong>일정이 즉시 수정</strong>됩니다. (자동 저장)</p>
                  </div>
                  <div className="flex items-start gap-4 bg-white p-3 rounded-xl border border-emerald-50">
                    <Badge className="bg-emerald-100 text-emerald-800 h-6 shrink-0">[필터: 지점별]</Badge>
                    <p className="text-sm text-slate-600">좌측 체크박스를 통해 전체 지점의 일정을 합쳐 보거나 내 지점 일정만 걸러 볼 수 있습니다.</p>
                  </div>
                </div>
              </div>

              <div className="prose max-w-none text-slate-600 text-lg leading-relaxed">
                <p>전사 또는 각 지점의 일정을 통합 관리합니다. 특히 주문 관리와 완벽히 연동되어 <Highlight>배송 및 픽업 예약</Highlight>이 달력에 자동으로 표시되므로 중복 작업이나 일정 누락을 방지합니다.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <FeatureCard title="주문 데이터 자동 연동" icon={History}>
                  <p>상품 주문 시 설정한 배송일/픽업일이 캘린더에 즉시 반영됩니다. 주문 상세 조회에서 수정된 내용도 실시간으로 연동됩니다.</p>
                </FeatureCard>
                <FeatureCard title="유연한 일정 관리" icon={Plus}>
                  <p>매장 회의, 휴무일, 행사 등 수동 일정 추가가 가능하며 드래그 앤 드롭으로 간편하게 날짜를 조정할 수 있습니다.</p>
                </FeatureCard>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800">1. 주요 활용 방법</h3>
                <StepGuide steps={[
                  "대시보드 또는 바로가기 메뉴를 통해 [일정 관리] 페이지로 이동합니다.",
                  "우측 상단 탭에서 월/주/일 보기를 선택하여 스케줄을 확인합니다.",
                  "배송예약 일정(파란색)을 클릭하여 해당 주문의 상세 정보를 확인합니다.",
                  "본사 공용 일정과 지점별 개인 일정을 필터링하여 조회할 수 있습니다."
                ]} />
              </div>
            </div>
          </section>

          <Separator className="my-12" />

          {/* 제 3장. 체크리스트 */}
          <section id="ch3-checklist" ref={el => { if (el) observerRefs.current["ch3-checklist"] = el; }} className="scroll-mt-24 space-y-10">
            <div className="border-b-2 border-slate-100 pb-4">
              <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                <ClipboardList className="h-8 w-8 text-purple-600" />
                제 3장. 체크리스트 관리
              </h2>
            </div>

            <div className="space-y-8">
              <p className="text-slate-600 text-lg leading-relaxed font-medium">오픈/마감 등 루틴 업무를 표준화하여 관리합니다.</p>
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                <h4 className="font-bold mb-3 text-indigo-900 flex items-center gap-2"><Settings className="h-5 w-5" /> 주요 조작 가이드</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-indigo-800">
                  <li><strong>[체크 항목 클릭]</strong>: 업무 완료 여부를 토글합니다. 완료 시 <Highlight>완료 시간과 담당자</Highlight>가 자동 기록됩니다.</li>
                  <li><strong>[초기화]</strong>: 모든 체크 항목을 해제하여 새로운 업무 주기를 시작합니다.</li>
                  <li><strong>[템플릿 적용] (본사 전용)</strong>: 전사 공통 업무 리스트를 일괄적으로 내보냅니다.</li>
                </ul>
              </div>
              <div className="prose max-w-none text-slate-600 text-lg leading-relaxed">
                <p>매장의 업무 프로세스를 표준화하고 완료 여부를 이력으로 관리하는 도구입니다. 관리자가 미리 설정한 <Highlight>템플릿</Highlight>을 통해 전문적인 매장 운영을 지원합니다.</p>
              </div>

              <div className="bg-slate-50 border-l-4 border-indigo-400 p-6 rounded-r-xl space-y-4 text-sm">
                <h4 className="font-bold flex items-center gap-2 text-slate-800"><Settings className="h-5 w-5 text-slate-500" /> 업무 표준화 가이드 (템플릿)</h4>
                <div className="text-slate-600 space-y-2">
                  <p>반복되는 루틴 업무를 목록화하여 누락 없는 운영을 가능하게 합니다.</p>
                  <ul className="list-disc list-inside pl-2 space-y-1 text-xs">
                    <li><span className="font-semibold text-slate-700">오픈 점검:</span> 청소상태 확인, 물갈이, 자재 확인 등</li>
                    <li><span className="font-semibold text-slate-700">마감 점검:</span> 매출 정산 마감, 시재 확인, 보안 설정 등</li>
                  </ul>
                  <p className="mt-2 text-xs text-blue-600 font-bold italic">※ 템플릿의 생성 및 수정은 본사 관리자만 가능하여 전 지점 동일 기준이 적용됩니다.</p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* 제 4장. 샘플앨범 */}
          <section id="ch4-sample" ref={el => { if (el) observerRefs.current["ch4-sample"] = el; }} className="scroll-mt-24 space-y-10">
            <div className="border-b-2 border-slate-100 pb-4">
              <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                <Images className="h-8 w-8 text-pink-600" />
                제 4장. 샘플앨범 (Portfolio)
              </h2>
            </div>

            <div className="space-y-8">
              <p className="text-slate-600 text-lg leading-relaxed font-medium">고객 상담 시 실제 제작 사례를 보여줄 수 있는 고화질 포트폴리오 창고입니다. 태그를 사용하여 고객의 요구(색상, 목적, 가격대)에 맞는 상품을 즉시 제안할 수 있습니다.</p>
              <div className="bg-pink-50 p-6 rounded-2xl border border-pink-200">
                <h4 className="font-bold mb-4 text-pink-900">샘플앨범 내 주요 버튼</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-pink-100">
                    <span className="font-bold text-pink-600 block mb-1">[태그 필터]</span>
                    <p className="text-xs text-slate-600">#장미 #꽃다발 등 태그를 누르면 해당 태그가 포함된 포트폴리오만 즉시 소팅됩니다.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-pink-100">
                    <span className="font-bold text-pink-600 block mb-1">[새 사진 등록]</span>
                    <p className="text-xs text-slate-600">지점 단말기에서 직접 사진을 찍어 올리거나 PC에서 업로드하여 포트폴리오를 추가합니다.</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <FeatureCard title="스마트 태그 검색" icon={Search}>
                  <p>#레드 #꽃다발 #기념일 등 멀티 태그를 선택하여 정교한 검색이 가능합니다. 자주 사용하는 검색 조건은 즐겨찾기에 추가하세요.</p>
                </FeatureCard>
                <FeatureCard title="제작 완료 사진 연동" icon={Camera}>
                  <p>주문 처리 과정에서 업로드한 실제 결과물 사진을 즉시 샘플앨범으로 등록하여 매장의 포트폴리오를 실시간으로 확장합니다.</p>
                </FeatureCard>
              </div>

              <BrowserFrame url="/dashboard/sample-albums">
                <div className="p-4 bg-white grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="aspect-square bg-slate-100 rounded-md flex items-center justify-center relative overflow-hidden group">
                      <Images className="h-6 w-6 text-slate-300" />
                      <div className="absolute bottom-1 left-1 flex gap-1">
                        <Badge className="text-[8px] h-3 px-1">#장미</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </BrowserFrame>
            </div>
          </section>

          <Separator />

          {/* 제 5장. 주문 접수 (Entry) */}
          <section id="ch5-orders-new" ref={el => { if (el) observerRefs.current["ch5-orders-new"] = el; }} className="scroll-mt-24 space-y-10">
            <div className="border-b-2 border-slate-100 pb-4">
              <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                <ShoppingCart className="h-8 w-8 text-emerald-600" />
                제 5장. 주문 접수 (PC/Mobile)
              </h2>
            </div>

            <div className="space-y-8">
              <p className="text-slate-600 text-lg leading-relaxed font-medium">PC와 모바일 각각의 환경에 최적화된 주문 접수 기능을 제공합니다.</p>

              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                <h4 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-800">
                  <Settings className="h-5 w-5 text-emerald-600" />
                  주요 입력 및 액션 버튼
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="font-bold text-emerald-700 mb-2">[고객번호 조회]</div>
                    <p className="text-xs text-slate-500">전화번호 입력 후 돋보기 버튼을 누르면 고객의 등급과 포인트를 가져옵니다.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="font-bold text-emerald-700 mb-2">[수령 방식 선택]</div>
                    <p className="text-xs text-slate-500">배송/픽업 버튼을 눌러 관련 정보(주소 등)를 입력하고 배송비를 자동 산정합니다.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="font-bold text-emerald-700 mb-2">[접수 완료] 버튼</div>
                    <p className="text-xs text-slate-500">최종 결제를 처리하고 주문서를 생성합니다. 완료 즉시 알림톡 버튼이 활성화됩니다.</p>
                  </div>
                </div>
              </div>

              <div className="prose max-w-none text-slate-600 text-lg leading-relaxed">
                <p>다양한 환경에서 빠르고 정확하게 주문을 생성할 수 있도록 최적화된 인터페이스를 제공합니다. PC 버전은 <Highlight>디테일한 상세 입력</Highlight>에, 모바일 버전은 <Highlight>현장 즉시 상담 및 간편 결제</Highlight>에 특화되어 있습니다.</p>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Building className="h-5 w-5" /> 5.1. PC 버전: 상세 주문 접수</h3>
                <div className="grid md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-white p-4 rounded-lg border shadow-sm space-y-2">
                    <div className="font-bold border-b pb-1">고객 및 수령 정보</div>
                    <p className="text-slate-500">회원 검색을 통해 등급별 할인 및 포인트를 자동 적용합니다.</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border shadow-sm space-y-2">
                    <div className="font-bold border-b pb-1">상품 배정 및 메시지</div>
                    <p className="text-slate-500">상품별 옵션과 리본/카드 정보를 출력 양식에 맞춰 입력합니다.</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border shadow-sm space-y-2">
                    <div className="font-bold border-b pb-1">결제 및 증빙발행</div>
                    <p className="text-slate-500">현금영수증, 세금계산서 및 디지털 영수증 알림톡 발송을 지원합니다.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Menu className="h-5 w-5" /> 5.2. 모바일/태블릿 버전: 퀵 오더</h3>
                <div className="grid md:grid-cols-2 gap-6 items-center border rounded-2xl p-6 bg-slate-50/50">
                  <div className="space-y-4">
                    <FeatureCard title="카테고리 퀵 선택" icon={Menu}>
                      <p className="text-xs">이미지 위주의 메뉴판 구성을 통해 터치만으로 장바구니에 담을 수 있습니다.</p>
                    </FeatureCard>
                    <FeatureCard title="현장 카드 결제 연동" icon={DollarSign}>
                      <p className="text-xs">블루투스 단말기를 연동하여 현장에서 즉시 카드 결제를 완료할 수 있습니다.</p>
                    </FeatureCard>
                  </div>
                  <div className="bg-white border-8 border-slate-200 rounded-[3rem] aspect-[9/16] h-[300px] mx-auto shadow-2xl relative flex flex-col overflow-hidden">
                    <div className="h-6 bg-slate-100 w-full flex justify-center py-1 gap-1"><div className="w-12 h-1 bg-slate-300 rounded-full" /></div>
                    <div className="flex-1 p-3 space-y-3">
                      <div className="h-4 w-20 bg-slate-100 rounded" />
                      <div className="grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4].map(i => <div key={i} className="aspect-square bg-slate-50 border rounded flex items-center justify-center"><Images className="h-4 w-4 text-slate-200" /></div>)}
                      </div>
                      <div className="h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">주문 담기 (2)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* 제 6장. 주문 현황 관리 */}
          <section id="ch6-orders-list" ref={el => { if (el) observerRefs.current["ch6-orders-list"] = el; }} className="scroll-mt-24 space-y-10">
            <div className="border-b-2 border-slate-100 pb-4">
              <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                <ClipboardList className="h-8 w-8 text-violet-600" />
                제 6장. 주문 현황 및 내역 관리
              </h2>
            </div>

            <div className="space-y-8">
              <div className="prose max-w-none text-slate-600 text-lg leading-relaxed font-medium">
                <p>현재 진행 중인 모든 주문을 한눈에 관리하고, 각 단계별 액션을 수행합니다.</p>
              </div>

              {/* 주요 버튼 설명: 이관, 인쇄, 엑셀 등 */}
              <div className="bg-violet-50 rounded-2xl p-6 border border-violet-100">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-violet-900">
                  <Settings className="h-5 w-5 text-violet-600" />
                  대표적인 액션 버튼 가이드
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-violet-50">
                    <div className="p-2 bg-blue-100 rounded text-blue-600"><ArrowRightLeft className="h-5 w-5" /></div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-800">[주문 이관] 버튼</div>
                      <p className="text-xs text-slate-500">다른 전 지점으로 주문을 넘기기 위해 이관 요청 창을 띄웁니다.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-violet-50">
                    <div className="p-2 bg-indigo-100 rounded text-indigo-600"><FileText className="h-5 w-5" /></div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-800">[메시지 인쇄] 버튼</div>
                      <p className="text-xs text-slate-500">리본/카드 출력 양식을 설정하고 프린터로 바로 전송합니다.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-violet-50">
                    <div className="p-2 bg-emerald-100 rounded text-emerald-600"><Download className="h-5 w-5" /></div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-800">[엑셀 내려받기] 버튼</div>
                      <p className="text-xs text-slate-500">필터링된 현재 주문 목록을 엑셀 파일로 추출하여 보고용으로 사용합니다.</p>
                    </div>
                  </div>
                </div>
              </div>

              <BrowserFrame url="/dashboard/orders">
                <div className="p-4 bg-white space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex gap-1">
                      {['전체', '신규', '제작중', '배송중'].map(t => <div key={t} className="h-6 w-12 bg-slate-100 rounded text-[8px] flex items-center justify-center font-bold">{t}</div>)}
                    </div>
                    <div className="h-7 w-20 bg-violet-600 rounded text-white text-[8px] flex items-center justify-center font-bold">엑셀 다운로드</div>
                  </div>
                  <div className="border rounded-lg overflow-hidden text-[10px]">
                    <div className="bg-slate-50 border-b p-2 font-bold grid grid-cols-6 items-center">
                      <span>수령일</span><span>주문자</span><span>상품</span><span>금액</span><span>상태</span><span>작업</span>
                    </div>
                    <div className="p-2 border-b grid grid-cols-6 items-center hover:bg-slate-50">
                      <span className="font-bold">05/20</span>
                      <span>홍길동</span>
                      <span className="truncate">작약 꽃다발</span>
                      <span>₩85,000</span>
                      <span><Badge className="bg-amber-100 text-amber-700 h-4 px-1 text-[8px]">제작 중</Badge></span>
                      <div className="flex gap-1 text-slate-400">
                        <ArrowRightLeft className="h-3 w-3" /><FileText className="h-3 w-3" /><Truck className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </BrowserFrame>

              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <FeatureCard title="주문 이관 (Transfer)" icon={ExternalLink}>
                  <p>타 지점으로 주문을 넘기거나(발주) 받는 업무입니다. 거리에 따른 적정 지점 선정 시 <strong>주문 이관 시스템</strong>을 통해 실시간 업무 공유가 가능합니다.</p>
                </FeatureCard>
                <FeatureCard title="일일 매출 정산" icon={DollarSign}>
                  <p>상단 <strong>[오늘의 매출/정산]</strong> 버튼을 통해 카드, 현금, 이체 내역별 매출을 합산하고 실제 시재와 대조하여 마감을 수행합니다.</p>
                </FeatureCard>
              </div>
            </div>
          </section>

          <Separator className="my-12" />

          {/* 제 7장. 외부 발주 관리 */}
          <section id="ch7-outsource" ref={el => { if (el) observerRefs.current["ch7-outsource"] = el; }} className="scroll-mt-24 space-y-10">
            <div className="border-b-2 border-slate-100 pb-4">
              <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                <ExternalLink className="h-8 w-8 text-orange-600" />
                제 7장. 외부 발주 관리 (Outsource)
              </h2>
            </div>
            <div className="space-y-6">
              <p className="text-slate-600 text-lg leading-relaxed font-medium">직접 제작이 불가능한 원거리 배송이나 특정 상품을 외부 협력사(파트너)에 발주하고 이력을 관리하는 기능입니다.</p>
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl flex gap-4">
                <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
                <div className="text-sm text-amber-800 leading-relaxed">
                  <p className="font-bold mb-1">파트너 자동 알림 기능</p>
                  <p>발주 완료 시 등록된 협력사 정보로 <strong>카카오 알림톡/문자 발주서</strong>가 자동 전송됩니다. 해당 파트너의 접수 확인 여부를 시스템에서 즉시 확인할 수 있습니다.</p>
                </div>
              </div>
            </div>
          </section>

          <Separator className="my-12" />

          {/* 제 8장. 픽업/배송 관리 */}
          <section id="ch8-pickup" ref={el => { if (el) observerRefs.current["ch8-pickup"] = el; }} className="scroll-mt-24 space-y-10">
            <div className="border-b-2 border-slate-100 pb-4">
              <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                <Truck className="h-8 w-8 text-blue-600" />
                제 8장. 픽업/배송 관리 (Logs)
              </h2>
            </div>
            <div className="space-y-8">
              <p className="text-slate-600 text-lg leading-relaxed font-medium">배송 현황을 시각적으로 모니터링하고, 기사 배정 및 사진 전송 업무를 수행합니다.</p>
              <div className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b font-bold text-sm flex items-center gap-2"><Truck className="h-4 w-4 text-slate-400" /> 실시간 배송 현황판</div>
                <div className="grid grid-cols-4 divide-x">
                  <div className="p-6 text-center hover:bg-slate-50 transition-colors"><div className="text-xs text-slate-400 mb-1">미배정</div><div className="text-3xl font-bold text-slate-700">3</div></div>
                  <div className="p-6 text-center hover:bg-slate-50 transition-colors"><div className="text-xs text-slate-400 mb-1">배차완료</div><div className="text-3xl font-bold text-slate-700">5</div></div>
                  <div className="p-6 text-center bg-blue-50/50 hover:bg-blue-50 transition-colors"><div className="text-xs text-blue-500 mb-1 font-bold">배송중</div><div className="text-3xl font-bold text-blue-600">2</div></div>
                  <div className="p-6 text-center hover:bg-slate-50 transition-colors"><div className="text-xs text-slate-400 mb-1">완료</div><div className="text-3xl font-bold text-slate-700">12</div></div>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-sm italic text-slate-500 flex items-center gap-3">
                <Camera className="h-5 w-5 text-pink-500" />
                배송 완료 시 현장 사진을 업로드하면 고객에게 알림톡과 함께 사진이 전송되며, 즉시 샘플앨범 등록이 가능합니다.
              </div>
            </div>
          </section>

          <Separator className="my-12" />

          {/* 제 9장. 수령자/배송지 관리 */}
          <section id="ch9-recipients" ref={el => { if (el) observerRefs.current["ch9-recipients"] = el; }} className="scroll-mt-24 space-y-10">
            <div className="border-b-2 border-slate-100 pb-4">
              <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                <MapPin className="h-8 w-8 text-rose-600" />
                제 9장. 수령자/배송지 관리
              </h2>
            </div>
            <div className="space-y-8">
              <div className="prose max-w-none text-slate-600 text-lg leading-relaxed font-medium">
                <p>반복적으로 배송이 이루어지는 수령 주소(전시장, 웨딩홀, 사무실 등)를 미리 저장하여 주문 접수 시 주소 검색 시간을 단축합니다. <Highlight>단골 수령지</Highlight> 관리는 오배송 방지의 핵심입니다.</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h4 className="font-bold mb-3 text-slate-800 flex items-center gap-2"><Settings className="h-5 w-5" /> 조작 가이드 및 연동 버튼</h4>
                <div className="space-y-2 text-sm text-slate-600 leading-relaxed">
                  <p>1. 주문 접수 화면의 <strong>수령자 정보</strong> 섹션 우측 [수령자 찾기] 버튼을 누릅니다.</p>
                  <p>2. 검색창에서 상호명이나 이름을 입력하면 자동 완성됩니다.</p>
                  <p>3. 선택 시 주소와 연락처가 폼에 자동 입력됩니다.</p>
                </div>
              </div>
            </div>
          </section>

          <Separator className="my-12" />

          {/* 제 10장. 고객 CRM 관리 */}
          <section id="ch10-customers" ref={el => { if (el) observerRefs.current["ch10-customers"] = el; }} className="scroll-mt-24 space-y-10">
            <div className="border-b-2 border-slate-100 pb-4">
              <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                <BookUser className="h-8 w-8 text-pink-600" />
                제 10장. 고객 CRM 관리 (CRM)
              </h2>
            </div>

            <div className="space-y-8">
              <div className="prose max-w-none text-slate-600 text-lg leading-relaxed">
                <p>단순한 연락처 관리를 넘어, 고객의 구매 패턴을 분석하고 로열티를 관리하는 강력한 CRM 기능을 제공합니다.</p>
              </div>

              <div className="bg-pink-50 rounded-2xl p-6 border border-pink-100">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-pink-900">
                  <Settings className="h-5 w-5 text-pink-600" />
                  고객 관리 핵심 기능
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-pink-50">
                    <div className="font-bold text-pink-700 mb-1">[포인트 수동 조정]</div>
                    <p className="text-xs text-slate-500">고객의 불만 처리나 이벤트 등으로 포인트를 직접 지급/차감할 수 있습니다.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-pink-50">
                    <div className="font-bold text-pink-700 mb-1">[상담 메모 추가]</div>
                    <p className="text-xs text-slate-500">선호하는 꽃, 주의사항 등을 기록하여 다음 상담 시 활용합니다.</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <FeatureCard title="고객 이력 및 포인트" icon={TrendingUp}>
                  <p>고객별 총 구매액, 방문 횟수, 잔여 포인트를 관리합니다. 과거 상담 내역과 선호하는 스타일(색상, 꽃 종류)을 기록하여 맞춤형 응대를 지원합니다.</p>
                </FeatureCard>
                <FeatureCard title="등급별 자동 혜택" icon={Target}>
                  <p>주문 금액에 따라 고객 등급(일반, 우수, VIP)을 자동 분류하고, 결제 시 등급별 포인트 적립 또는 할인율을 자동으로 적용합니다.</p>
                </FeatureCard>
              </div>
            </div>
          </section>

          <Separator className="my-12" />

          {/* 제 11장. 거래처 및 파트너 */}
          <section id="ch11-partners" ref={el => { if (el) observerRefs.current["ch11-partners"] = el; }} className="scroll-mt-24 space-y-10">
            <div className="border-b-2 border-slate-100 pb-4">
              <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                <Briefcase className="h-8 w-8 text-amber-600" />
                제 11장. 거래처 및 파트너 (Partners)
              </h2>
            </div>
            <div className="space-y-6">
              <p className="text-slate-600 text-lg leading-relaxed font-medium">거래하는 모든 업체의 정보를 관리합니다.</p>
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                <h4 className="font-bold mb-3 text-amber-900 flex items-center gap-2"><Settings className="h-5 w-5" /> 주요 필드 및 버튼</h4>
                <p className="text-sm text-slate-600"><Highlight>정산 계좌</Highlight> 정보를 등록해두면 본사에서 매입 대금을 지급할 때 활용됩니다.</p>
              </div>
            </div>
          </section>

          <Separator className="my-12" />

          {/* 제 12장. 견적서 관리 */}
          <section id="ch12-quotations" ref={el => { if (el) observerRefs.current["ch12-quotations"] = el; }} className="scroll-mt-24 space-y-10">
            <div className="border-b-2 border-slate-100 pb-4">
              <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                <FileText className="h-8 w-8 text-indigo-600" />
                제 12장. 견적서 관리 (Quotation)
              </h2>
            </div>
            <div className="space-y-8">
              <p className="text-slate-600 text-lg leading-relaxed font-medium">기업 거래나 대량 주문 시 필요한 공식 견적 문서를 생성합니다. 생성된 견적은 PDF 파일로 즉시 변환되어 이메일이나 카카오톡으로 발송할 수 있습니다.</p>
              <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-900">
                  <Settings className="h-5 w-5 text-indigo-600" />
                  문서 관리 버튼 가이드
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-indigo-50 shadow-sm">
                    <div className="font-bold text-indigo-700 mb-2">[PDF 저장] 버튼</div>
                    <p className="text-xs text-slate-500">입력된 견적 내용을 바탕으로 공식 인발 양식의 PDF 파일을 즉시 생성합니다.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-indigo-50 shadow-sm">
                    <div className="font-bold text-indigo-700 mb-2">[주문 전환] 버튼</div>
                    <p className="text-xs text-slate-500">견적 확정 시 해당 데이터를 <Highlight>주문 접수</Highlight> 화면으로 그대로 복사합니다.</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-xs text-slate-500 flex items-center gap-3 italic">
                <AlertCircle className="h-5 w-5 text-indigo-500" />
                견적서에서 바로 '주문으로 전환' 버튼을 클릭하면, 입력된 항목들이 주문 접수 화면으로 자동 자동 연동됩니다. (재입력 방지)
              </div>
            </div>
          </section>

          <Separator className="my-12" />

          {/* 제 13장. 인사 서류 신청 */}
          <section id="ch13-hr-requests" ref={el => { if (el) observerRefs.current["ch13-hr-requests"] = el; }} className="scroll-mt-24 space-y-10">
            <div className="border-b-2 border-slate-100 pb-4">
              <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                <UserPlus className="h-8 w-8 text-rose-500" />
                제 13장. 인사 서류 신청 (HR)
              </h2>
            </div>
            <div className="space-y-8">
              <p className="text-slate-600 text-lg leading-relaxed font-medium">휴가 신청, 재직증명서 발급 등 인사 관련 모든 요청을 본사에 비대면으로 신청하는 창구입니다.</p>
              <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                <h4 className="font-bold mb-3 text-rose-900 flex items-center gap-2"><Settings className="h-5 w-5" /> 신청 프로세스</h4>
                <p className="text-sm text-slate-600"><Highlight>신규 신청</Highlight> 버튼을 눌러 서류 종류를 선택하고 제출하면 본사 관리자에게 실시간 알림이 전송됩니다.</p>
              </div>
              <StepGuide steps={[
                "[인사 서류 신청] 메뉴에서 [신규 신청] 버튼을 누릅니다.",
                "신청 목적(연차, 경력증명서 등)과 희망 일자를 선택합니다.",
                "본사 관리자의 실시간 승인 여부를 '내 신청함' 탭에서 확인합니다.",
                "승인 완료된 증명서는 즉시 PDF로 다운로드 받거나 모바일로 공유 가능합니다."
              ]} />
            </div>
          </section>

          <Separator className="h-2 bg-slate-100 my-12" />
          <div className="bg-blue-50 p-8 rounded-2xl border border-blue-100 text-center space-y-2">
            <h3 className="text-2xl font-bold text-blue-800">역할별 상세 기능 가이드</h3>
            <p className="text-blue-600 font-medium text-lg">현재 <Highlight className="bg-white px-2 py-0.5 shadow-sm">{isHQ ? "본사 관리자" : "지점 사용자"}</Highlight> 권한에 최적화된 매뉴얼이 표시됩니다.</p>
          </div>

          {/* --- HQ ONLY SECTIONS --- */}
          {isHQ ? (
            <div className="space-y-24">
              {/* 제 14장. 통합 상품 관리 */}
              <section id="ch14-products" ref={el => { if (el) observerRefs.current["ch14-products"] = el; }} className="scroll-mt-24 space-y-10">
                <div className="border-b-2 border-slate-100 pb-4">
                  <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                    <Boxes className="h-8 w-8 text-indigo-600" />
                    제 14장. 통합 상품 관리
                  </h2>
                </div>
                <div className="space-y-8">
                  <p className="text-slate-600 text-lg leading-relaxed font-medium">전 지점에서 판매될 상품의 마스터 정보를 관리합니다. 상품명, 가격, 옵션 등을 일괄 제어할 수 있습니다.</p>

                  <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-900">
                      <Settings className="h-5 w-5 text-indigo-600" />
                      상품 관리 도구 및 버튼
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-4 bg-white p-3 rounded-xl border border-indigo-50">
                        <Badge className="bg-indigo-100 text-indigo-800 h-6 shrink-0">[판매 상태 토글]</Badge>
                        <p className="text-sm text-slate-600">스위치 버튼을 통해 특정 상품을 <strong>판매중 / 품절 / 숨김</strong> 상태로 즉시 변경합니다.</p>
                      </div>
                      <div className="flex items-start gap-4 bg-white p-3 rounded-xl border border-indigo-50">
                        <Badge className="bg-indigo-100 text-indigo-800 h-6 shrink-0">[가격 일괄 조정]</Badge>
                        <p className="text-sm text-slate-600">명절이나 시즌 이슈 발생 시 여러 상품의 가격을 한 번에 % 또는 정액으로 수정합니다.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <Separator className="my-12" />

              {/* 제 15장. 자재/재고/기록 */}
              <section id="ch15-materials" ref={el => { if (el) observerRefs.current["ch15-materials"] = el; }} className="scroll-mt-24 space-y-10">
                <div className="border-b-2 border-slate-100 pb-4">
                  <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                    <Hammer className="h-8 w-8 text-amber-600" />
                    제 15장. 자재 및 재고 관리
                  </h2>
                </div>
                <div className="space-y-8">
                  <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-amber-900">
                      <History className="h-5 w-5 text-amber-600" />
                      재고 상세 조정 액션
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-50">
                        <div className="font-bold text-amber-700 mb-1">[강제 재고수정] 버튼</div>
                        <p className="text-xs text-slate-500">전산과 실재고가 다를 때 사유(파손, 기부 등)를 입력하고 고칩니다.</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-50">
                        <div className="font-bold text-amber-700 mb-1">[바코드 인쇄]</div>
                        <p className="text-xs text-slate-500">라벨 프린터가 연결된 경우 자재 식별용 바코드를 출력합니다.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <Separator className="my-12" />

              {/* 제 16장. 자재 요청 승인 */}
              <section id="ch16-mat-req-admin" ref={el => { if (el) observerRefs.current["ch16-mat-req-admin"] = el; }} className="scroll-mt-24 space-y-10">
                <div className="border-b-2 border-slate-100 pb-4">
                  <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                    <Package className="h-8 w-8 text-orange-600" />
                    제 16장. 자재 요청 승인 관리
                  </h2>
                </div>
                <div className="space-y-6">
                  <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                    <h4 className="font-bold mb-3 text-orange-900 flex items-center gap-2"><Settings className="h-5 w-5" /> 승인 처리 가이드</h4>
                    <div className="space-y-3">
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">지점에서 요청한 목록을 확인한 후 우측의 <strong>[승인]</strong> 버튼을 누르면 본사 재고가 차감되고 출고 정보가 생성됩니다.</p>
                      <div className="p-3 bg-white rounded-lg border border-orange-100 italic text-[11px] text-orange-600">※ 재고가 부족할 경우 '반려' 버튼을 누르고 사유를 남기면 지점 알림으로 전송됩니다.</div>
                    </div>
                  </div>
                </div>
              </section>

              <Separator className="my-12" />

              {/* 제 17장. 구매/매입 관리 */}
              <section id="ch17-purchase" ref={el => { if (el) observerRefs.current["ch17-purchase"] = el; }} className="scroll-mt-24 space-y-10">
                <div className="border-b-2 border-slate-100 pb-4">
                  <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                    <ShoppingCart className="h-8 w-8 text-emerald-600" />
                    제 17장. 구매 및 매입 관리
                  </h2>
                </div>
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                  <h4 className="font-bold mb-3 text-emerald-900 flex items-center gap-2"><Plus className="h-5 w-5" /> [신규 발주서 작성] 버튼</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">거래처(농장/부자재상)에 보낼 발주 품목을 담아 이메일 또는 FAX로 발송하는 양식을 생성합니다.</p>
                </div>
              </section>

              <Separator className="my-12" />

              {/* 제 18장. 비용/예산 관리 */}
              <section id="ch18-expenses" ref={el => { if (el) observerRefs.current["ch18-expenses"] = el; }} className="scroll-mt-24 space-y-10">
                <div className="border-b-2 border-slate-100 pb-4">
                  <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                    <DollarSign className="h-8 w-8 text-red-600" />
                    제 18장. 비용 및 예산 관리
                  </h2>
                </div>
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                  <h4 className="font-bold mb-3 text-red-900 flex items-center gap-2"><Settings className="h-5 w-5" /> 결재 프로세스 동작</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">지점에서 올린 비용 신청 건을 검토하여 <strong>[결재 승인]</strong> 시 해당 월의 지점 예산 잔액이 자동차감 반영됩니다.</p>
                </div>
              </section>

              <Separator className="my-12" />

              {/* 제 19장. 간편 지출/마감 */}
              <section id="ch19-simple-expenses" ref={el => { if (el) observerRefs.current["ch19-simple-expenses"] = el; }} className="scroll-mt-24 space-y-10">
                <div className="border-b-2 border-slate-100 pb-4">
                  <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                    <Receipt className="h-8 w-8 text-teal-600" />
                    제 19장. 간편 지출 및 마감 관리 (HQ)
                  </h2>
                </div>
                <div className="space-y-8">
                  <p className="text-slate-600 text-lg leading-relaxed font-medium">
                    지점에서 발생하는 모든 현금/카드 지출을 본사에서 통합 모니터링합니다.
                    신입 관리자는 이 메뉴를 통해 지점의 일일 정산이 정확하게 이루어지는지 확인할 수 있습니다.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FeatureCard title="지점별 데이터 필터링" icon={Building}>
                      <p className="text-sm">우측 상단의 <strong>[지점 선택]</strong> 드롭다운을 통해 특정 지점의 내역만 보거나 전 지점 합계를 조회할 수 있습니다.</p>
                    </FeatureCard>
                    <FeatureCard title="월별 리포트 추출" icon={Download}>
                      <p className="text-sm"><strong>[엑셀 다운로드]</strong> 버튼을 사용하면 선택한 기간의 모든 지출 내역이 지점별 시트로 구분된 통합 보고서로 생성됩니다.</p>
                    </FeatureCard>
                  </div>

                  <div className="bg-teal-50 p-6 rounded-2xl border border-teal-100">
                    <h4 className="font-bold mb-4 text-teal-900 flex items-center gap-2 font-bold"><Settings className="h-5 w-5" /> 본사 관리자 핵심 버튼 가이드</h4>
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>[본사 관리] 탭</Badge>
                          <span className="font-bold text-slate-800">지점 마감 현황 확인</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          각 지점 관리자가 당일 업무를 마치고 누르는 '데이터 마감' 상태를 실시간으로 확인합니다.
                          미마감 지점이 있을 경우 해당 지점에 연락하여 정산 확인을 독촉할 수 있습니다.
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">[일괄 삭제]</Badge>
                          <span className="font-bold text-slate-800">오데이터 정리</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          지점에서 중복 입력하거나 실수로 잘못 올린 데이터들을 다중 선택하여 한 번에 삭제 처리할 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <Separator className="my-12" />

              {/* 제 20장. 전국 지점 관리 */}
              <section id="ch20-branches" ref={el => { if (el) observerRefs.current["ch20-branches"] = el; }} className="scroll-mt-24 space-y-10">
                <div className="border-b-2 border-slate-100 pb-4">
                  <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                    <Store className="h-8 w-8 text-slate-600" />
                    제 20장. 전국 지점 및 조직 관리
                  </h2>
                </div>
                <div className="space-y-6 text-slate-600">
                  <p className="text-lg font-medium leading-relaxed">프랜차이즈 네트워크의 기반이 되는 각 지점의 기본 정보를 관리합니다.</p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                      <h4 className="font-bold mb-3 text-slate-800 flex items-center gap-2"><Plus className="h-5 w-5" /> [신규 지점 추가]</h4>
                      <p className="text-sm">지점명, 코드, 사업자 정보, 그리고 가장 중요한 <strong>'지점 권한'</strong>을 설정하여 해당 지점 관리자 계정을 활성화합니다.</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                      <h4 className="font-bold mb-3 text-slate-800 flex items-center gap-2"><MapPin className="h-5 w-5" /> [배송 가능 지역]</h4>
                      <p className="text-sm">해당 지점이 담당하는 행정동 구역을 설정합니다. 고객 주문 접수 시 주소를 기반으로 지점이 자동 배정되는 기준이 됩니다.</p>
                    </div>
                  </div>
                </div>
              </section>

              <Separator className="my-12" />

              {/* 제 21장. 리포트 성과 분석 */}
              <section id="ch21-reports" ref={el => { if (el) observerRefs.current["ch21-reports"] = el; }} className="scroll-mt-24 space-y-10">
                <div className="border-b-2 border-slate-100 pb-4">
                  <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                    제 21장. 리포트 및 성과 분석
                  </h2>
                </div>
                <div className="space-y-8">
                  <p className="text-slate-600 text-lg leading-relaxed font-medium">데이터에 기반한 경영 의사결정을 위해 전 지점의 실적을 다각도로 분석합니다.</p>

                  <div className="bg-blue-50 p-8 rounded-2xl border border-blue-100">
                    <h4 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-900"><TrendingUp className="h-6 w-6" /> 핵심 분석 리포트 가이드</h4>
                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                      <div className="bg-white p-5 rounded-xl shadow-sm space-y-3">
                        <div className="font-bold text-blue-800 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> 매출 실적 분석</div>
                        <p className="text-slate-600 leading-relaxed"><strong>[차트 보기]</strong> 클릭 시 전년 대비 성장률, 지점별 매출 비중, 요일별 매출 패턴 등을 시각적으로 확인합니다.</p>
                      </div>
                      <div className="bg-white p-5 rounded-xl shadow-sm space-y-3">
                        <div className="font-bold text-blue-800 flex items-center gap-2"><Users className="h-4 w-4" /> 고객 행동 분석</div>
                        <p className="text-slate-600 leading-relaxed"><strong>[목록 추출]</strong> 클릭 시 VIP 고객의 주문 빈도 변화, 신규 고객 유입 경로 등을 엑셀 데이터로 가공할 수 있습니다.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 text-xs text-slate-500 italic">
                    <Info className="h-4 w-4 text-blue-400" />
                    모든 리포트는 오른쪽 상단의 필터를 통해 기간, 지점, 상품 카테고리를 자유롭게 조합하여 조회할 수 있습니다.
                  </div>
                </div>
              </section>

              <Separator className="my-12" />

              {/* 제 22장. 인사/사용자/설정 */}
              <section id="ch22-hr-admin" ref={el => { if (el) observerRefs.current["ch22-hr-admin"] = el; }} className="scroll-mt-24 space-y-10">
                <div className="border-b-2 border-slate-100 pb-4">
                  <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                    <UserCog className="h-8 w-8 text-slate-700" />
                    제 22장. 인사, 사용자 및 시스템 설정
                  </h2>
                </div>
                <div className="space-y-6">
                  <div className="bg-slate-100 border border-slate-200 p-6 rounded-2xl">
                    <h4 className="font-bold mb-4 flex items-center gap-2"><Settings className="h-5 w-5" /> 관리 데이터 제어판</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-white p-3 rounded-lg border">
                        <strong>[계정 생성]</strong>: 신규 직원용 ID/PW를 발급합니다.
                      </div>
                      <div className="bg-white p-3 rounded-lg border">
                        <strong>[공지 등록]</strong>: 대시보드 메인 공지사항을 작성합니다.
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            /* --- BRANCH ONLY SECTIONS --- */
            <div className="space-y-24">
              <section id="ch-mat-req-branch" ref={el => { if (el) observerRefs.current["ch-mat-req-branch"] = el; }} className="scroll-mt-24 space-y-10">
                <div className="border-b-2 border-slate-100 pb-4">
                  <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                    <Package className="h-8 w-8 text-orange-600" />
                    자재 요청 (지점용 보충 버튼)
                  </h2>
                </div>
                <div className="space-y-6">
                  <p className="text-slate-600 text-lg leading-relaxed">필요한 소모품을 본사에 실시간으로 신청합니다.</p>
                  <StepGuide steps={[
                    "자재 목록 우측의 [장바구니 담기] 버튼을 누릅니다.",
                    "화면 상단 장바구니 아이콘을 눌러 수량을 검토합니다.",
                    "최종 [본사 요청 보내기] 버튼을 눌러 승인을 대기합니다."
                  ]} />
                </div>
              </section>

              <Separator className="my-12" />

              <section id="ch-mat-branch" ref={el => { if (el) observerRefs.current["ch-mat-branch"] = el; }} className="scroll-mt-24 space-y-10">
                <div className="border-b-2 border-slate-100 pb-4">
                  <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                    <Hammer className="h-8 w-8 text-amber-600" />
                    지점 자재 재고 관리
                  </h2>
                </div>
                <div className="space-y-6">
                  <p className="text-slate-600 text-lg leading-relaxed font-medium">우리 지점이 보유한 실제 꽃과 부자재의 재고를 관리합니다. 주기적인 실무 조사가 필요합니다.</p>

                  <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 space-y-4">
                    <h4 className="font-bold text-amber-900 flex items-center gap-2"><Settings className="h-5 w-5" /> 재고 현행화 버튼 가이드</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-amber-50 shadow-sm">
                        <div className="font-bold text-amber-700 mb-1">[강제 재고수정] 버튼</div>
                        <p className="text-xs text-slate-600">파손이나 로스(Loss) 발생 시 전산상의 숫자를 실제와 맞추기 위해 사용합니다. 반드시 사유를 입력하세요.</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-amber-50 shadow-sm">
                        <div className="font-bold text-amber-700 mb-1">[바코드 출력] 도구</div>
                        <p className="text-xs text-slate-600">자재 관리 선반에 부착할 식별용 바코드 라벨을 출력합니다. (라벨 프린터 필요)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <Separator className="my-12" />

              <section id="ch-exp-branch" ref={el => { if (el) observerRefs.current["ch-exp-branch"] = el; }} className="scroll-mt-24 space-y-10">
                <div className="border-b-2 border-slate-100 pb-4">
                  <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                    <Receipt className="h-8 w-8 text-teal-600" />
                    일일 지출 입력 및 정산 마감 가이드
                  </h2>
                </div>

                <div className="space-y-8">
                  <p className="text-slate-600 text-lg leading-relaxed font-medium">
                    매장에서 발생하는 소액 지출(식대, 주유비, 소모품 구입 등)을 누락 없이 입력하여 일일 정산 금액을 맞추는 메뉴입니다.
                  </p>

                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="p-4 border-teal-100 bg-teal-50/30">
                      <h5 className="font-bold text-teal-900 mb-2 flex items-center gap-2"><Plus className="h-4 w-4" /> 지출 입력</h5>
                      <p className="text-xs text-slate-600">영수증 발생 시 즉시 입력하는 기본 메뉴입니다.</p>
                    </Card>
                    <Card className="p-4 border-amber-100 bg-amber-50/30">
                      <h5 className="font-bold text-amber-900 mb-2 flex items-center gap-2"><Calendar className="h-4 w-4" /> 고정비 관리</h5>
                      <p className="text-xs text-slate-600">월세, 관리비 등 매달 나가는 항목을 한 번에 입력합니다.</p>
                    </Card>
                    <Card className="p-4 border-blue-100 bg-blue-50/30">
                      <h5 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> 차트 분석</h5>
                      <p className="text-xs text-slate-600">지점의 지출 비중을 시각적으로 확인합니다.</p>
                    </Card>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h4 className="font-bold mb-4 text-slate-800 flex items-center gap-2 font-bold"><Settings className="h-5 w-5" /> 주요 기능별 버튼 상세 설명</h4>
                    <div className="space-y-6">
                      <div className="border-l-4 border-teal-500 pl-4">
                        <div className="font-bold text-teal-800">[신규 지출 등록] - 수동 입력</div>
                        <ul className="text-sm text-slate-600 mt-2 space-y-2 list-disc ml-4">
                          <li><span className="font-semibold text-slate-800">[장바구니 담기]</span>: 여러 품목을 한 영수증으로 처리할 때 품목을 추가합니다.</li>
                          <li><span className="font-semibold text-slate-800">[재고 자동 업데이트]</span>: '자재비' 분류 선택 시, 입력한 수량만큼 지점 재고가 자동으로 증가합니다.</li>
                        </ul>
                      </div>
                      <div className="border-l-4 border-amber-500 pl-4">
                        <div className="font-bold text-amber-800">[템플릿 저장 & 일괄 입력] - 고정비</div>
                        <ul className="text-sm text-slate-600 mt-2 space-y-2 list-disc ml-4">
                          <li>매월 반복되는 항목을 설정해두고 <span className="font-semibold text-slate-800">[일괄 입력]</span> 버튼만 누르면 하루치 정산에 모두 반영됩니다.</li>
                        </ul>
                      </div>
                      <div className="border-l-4 border-slate-500 pl-4">
                        <div className="font-bold text-slate-800">[엑셀 일괄 업로드] - 대량 데이터</div>
                        <ul className="text-sm text-slate-600 mt-2 space-y-2 list-disc ml-4">
                          <li>많은 양의 지출을 한 번에 올릴 때 <span className="font-semibold text-slate-800">[템플릿 다운로드]</span> 후 정해진 양식대로 채워 업로드하면 몇 초 만에 처리됩니다.</li>
                        </ul>
                      </div>
                      <div className="border-l-4 border-blue-500 pl-4">
                        <div className="font-bold text-blue-800">[지출 내역] - 확인 및 수정</div>
                        <ul className="text-sm text-slate-600 mt-2 space-y-2 list-disc ml-4">
                          <li>잘못 입력한 내역은 <Eye className="h-3 w-3 inline text-blue-500" /> 아이콘을 눌러 수정하거나 삭제할 수 있습니다.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex items-start gap-3">
                    <Info className="h-6 w-6 text-blue-500 shrink-0" />
                    <div>
                      <h5 className="font-bold text-blue-900 text-sm">신입 사원 팁: 정산 마감과의 연동</h5>
                      <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                        여기서 입력한 지출 총액은 대시보드의 <Highlight>오늘의 정산</Highlight> 마감 시 지출액 항목으로 자동 로드됩니다.
                        따라서 정산 마감 전 반드시 모든 영수증 처리를 완료해야 합니다.
                      </p>
                    </div>
                  </div>
                </div>
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
