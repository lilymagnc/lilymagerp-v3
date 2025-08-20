"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useBranches } from "@/hooks/use-branches";
import { useOrders } from "@/hooks/use-orders";
import { useCustomers } from "@/hooks/use-customers";
import { useCalendar, CalendarEvent } from "@/hooks/use-calendar";
import { Calendar, CalendarDays, Truck, Package, Users, Bell, Plus, Filter, CreditCard } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, parseISO, setDate } from "date-fns";
import { ko } from "date-fns/locale";
import { EventDialog } from "./components/event-dialog";
import { DayEventsDialog } from "./components/day-events-dialog";

export default function CalendarPage() {
  const { user } = useAuth();
  const { branches } = useBranches();
  const { orders } = useOrders();
  const { customers } = useCustomers();
  const { events, loading, createEvent, updateEvent, deleteEvent } = useCalendar();
  
  // 사용자 권한에 따른 지점 필터링
  const isAdmin = user?.role === '본사 관리자';
  const userBranch = user?.franchise;
  
  // 상태 관리
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBranch, setSelectedBranch] = useState<string>('전체');
  const [selectedEventType, setSelectedEventType] = useState<string>('전체');
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayEventsDialogOpen, setIsDayEventsDialogOpen] = useState(false);

  // 사용자가 볼 수 있는 지점 목록
  const availableBranches = useMemo(() => {
    if (isAdmin) {
      // 본사가 이미 branches에 포함되어 있는지 확인
      const hasHeadquarters = branches.some(b => b.name === '본사');
      
      return [
        // 본사가 없으면 추가
        ...(hasHeadquarters ? [] : [{ id: '본사', name: '본사', type: '본사' }]),
        // 기존 지점들 필터링 (중복 제거)
        ...branches.filter(b => b.name && b.name !== '본사').map(b => ({
          id: b.id,
          name: b.name || '',
          type: b.type
        }))
      ];
    } else {
      return branches.filter(branch => branch.name === userBranch).map(b => ({
        id: b.id,
        name: b.name || '',
        type: b.type
      }));
    }
  }, [branches, isAdmin, userBranch]);

  // 사용자 권한에 따른 기본 지점 설정
  useEffect(() => {
    if (!isAdmin && userBranch) {
      // 관리자가 아닌 경우 해당 지점으로 자동 설정
      setSelectedBranch(userBranch);
    }
  }, [isAdmin, userBranch]);

  // 이벤트 타입별 설정
  const eventTypes = [
    { value: '전체', label: '전체', icon: CalendarDays, color: 'bg-gray-500' },
    { value: 'delivery', label: '배송/픽업', icon: Truck, color: 'bg-blue-500' },
    { value: 'material', label: '자재요청', icon: Package, color: 'bg-orange-500' },
    { value: 'employee', label: '직원스케줄', icon: Users, color: 'bg-green-500' },
    { value: 'notice', label: '공지/알림', icon: Bell, color: 'bg-red-500' },
    { value: 'payment', label: '월결제일', icon: CreditCard, color: 'bg-purple-500' }
  ];

  // 현재 월의 날짜들 계산
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 캘린더 네비게이션
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 픽업/배송 예약 데이터를 캘린더 이벤트로 변환
  const convertOrdersToEvents = useMemo(() => {
    const pickupDeliveryEvents: CalendarEvent[] = [];
    
    orders.forEach(order => {
      // 관리자가 아닌 경우 해당 지점의 주문만 처리
      if (!isAdmin && order.branchName !== userBranch) {
        return;
      }
      
             // 픽업 예약 처리 (즉시픽업 제외, 처리 중이거나 완료된 주문)
       if (order.pickupInfo && order.receiptType === 'pickup_reservation' && (order.status === 'processing' || order.status === 'completed')) {
        const pickupDate = parseISO(order.pickupInfo.date);
        const pickupTime = order.pickupInfo.time;
        
        // 시간 정보가 있으면 시간을 설정, 없으면 09:00으로 기본 설정
        const [hours, minutes] = pickupTime ? pickupTime.split(':').map(Number) : [9, 0];
        pickupDate.setHours(hours, minutes, 0, 0);
        
        pickupDeliveryEvents.push({
          id: `pickup_${order.id}`,
          type: 'delivery',
          title: `[픽업] ${order.orderer.name}`,
          description: `상품: ${order.items?.map(item => item.name).join(', ')}`,
          startDate: pickupDate,
          branchName: order.branchName,
          status: (order.status as string) === 'completed' ? 'completed' : 'pending',
          relatedId: order.id,
          color: (order.status as string) === 'completed' ? 'bg-gray-400' : 'bg-blue-500',
          isAllDay: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        });
      }
      
             // 배송 예약 처리 (즉시픽업 제외, 처리 중이거나 완료된 주문)
       if (order.deliveryInfo && order.receiptType === 'delivery_reservation' && (order.status === 'processing' || order.status === 'completed')) {
        const deliveryDate = parseISO(order.deliveryInfo.date);
        const deliveryTime = order.deliveryInfo.time;
        
        // 시간 정보가 있으면 시간을 설정, 없으면 14:00으로 기본 설정
        const [hours, minutes] = deliveryTime ? deliveryTime.split(':').map(Number) : [14, 0];
        deliveryDate.setHours(hours, minutes, 0, 0);
        
        pickupDeliveryEvents.push({
          id: `delivery_${order.id}`,
          type: 'delivery',
          title: `[배송] ${order.deliveryInfo.recipientName}`,
          description: `주소: ${order.deliveryInfo.address}`,
          startDate: deliveryDate,
          branchName: order.branchName,
          status: (order.status as string) === 'completed' ? 'completed' : 'pending',
          relatedId: order.id,
          color: (order.status as string) === 'completed' ? 'bg-gray-400' : 'bg-green-500',
          isAllDay: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        });
      }
    });
    
    return pickupDeliveryEvents;
  }, [orders, isAdmin, userBranch]);

  // 고객의 월결제일 데이터를 캘린더 이벤트로 변환
  const convertCustomersToEvents = useMemo(() => {
    const paymentEvents: CalendarEvent[] = [];

    customers.forEach(customer => {
      // 관리자가 아닌 경우 해당 지점의 고객만 처리
      if (!isAdmin && customer.branch !== userBranch) {
        return;
      }
      
      // 기업고객이고 월결제일이 설정된 경우에만 처리
      if (customer.type === 'company' && customer.monthlyPaymentDay && customer.monthlyPaymentDay.trim()) {
        const paymentDay = parseInt(customer.monthlyPaymentDay);
        
        // 현재 월의 결제일 계산
        const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), paymentDay);
        
        // 다음 월의 결제일도 계산 (월말에 가까운 날짜의 경우)
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, paymentDay);
        
        // 이전 월의 결제일도 계산 (월초에 가까운 날짜의 경우)
        const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, paymentDay);
        
        // 3개월치 결제일을 모두 추가
        [prevMonth, currentMonth, nextMonth].forEach(date => {
          // 유효한 날짜인지 확인 (예: 31일이 없는 월의 경우)
          if (date.getDate() === paymentDay) {
                         paymentEvents.push({
               id: `payment_${customer.id}_${date.getTime()}`,
               type: 'payment',
               title: `${customer.companyName || customer.name} 월결제일`,
               description: `담당자: ${customer.name} (${customer.contact})`,
               startDate: date,
               branchName: customer.branch,
               status: 'pending',
               relatedId: customer.id,
               color: 'bg-purple-500',
               isAllDay: true,
               createdAt: new Date(),
               updatedAt: new Date(),
               createdBy: 'system'
             });
          }
        });
      }
    });

    return paymentEvents;
  }, [customers, currentDate, isAdmin, userBranch]);

  // 필터링된 이벤트 (수동 추가 이벤트 + 픽업/배송 예약 이벤트)
  const filteredEvents = useMemo(() => {
    const allEvents = [...events, ...convertOrdersToEvents, ...convertCustomersToEvents];
    
    return allEvents.filter(event => {
      // 공지/알림 필터링 로직
      if (event.type === 'notice') {
        // 본사 공지/알림은 모든 지점에서 볼 수 있음
        if (event.branchName === '본사') {
          if (selectedEventType !== '전체' && event.type !== selectedEventType) {
            return false;
          }
          return true;
        }
        // 지점별 공지/알림은 해당 지점에서만 볼 수 있음
        else {
          // 관리자가 아닌 경우 해당 지점의 공지만 표시
          if (!isAdmin && event.branchName !== userBranch) {
            return false;
          }
          // 지점 필터링
          if (selectedBranch !== '전체' && event.branchName !== selectedBranch) {
            return false;
          }
          // 이벤트 타입 필터링
          if (selectedEventType !== '전체' && event.type !== selectedEventType) {
            return false;
          }
          return true;
        }
      }
      
      // 일반 이벤트 필터링
      // 지점 필터링
      if (selectedBranch !== '전체' && event.branchName !== selectedBranch) {
        return false;
      }
      
      // 관리자가 아닌 경우 해당 지점의 데이터만 표시
      if (!isAdmin && event.branchName !== userBranch) {
        return false;
      }
      
      // 이벤트 타입 필터링
      if (selectedEventType !== '전체' && event.type !== selectedEventType) {
        return false;
      }
      
      return true;
    });
  }, [events, convertOrdersToEvents, convertCustomersToEvents, selectedBranch, selectedEventType, isAdmin, userBranch]);

  // 특정 날짜의 이벤트들
  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
      const startDate = new Date(event.startDate);
      const endDate = event.endDate ? new Date(event.endDate) : startDate;
      
      // 시작날짜와 종료날짜 사이의 모든 날짜에 이벤트 표시
      return date >= startDate && date <= endDate;
    });
  };



  // 새 일정 추가
  const handleAddEvent = () => {
    setSelectedEvent(null);
    setIsEventDialogOpen(true);
  };

  // 일정 클릭
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  // 날짜 클릭
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsDayEventsDialogOpen(true);
  };

  // 일정 저장
  const handleSaveEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    if (selectedEvent) {
      // 자동 생성된 이벤트는 수정할 수 없음
      if (selectedEvent.relatedId) {
        console.warn('자동 생성된 이벤트는 수정할 수 없습니다:', selectedEvent.id);
        return;
      }
      // 기존 일정 수정
      updateEvent(selectedEvent.id, eventData);
    } else {
      // 새 일정 추가
      createEvent(eventData);
    }
  };

  // 일정 삭제
  const handleDeleteEvent = async (id: string) => {
    try {
      // 자동 생성된 이벤트는 삭제할 수 없음
      const eventToDelete = events.find(e => e.id === id);
      if (eventToDelete?.relatedId) {
        console.warn('자동 생성된 이벤트는 삭제할 수 없습니다:', id);
        return;
      }
      
      await deleteEvent(id);
      // 삭제 후 다이얼로그 닫기 및 선택된 이벤트 초기화
      setIsEventDialogOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('일정 삭제 중 오류 발생:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="일정관리"
          description="모든 일정을 한 곳에서 관리하세요."
        />
        <div className="grid gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 일정 다이얼로그 */}
        <EventDialog
          isOpen={isEventDialogOpen}
          onOpenChange={setIsEventDialogOpen}
          event={selectedEvent}
          branches={availableBranches}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="일정관리"
        description="모든 일정을 한 곳에서 관리하세요."
      >
        <Button onClick={handleAddEvent}>
          <Plus className="mr-2 h-4 w-4" />
          새 일정
        </Button>
      </PageHeader>

      {/* 필터 패널 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">필터:</span>
            </div>
            
            {/* 지점 선택 */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">지점:</label>
              <Select 
                value={selectedBranch} 
                onValueChange={setSelectedBranch}
                disabled={!isAdmin} // 관리자가 아닌 경우 비활성화
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isAdmin && <SelectItem value="전체">전체</SelectItem>}
                  {availableBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.name}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isAdmin && (
                <span className="text-xs text-gray-500">
                  ({userBranch} 지점만 표시)
                </span>
              )}
            </div>

            {/* 이벤트 타입 선택 (버튼으로 변경) */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">유형:</label>
              <div className="flex flex-wrap gap-1">
                {eventTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={selectedEventType === type.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedEventType(type.value)}
                    className={`text-xs px-2 py-1 h-auto ${
                      selectedEventType === type.value 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${type.color} mr-1`}></div>
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 캘린더 네비게이션 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={goToPreviousMonth}>
                &lt;
              </Button>
              <h2 className="text-xl font-semibold">
                {format(currentDate, 'yyyy년 M월', { locale: ko })}
              </h2>
              <Button variant="outline" onClick={goToNextMonth}>
                &gt;
              </Button>
            </div>
            <Button variant="outline" onClick={goToToday}>
              오늘
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* 캘린더 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);

              return (
                                 <div
                   key={index}
                   className={`min-h-[120px] p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                     isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                   } ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}`}
                   onClick={() => handleDateClick(day)}
                 >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isCurrentDay ? 'text-blue-600' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  
                  {/* 이벤트 목록 */}
                  <div className="space-y-1">
                                         {dayEvents.slice(0, 3).map((event) => (
                       <div
                         key={event.id}
                         className={`text-xs p-1 rounded cursor-pointer text-white ${event.color} ${
                           event.type === 'notice' && event.branchName === '본사' 
                             ? 'ring-2 ring-yellow-300 font-bold' 
                             : event.type === 'notice' 
                             ? 'ring-1 ring-gray-300' 
                             : ''
                         }`}
                         onClick={(e) => {
                           e.stopPropagation(); // 날짜 클릭 이벤트 전파 방지
                           handleEventClick(event);
                         }}
                         title={`${event.title}${event.type === 'notice' ? ` (${event.branchName})` : ''}`}
                       >
                        <div className="truncate">
                          {event.type === 'notice' && event.branchName === '본사' && '📢 '}
                          {event.type === 'notice' && event.branchName !== '본사' && '📌 '}
                          {event.title}
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayEvents.length - 3}개 더
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 이벤트 타입별 통계 */}
      <div className="grid gap-4 md:grid-cols-4">
        {eventTypes.slice(1).map((type) => {
          const typeEvents = filteredEvents.filter(event => event.type === type.value);
          const pendingEvents = typeEvents.filter(event => event.status === 'pending');
          
          return (
            <Card key={type.value}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${type.color}`}></div>
                  {type.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{typeEvents.length}</div>
                <p className="text-xs text-gray-500">
                  대기: {pendingEvents.length}건
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

             {/* 일정 다이얼로그 */}
       <EventDialog
         isOpen={isEventDialogOpen}
         onOpenChange={setIsEventDialogOpen}
         event={selectedEvent}
         branches={availableBranches}
         onSave={handleSaveEvent}
         onDelete={handleDeleteEvent}
         currentUser={user}
       />

       {/* 날짜별 일정 다이얼로그 */}
       <DayEventsDialog
         isOpen={isDayEventsDialogOpen}
         onOpenChange={setIsDayEventsDialogOpen}
         date={selectedDate}
         events={selectedDate ? getEventsForDate(selectedDate) : []}
         onEventClick={handleEventClick}
       />
    </div>
  );
}
