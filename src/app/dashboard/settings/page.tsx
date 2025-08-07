"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-user-role";
import { 
  Settings, 
  Building, 
  Truck, 
  Globe, 
  Database, 
  Bell,
  Save,
  RefreshCw,
  MessageSquare,
  Mail,
  Type,
  Percent
} from "lucide-react";
import { useSettings, defaultSettings } from "@/hooks/use-settings";

export default function SettingsPage() {
  const { settings, loading, error, saveSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [newFont, setNewFont] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const { isHQManager } = useUserRole();

  // settings가 로드되었을 때만 localSettings 업데이트
  useEffect(() => {
    if (!loading && settings !== defaultSettings) {
      setLocalSettings(settings);
    }
  }, [settings, loading]);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const success = await saveSettings(localSettings);
      
      if (success) {
        toast({
          title: '성공',
          description: '설정이 저장되었습니다.'
        });
      } else {
        toast({
          variant: 'destructive',
          title: '오류',
          description: '설정 저장 중 오류가 발생했습니다.'
        });
      }
    } catch (error) {
      console.error('설정 저장 중 오류:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '설정 저장 중 오류가 발생했습니다.'
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setLocalSettings(settings);
    toast({
      title: '초기화 완료',
      description: '설정이 기본값으로 초기화되었습니다.'
    });
  };

  const addNewFont = () => {
    if (!newFont.trim()) return;
    
    const fontName = newFont.trim();
    const currentFonts = localSettings.availableFonts || [];
    
    if (currentFonts.includes(fontName)) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '이미 존재하는 폰트입니다.'
      });
      return;
    }
    
    setLocalSettings(prev => ({
      ...prev,
      availableFonts: [...currentFonts, fontName]
    }));
    
    setNewFont('');
    toast({
      title: '성공',
      description: `폰트 "${fontName}"가 추가되었습니다.`
    });
  };

  // 본사 관리자가 아니면 접근 제한
  if (!isHQManager()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-500">시스템 설정은 본사 관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>설정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="시스템 설정"
        description="시스템의 기본 설정을 관리합니다."
      />

             <Tabs defaultValue="general" className="space-y-4">
         <TabsList className="grid w-full grid-cols-6">
           <TabsTrigger value="general">일반 설정</TabsTrigger>
           <TabsTrigger value="delivery">배송 설정</TabsTrigger>
           <TabsTrigger value="notifications">알림 설정</TabsTrigger>
           <TabsTrigger value="messages">메시지 설정</TabsTrigger>
           <TabsTrigger value="auto-email">자동 이메일</TabsTrigger>
           <TabsTrigger value="security">보안 설정</TabsTrigger>
           <TabsTrigger value="discount">할인 설정</TabsTrigger>
         </TabsList>

        {/* 일반 설정 */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                사이트 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">사이트명</Label>
                  <Input
                    id="siteName"
                    value={localSettings.siteName}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, siteName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">사이트 설명</Label>
                  <Input
                    id="siteDescription"
                    value={localSettings.siteDescription}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">연락처 이메일</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={localSettings.contactEmail}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">연락처 전화번호</Label>
                  <Input
                    id="contactPhone"
                    value={localSettings.contactPhone}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                시스템 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderNumberPrefix">주문번호 접두사</Label>
                  <Input
                    id="orderNumberPrefix"
                    value={localSettings.orderNumberPrefix}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, orderNumberPrefix: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointEarnRate">포인트 적립률 (%)</Label>
                  <Input
                    id="pointEarnRate"
                    type="number"
                    min="0"
                    max="10"
                    value={localSettings.pointEarnRate}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, pointEarnRate: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataRetentionDays">데이터 보관 기간 (일)</Label>
                  <Input
                    id="dataRetentionDays"
                    type="number"
                    min="30"
                    max="1095"
                    value={localSettings.dataRetentionDays}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, dataRetentionDays: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 배송 설정 */}
        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                배송비 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultDeliveryFee">기본 배송비 (원)</Label>
                  <Input
                    id="defaultDeliveryFee"
                    type="number"
                    min="0"
                    value={localSettings.defaultDeliveryFee}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, defaultDeliveryFee: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="freeDeliveryThreshold">무료 배송 기준 (원)</Label>
                  <Input
                    id="freeDeliveryThreshold"
                    type="number"
                    min="0"
                    value={localSettings.freeDeliveryThreshold}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, freeDeliveryThreshold: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 알림 설정 */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                알림 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>이메일 알림</Label>
                    <p className="text-sm text-gray-500">주문 및 시스템 알림을 이메일로 받습니다</p>
                  </div>
                                     <input
                     type="checkbox"
                     checked={localSettings.emailNotifications}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                     className="h-4 w-4"
                   />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS 알림</Label>
                    <p className="text-sm text-gray-500">중요한 알림을 SMS로 받습니다</p>
                  </div>
                                     <input
                     type="checkbox"
                     checked={localSettings.smsNotifications}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                     className="h-4 w-4"
                   />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>자동 백업</Label>
                    <p className="text-sm text-gray-500">정기적으로 데이터를 자동 백업합니다</p>
                  </div>
                                     <input
                     type="checkbox"
                     checked={localSettings.autoBackup}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, autoBackup: e.target.checked }))}
                     className="h-4 w-4"
                   />
                </div>
              </div>
            </CardContent>
          </Card>
                 </TabsContent>

         {/* 메시지 설정 */}
         <TabsContent value="messages" className="space-y-4">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <MessageSquare className="h-5 w-5" />
                 메시지 출력 설정
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div className="space-y-2">
                    <Label htmlFor="messageFont">메시지 폰트</Label>
                    <select
                      id="messageFont"
                      value={localSettings.messageFont}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, messageFont: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    >
                      {localSettings.availableFonts?.map((font) => (
                        <option key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>
                 <div className="space-y-2">
                   <Label htmlFor="messageFontSize">폰트 크기 (px)</Label>
                   <Input
                     id="messageFontSize"
                     type="number"
                     min="10"
                     max="24"
                     value={localSettings.messageFontSize}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, messageFontSize: Number(e.target.value) }))}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="messageColor">메시지 색상</Label>
                   <Input
                     id="messageColor"
                     type="color"
                     value={localSettings.messageColor}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, messageColor: e.target.value }))}
                     className="w-full h-10"
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="messageTemplate">기본 메시지 템플릿</Label>
                 <textarea
                   id="messageTemplate"
                   value={localSettings.messageTemplate}
                   onChange={(e) => setLocalSettings(prev => ({ ...prev, messageTemplate: e.target.value }))}
                   className="w-full p-2 border rounded-md h-24"
                   placeholder="메시지 템플릿을 입력하세요. {고객명}, {상태} 등의 변수를 사용할 수 있습니다."
                 />
                                   <p className="text-xs text-gray-500">
                    사용 가능한 변수: {'{고객명}'}, {'{상태}'}, {'{주문번호}'}, {'{총금액}'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 폰트 관리 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  폰트 관리
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>사용 가능한 폰트 목록</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {localSettings.availableFonts?.map((font, index) => (
                      <div key={font} className="flex items-center justify-between p-2 border rounded">
                        <span style={{ fontFamily: font }} className="text-sm">
                          {font}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newFonts = localSettings.availableFonts?.filter((_, i) => i !== index) || [];
                            setLocalSettings(prev => ({ ...prev, availableFonts: newFonts }));
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          삭제
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newFont">새 폰트 추가</Label>
                  <div className="flex gap-2">
                    <Input
                      id="newFont"
                      placeholder="폰트 이름을 입력하세요 (예: Roboto)"
                      value={newFont}
                      onChange={(e) => setNewFont(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={addNewFont}
                      disabled={!newFont.trim()}
                      size="sm"
                    >
                      추가
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    • 폰트 이름은 정확히 입력해야 합니다 (예: "Roboto", "Open Sans")
                    • 시스템에 설치된 폰트만 사용 가능합니다
                    • 웹 폰트를 사용하려면 CSS에서 @import 또는 @font-face를 추가해야 합니다
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

         {/* 자동 이메일 설정 */}
         <TabsContent value="auto-email" className="space-y-4">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Mail className="h-5 w-5" />
                 자동 이메일 설정
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <div>
                     <Label>배송완료 자동 이메일</Label>
                     <p className="text-sm text-gray-500">배송 완료 시 고객에게 자동으로 이메일을 발송합니다</p>
                   </div>
                   <input
                     type="checkbox"
                     checked={localSettings.autoEmailDeliveryComplete}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, autoEmailDeliveryComplete: e.target.checked }))}
                     className="h-4 w-4"
                   />
                 </div>
                 <div className="flex items-center justify-between">
                   <div>
                     <Label>주문확인 자동 이메일</Label>
                     <p className="text-sm text-gray-500">주문 접수 시 고객에게 확인 이메일을 발송합니다</p>
                   </div>
                   <input
                     type="checkbox"
                     checked={localSettings.autoEmailOrderConfirm}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, autoEmailOrderConfirm: e.target.checked }))}
                     className="h-4 w-4"
                   />
                 </div>
                 <div className="flex items-center justify-between">
                   <div>
                     <Label>상태변경 자동 이메일</Label>
                     <p className="text-sm text-gray-500">주문 상태 변경 시 고객에게 알림 이메일을 발송합니다</p>
                   </div>
                   <input
                     type="checkbox"
                     checked={localSettings.autoEmailStatusChange}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, autoEmailStatusChange: e.target.checked }))}
                     className="h-4 w-4"
                   />
                 </div>
                 <div className="flex items-center justify-between">
                   <div>
                     <Label>생일 축하 자동 이메일</Label>
                     <p className="text-sm text-gray-500">고객 생일 시 축하 이메일을 자동으로 발송합니다</p>
                   </div>
                   <input
                     type="checkbox"
                     checked={localSettings.autoEmailBirthday}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, autoEmailBirthday: e.target.checked }))}
                     className="h-4 w-4"
                   />
                 </div>
               </div>
               
               <div className="space-y-4 mt-6">
                 <h4 className="font-medium">이메일 템플릿</h4>
                 
                 <div className="space-y-2">
                   <Label htmlFor="emailTemplateDeliveryComplete">배송완료 이메일 템플릿</Label>
                   <textarea
                     id="emailTemplateDeliveryComplete"
                     value={localSettings.emailTemplateDeliveryComplete}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, emailTemplateDeliveryComplete: e.target.value }))}
                     className="w-full p-2 border rounded-md h-24"
                     placeholder="배송완료 이메일 템플릿을 입력하세요"
                   />
                 </div>
                 
                 <div className="space-y-2">
                   <Label htmlFor="emailTemplateOrderConfirm">주문확인 이메일 템플릿</Label>
                   <textarea
                     id="emailTemplateOrderConfirm"
                     value={localSettings.emailTemplateOrderConfirm}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, emailTemplateOrderConfirm: e.target.value }))}
                     className="w-full p-2 border rounded-md h-24"
                     placeholder="주문확인 이메일 템플릿을 입력하세요"
                   />
                 </div>
                 
                 <div className="space-y-2">
                   <Label htmlFor="emailTemplateStatusChange">상태변경 이메일 템플릿</Label>
                   <textarea
                     id="emailTemplateStatusChange"
                     value={localSettings.emailTemplateStatusChange}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, emailTemplateStatusChange: e.target.value }))}
                     className="w-full p-2 border rounded-md h-24"
                     placeholder="상태변경 이메일 템플릿을 입력하세요"
                   />
                 </div>
                 
                 <div className="space-y-2">
                   <Label htmlFor="emailTemplateBirthday">생일축하 이메일 템플릿</Label>
                   <textarea
                     id="emailTemplateBirthday"
                     value={localSettings.emailTemplateBirthday}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, emailTemplateBirthday: e.target.value }))}
                     className="w-full p-2 border rounded-md h-24"
                     placeholder="생일축하 이메일 템플릿을 입력하세요"
                   />
                 </div>
                 
                 <p className="text-xs text-gray-500">
                   사용 가능한 변수: {'{고객명}'}, {'{주문번호}'}, {'{주문일}'}, {'{배송일}'}, {'{총금액}'}, {'{이전상태}'}, {'{현재상태}'}, {'{회사명}'}
                 </p>
               </div>
             </CardContent>
           </Card>
         </TabsContent>

         {/* 보안 설정 */}
         <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                보안 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">세션 타임아웃 (분)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="480"
                    value={localSettings.sessionTimeout}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">최소 비밀번호 길이</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    max="20"
                    value={localSettings.passwordMinLength}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, passwordMinLength: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>비밀번호 변경 요구</Label>
                  <p className="text-sm text-gray-500">정기적으로 비밀번호 변경을 요구합니다</p>
                </div>
                                 <input
                   type="checkbox"
                   checked={localSettings.requirePasswordChange}
                   onChange={(e) => setLocalSettings(prev => ({ ...prev, requirePasswordChange: e.target.checked }))}
                   className="h-4 w-4"
                 />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

         {/* 할인 설정 */}
         <TabsContent value="discount" className="space-y-4">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Percent className="h-5 w-5" />
                 할인 설정
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="text-center py-8">
                 <Percent className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                 <h3 className="text-lg font-semibold mb-2">할인 설정 관리</h3>
                 <p className="text-gray-500 mb-6">
                   지점별 할인율, 할인 기간, 할인 조건 등을 관리할 수 있습니다.
                 </p>
                 <Button 
                   onClick={() => window.location.href = '/dashboard/settings/discount'}
                   className="bg-blue-600 hover:bg-blue-700"
                 >
                   <Percent className="h-4 w-4 mr-2" />
                   할인 설정 관리
                 </Button>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
      </Tabs>

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={resetToDefaults}>
          <RefreshCw className="h-4 w-4 mr-2" />
          기본값으로 초기화
        </Button>
        <Button onClick={handleSaveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? '저장 중...' : '설정 저장'}
        </Button>
      </div>
    </div>
  );
} 