"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

interface EventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  branches: Array<{ id: string; name: string; type: string }>;
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
  onDelete?: (id: string) => void;
}

export function EventDialog({
  isOpen,
  onOpenChange,
  event,
  branches,
  onSave,
  onDelete
}: EventDialogProps) {
  const isEditing = !!event;
  
  // 폼 상태
  const [formData, setFormData] = useState({
    type: 'delivery' as CalendarEvent['type'],
    title: '',
    description: '',
    startDate: new Date(),
    endDate: undefined as Date | undefined,
    branchName: '',
    status: 'pending' as CalendarEvent['status'],
    isAllDay: false
  });

  // 이벤트 타입별 설정
  const eventTypes = [
    { value: 'delivery', label: '배송/픽업', color: 'bg-blue-500' },
    { value: 'material', label: '자재요청', color: 'bg-orange-500' },
    { value: 'employee', label: '직원스케줄', color: 'bg-green-500' },
    { value: 'notice', label: '공지/알림', color: 'bg-red-500' }
  ];

  // 이벤트 타입 변경 시 지점 자동 설정
  const handleEventTypeChange = (value: string) => {
    const newType = value as CalendarEvent['type'];
    setFormData(prev => ({
      ...prev,
      type: newType,
      branchName: newType === 'notice' ? '본사' : (branches[0]?.name || '')
    }));
  };

  // 이벤트 편집 시 폼 데이터 초기화
  useEffect(() => {
    if (event) {
      setFormData({
        type: event.type,
        title: event.title,
        description: event.description || '',
        startDate: new Date(event.startDate),
        endDate: event.endDate ? new Date(event.endDate) : undefined,
        branchName: event.branchName,
        status: event.status,
        isAllDay: event.isAllDay || false
      });
    } else {
      // 새 이벤트 생성 시 기본값 설정
      setFormData({
        type: 'delivery',
        title: '',
        description: '',
        startDate: new Date(),
        endDate: undefined,
        branchName: branches[0]?.name || '',
        status: 'pending',
        isAllDay: false
      });
    }
  }, [event, branches]);

  // 폼 제출 처리
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventData: Omit<CalendarEvent, 'id'> = {
      type: formData.type,
      title: formData.title,
      description: formData.description,
      startDate: formData.startDate,
      endDate: formData.endDate,
      branchName: formData.branchName,
      status: formData.status,
      color: eventTypes.find(t => t.value === formData.type)?.color || 'bg-gray-500',
      isAllDay: formData.isAllDay
    };

    onSave(eventData);
    onOpenChange(false);
  };

  // 삭제 처리
  const handleDelete = () => {
    if (event && onDelete) {
      onDelete(event.id);
      onOpenChange(false);
    }
  };

  // 픽업/배송관리 페이지로 이동
  const handleGoToPickupDelivery = () => {
    if (event?.relatedId) {
      window.location.href = '/dashboard/pickup-delivery';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? '일정 수정' : '새 일정 추가'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? '일정 정보를 수정하세요.' : '새로운 일정을 추가하세요.'}
          </DialogDescription>
        </DialogHeader>

        {/* 픽업/배송 예약 이벤트인 경우 이동 버튼 표시 */}
        {event?.relatedId && event.type === 'delivery' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">픽업/배송 예약</p>
                <p className="text-xs text-blue-600">이 일정은 주문 시스템에서 자동 생성되었습니다.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoToPickupDelivery}
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                픽업/배송관리로 이동
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이벤트 타입 */}
          <div className="space-y-2">
            <Label htmlFor="type">이벤트 유형</Label>
            <Select
              value={formData.type}
              onValueChange={handleEventTypeChange}
            >
              <SelectTrigger>
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

          {/* 제목 */}
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="일정 제목을 입력하세요"
              required
            />
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="일정에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>

          {/* 시작 날짜 */}
          <div className="space-y-2">
            <Label>시작 날짜</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.startDate ? format(formData.startDate, "PPP", { locale: ko }) : "날짜를 선택하세요"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.startDate}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, startDate: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 종료 날짜 (선택사항) */}
          <div className="space-y-2">
            <Label>종료 날짜 (선택사항)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.endDate ? format(formData.endDate, "PPP", { locale: ko }) : "날짜를 선택하세요"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.endDate}
                  onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 지점 */}
          <div className="space-y-2">
            <Label htmlFor="branch">지점</Label>
            <Select
              value={formData.branchName}
              onValueChange={(value) => setFormData(prev => ({ ...prev, branchName: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.type === 'notice' ? "본사 (전체 공지)" : "지점을 선택하세요"} />
              </SelectTrigger>
              <SelectContent>
                {formData.type === 'notice' && (
                  <SelectItem value="본사">본사 (전체 공지)</SelectItem>
                )}
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.name}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.type === 'notice' && (
              <p className="text-xs text-gray-500">공지/알림은 모든 지점에서 확인할 수 있습니다.</p>
            )}
          </div>

          {/* 상태 */}
          <div className="space-y-2">
            <Label htmlFor="status">상태</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as CalendarEvent['status'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">대기</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">완료</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="cancelled">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">취소</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                삭제
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit">
              {isEditing ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
