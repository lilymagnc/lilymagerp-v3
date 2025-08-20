"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckSquare, 
  Calendar, 
  CalendarDays, 
  Building, 
  Plus, 
  Trash2,
  Save,
  ArrowLeft,
  GripVertical
} from "lucide-react";
import { useChecklist } from "@/hooks/use-checklist";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-user-role";
import { ChecklistTemplate, ChecklistItem } from "@/types/checklist";
import { useToast } from "@/hooks/use-toast";

export default function ChecklistTemplatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const { getTemplate, updateTemplate } = useChecklist();
  const { toast } = useToast();
  
  const [template, setTemplate] = useState<ChecklistTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true);
        const branchId = userRole?.branchId || user?.franchise || '';
        if (!branchId) {
          toast({
            title: "오류",
            description: "지점 정보를 찾을 수 없습니다.",
            variant: "destructive",
          });
          router.push('/dashboard/checklist');
          return;
        }
        
        const templateData = await getTemplate(branchId);
        if (templateData) {
          setTemplate(templateData);
        }
      } catch (error) {
        console.error('Error loading template:', error);
        toast({
          title: "오류",
          description: "템플릿을 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && userRole) {
      loadTemplate();
    }
  }, [user, userRole, getTemplate, toast, router]);

  const handleAddItem = useCallback((category: 'daily' | 'weekly' | 'monthly') => {
    if (!template) return;

    const newItem: ChecklistItem = {
      id: `item_${Date.now()}`,
      order: template.items.filter(item => item.category === category).length + 1,
      title: '',
      description: '',
      category,
      required: false,
    };

    setTemplate(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: [...prev.items, newItem]
      };
    });
  }, [template]);

  const handleUpdateItem = useCallback((itemId: string, field: keyof ChecklistItem, value: any) => {
    if (!template) return;

    setTemplate(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId ? { ...item, [field]: value } : item
        )
      };
    });
  }, [template]);

  const handleDeleteItem = useCallback((itemId: string) => {
    if (!template) return;

    setTemplate(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      };
    });
  }, [template]);

  const handleSaveTemplate = useCallback(async () => {
    if (!template) return;

    try {
      setSaving(true);
      await updateTemplate(template.id, template);
      
      toast({
        title: "성공",
        description: "템플릿이 저장되었습니다.",
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "오류",
        description: "템플릿 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [template, updateTemplate, toast]);

  const getCategoryItems = useCallback((category: 'daily' | 'weekly' | 'monthly') => {
    if (!template) return [];
    return template.items
      .filter(item => item.category === category)
      .sort((a, b) => a.order - b.order);
  }, [template]);

  const getCategoryIcon = useCallback((category: string) => {
    switch (category) {
      case 'daily':
        return <Calendar className="h-4 w-4" />;
      case 'weekly':
        return <CalendarDays className="h-4 w-4" />;
      case 'monthly':
        return <Building className="h-4 w-4" />;
      default:
        return <CheckSquare className="h-4 w-4" />;
    }
  }, []);

  const getCategoryTitle = useCallback((category: string) => {
    switch (category) {
      case 'daily':
        return '일일 체크리스트';
      case 'weekly':
        return '주간 체크리스트';
      case 'monthly':
        return '월간 체크리스트';
      default:
        return '체크리스트';
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader 
          title="체크리스트 템플릿 관리" 
          description="매장별 체크리스트 항목을 관리하세요." 
        />
        <div className="animate-pulse space-y-4">
          <Card>
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="space-y-8">
        <PageHeader 
          title="체크리스트 템플릿 관리" 
          description="매장별 체크리스트 항목을 관리하세요." 
        />
        <Card>
          <CardContent className="p-8 text-center">
            <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">템플릿을 찾을 수 없습니다.</p>
            <Button onClick={() => router.push('/dashboard/checklist')}>
              체크리스트로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="체크리스트 템플릿 관리" 
        description="매장별 체크리스트 항목을 관리하세요." 
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            일일
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            주간
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            월간
          </TabsTrigger>
        </TabsList>

        {(['daily', 'weekly', 'monthly'] as const).map((category) => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {getCategoryTitle(category)}
                  </CardTitle>
                  <Button 
                    onClick={() => handleAddItem(category)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    항목 추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getCategoryItems(category).map((item, index) => (
                    <div 
                      key={item.id}
                      className="flex items-start gap-4 p-4 border rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-2 mt-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <Badge variant="outline">{index + 1}</Badge>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`title-${item.id}`}>항목 제목 *</Label>
                          <Input
                            id={`title-${item.id}`}
                            value={item.title}
                            onChange={(e) => handleUpdateItem(item.id, 'title', e.target.value)}
                            placeholder="체크리스트 항목 제목을 입력하세요"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`description-${item.id}`}>설명 (선택사항)</Label>
                          <Textarea
                            id={`description-${item.id}`}
                            value={item.description || ''}
                            onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                            placeholder="항목에 대한 추가 설명을 입력하세요"
                            rows={2}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`required-${item.id}`}
                            checked={item.required}
                            onCheckedChange={(checked) => 
                              handleUpdateItem(item.id, 'required', checked)
                            }
                          />
                          <Label htmlFor={`required-${item.id}`}>필수 항목</Label>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {getCategoryItems(category).length === 0 && (
                    <div className="text-center py-8">
                      <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">
                        {getCategoryTitle(category)} 항목이 없습니다.
                      </p>
                      <Button 
                        onClick={() => handleAddItem(category)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        첫 항목 추가하기
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* 액션 버튼 */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로 가기
        </Button>
        <Button 
          onClick={handleSaveTemplate}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              템플릿 저장
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
