"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarEvent } from '@/hooks/use-calendar';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Bell, Clock, MapPin, X } from 'lucide-react';

interface NoticeViewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onEdit?: () => void;
}

export function NoticeViewDialog({
  isOpen,
  onOpenChange,
  event,
  onEdit
}: NoticeViewDialogProps) {
  if (!event || event.type !== 'notice') return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" />
            공지사항
            <Badge variant="outline" className="ml-2">
              {event.branchName === '본사' ? '📢 전체공지' : `📌 ${event.branchName}`}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            공지사항의 상세 내용을 확인하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 제목 */}
          <div className="border-b pb-3">
            <h2 className="text-xl font-semibold text-gray-900">{event.title}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {format(new Date(event.startDate), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.branchName}
              </div>
            </div>
          </div>

                     {/* 내용 */}
           {event.description && (
             <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
               <div 
                 className="text-gray-800 leading-relaxed prose prose-sm max-w-none whitespace-pre-wrap"
                 style={{
                   whiteSpace: 'pre-wrap',
                   wordBreak: 'break-word',
                   lineHeight: '1.6'
                 }}
                 dangerouslySetInnerHTML={{ 
                   __html: event.description
                     .replace(/\n/g, '<br>')
                     .replace(/<p>/g, '<p style="margin: 0.5em 0;">')
                     .replace(/<ul>/g, '<ul style="margin: 0.5em 0; padding-left: 1.5em;">')
                     .replace(/<ol>/g, '<ol style="margin: 0.5em 0; padding-left: 1.5em;">')
                     .replace(/<li>/g, '<li style="margin: 0.25em 0;">')
                 }}
               />
             </div>
           )}

          {/* 상태 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">상태:</span>
              <Badge 
                variant={event.status === 'completed' ? 'default' : 'secondary'}
                className={event.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
              >
                {event.status === 'completed' ? '완료' : '대기'}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              {onEdit && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onEdit}
                >
                  수정
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
