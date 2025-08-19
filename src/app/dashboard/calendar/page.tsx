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
import { Calendar, CalendarDays, Truck, Package, Users, Bell, Plus, Filter } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { EventDialog } from "./components/event-dialog";

interface CalendarEvent {
  id: string;
  type: 'delivery' | 'material' | 'employee' | 'notice';
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  branchName: string;
  status: 'pending' | 'completed' | 'cancelled';
  relatedId?: string;
  color: string;
  isAllDay?: boolean;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { branches } = useBranches();
  const { orders } = useOrders();
  
  // 사용자 권한에 따른 지점 필터링
  const isAdmin = user?.role === '본사 관리자';
  const userBranch = user?.franchise;
  
  // 상태 관리
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBranch, setSelectedBranch] = useState<string>('전체');
  const [selectedEventType, setSelectedEventType] = useState<string>('전체');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // 사용자가 볼 수 있는 지점 목록
  const availableBranches = useMemo(() => {
    if (isAdmin) {
      return [
        { id: '본사', name: '본사', type: '본사' },
        ...branches.filter(b => b.type !== '본사' && b.name).map(b => ({
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

  // 이벤트 타입별 설정
  const eventTypes = [
    { value: '전체', label: '전체', icon: CalendarDays, color: 'bg-gray-500' },
    { value: 'delivery', label: '배송/픽업', icon: Truck, color: 'bg-blue-500' },
    { value: 'material', label: '자재요청', icon: Package, color: 'bg-orange-500' },
    { value: 'employee', label: '직원스케줄', icon: Users, color: 'bg-green-500' },
    { value: 'notice', label: '공지/알림', icon: Bell, color: 'bg-red-500' }
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
      // 픽업 예약 처리
      if (order.pickupInfo && order.status === 'processing') {
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
          status: order.status === 'completed' ? 'completed' : 'pending',
          relatedId: order.id,
          color: 'bg-blue-500',
          isAllDay: false
        });
      }
      
      // 배송 예약 처리
      if (order.deliveryInfo && order.status === 'processing') {
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
          status: order.status === 'completed' ? 'completed' : 'pending',
          relatedId: order.id,
          color: 'bg-green-500',
          isAllDay: false
        });
      }
    });
    
    return pickupDeliveryEvents;
  }, [orders]);

  // 필터링된 이벤트 (수동 추가 이벤트 + 픽업/배송 예약 이벤트)
  const filteredEvents = useMemo(() => {
    const allEvents = [...events, ...convertOrdersToEvents];
    
    return allEvents.filter(event => {
      // 공지/알림은 모든 지점에서 볼 수 있음
      if (event.type === 'notice') {
        // 이벤트 타입 필터링만 적용
        if (selectedEventType !== '전체' && event.type !== selectedEventType) {
          return false;
        }
        return true;
      }
      
      // 지점 필터링 (공지/알림 제외)
      if (selectedBranch !== '전체' && event.branchName !== selectedBranch) {
        return false;
      }
      
      // 이벤트 타입 필터링
      if (selectedEventType !== '전체' && event.type !== selectedEventType) {
        return false;
      }
      
      return true;
    });
  }, [events, convertOrdersToEvents, selectedBranch, selectedEventType]);

  // 특정 날짜의 이벤트들
  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => 
      isSameDay(new Date(event.startDate), date)
    );
  };

  // 샘플 데이터 로드 (실제로는 Firebase에서 가져올 예정)
  useEffect(() => {
    const loadSampleEvents = () => {
      const sampleEvents: CalendarEvent[] = [
        {
          id: '1',
          type: 'material',
          title: '자재요청',
          description: '화분 20개 요청',
          startDate: new Date(2024, 0, 16, 10, 0),
          branchName: '서초점',
          status: 'pending',
          color: 'bg-orange-500'
        },
        {
          id: '2',
          type: 'employee',
          title: '김철수 근무',
          description: '오전 9시 - 오후 6시',
          startDate: new Date(2024, 0, 17, 9, 0),
          endDate: new Date(2024, 0, 17, 18, 0),
          branchName: '강남점',
          status: 'pending',
          color: 'bg-green-500'
        },
        {
          id: '3',
          type: 'notice',
          title: '월간 회의',
          description: '본사 회의실',
          startDate: new Date(2024, 0, 20, 14, 0),
          branchName: '본사',
          status: 'pending',
          color: 'bg-red-500'
        }
      ];
      
      setEvents(sampleEvents);
      setLoading(false);
    };

    // 1초 후 샘플 데이터 로드 (실제로는 Firebase 쿼리)
    setTimeout(loadSampleEvents, 1000);
  }, []);

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

  // 일정 저장
  const handleSaveEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    if (selectedEvent) {
      // 기존 일정 수정
      setEvents(prev => prev.map(event => 
        event.id === selectedEvent.id 
          ? { ...eventData, id: event.id }
          : event
      ));
    } else {
      // 새 일정 추가
      const newEvent: CalendarEvent = {
        ...eventData,
        id: Date.now().toString()
      };
      setEvents(prev => [...prev, newEvent]);
    }
  };

  // 일정 삭제
  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
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
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  {availableBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.name}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 이벤트 타입 선택 */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">유형:</label>
              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${type.color}`}></div>
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  className={`min-h-[120px] p-2 border rounded-lg ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}`}
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
                        className={`text-xs p-1 rounded cursor-pointer text-white ${event.color}`}
                        onClick={() => handleEventClick(event)}
                        title={event.title}
                      >
                        <div className="truncate">{event.title}</div>
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
      />
    </div>
  );
}
