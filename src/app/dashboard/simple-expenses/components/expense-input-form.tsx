"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Plus,
  Save,
  RotateCcw,
  Upload,
  Check,
  ChevronsUpDown,
  Trash2,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { useSimpleExpenses } from '@/hooks/use-simple-expenses';
import { usePartners } from '@/hooks/use-partners';
import { useAuth } from '@/hooks/use-auth';
import { useMaterials } from '@/hooks/use-materials';
import { useProducts } from '@/hooks/use-products';
import { useBranches } from '@/hooks/use-branches';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  SimpleExpenseCategory,
  MaterialSubCategory,
  FixedCostSubCategory,
  UtilitySubCategory,
  MealSubCategory,
  TransportSubCategory,
  OfficeSubCategory,
  MarketingSubCategory,
  MaintenanceSubCategory,
  InsuranceSubCategory,
  SIMPLE_EXPENSE_CATEGORY_LABELS,
  MATERIAL_SUB_CATEGORY_LABELS,
  FIXED_COST_SUB_CATEGORY_LABELS,
  UTILITY_SUB_CATEGORY_LABELS,
  MEAL_SUB_CATEGORY_LABELS,
  TRANSPORT_SUB_CATEGORY_LABELS,
  OFFICE_SUB_CATEGORY_LABELS,
  MARKETING_SUB_CATEGORY_LABELS,
  MAINTENANCE_SUB_CATEGORY_LABELS,
  INSURANCE_SUB_CATEGORY_LABELS
} from '@/types/simple-expense';
import { Timestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';

// 폼 스키마 정의
// 품목 스키마 수정 - 단가 필드 추가
const expenseItemSchema = z.object({
  description: z.string().min(1, '품목명을 입력해주세요'),
  quantity: z.number().min(1, '수량을 입력해주세요'),
  unitPrice: z.number().min(0, '단가를 입력해주세요'), // 단가 필드 추가
  amount: z.number().min(1, '금액을 입력해주세요')
});

// 재고 업데이트 아이템 스키마
const inventoryUpdateSchema = z.object({
  type: z.enum(['material', 'product']),
  id: z.string().min(1, 'ID를 선택해주세요'),
  name: z.string().min(1, '이름을 입력해주세요'),
  quantity: z.number().min(1, '수량을 입력해주세요'),
  unitPrice: z.number().min(0, '단가를 입력해주세요').optional()
});

// 전체 폼 스키마 수정 - 전체 분류 추가
const expenseFormSchema = z.object({
  date: z.string().min(1, '날짜를 선택해주세요'),
  supplier: z.string().min(1, '구매처를 입력해주세요'),
  category: z.nativeEnum(SimpleExpenseCategory),
  subCategory: z.string().optional(),
  items: z.array(expenseItemSchema).min(1, '최소 1개의 품목을 입력해주세요'),
  receiptFile: z.any().optional(),
  inventoryUpdates: z.array(inventoryUpdateSchema).optional(),
  relatedRequestId: z.string().optional()
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseInputFormProps {
  onSuccess?: () => void;
  initialData?: Partial<ExpenseFormValues>;
  continueMode?: boolean;
  selectedBranchId?: string;
  selectedBranchName?: string;
}

export function ExpenseInputForm({
  onSuccess,
  initialData,
  continueMode = false,
  selectedBranchId,
  selectedBranchName
}: ExpenseInputFormProps) {
  const isMountedRef = useRef(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [supplierSearchValue, setSupplierSearchValue] = useState('');
  const [isDirectInput, setIsDirectInput] = useState(false);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [isExcelUploading, setIsExcelUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'manual' | 'excel'>('manual');
  const [duplicateData, setDuplicateData] = useState<any[]>([]);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      date: initialData?.date || new Date().toISOString().split('T')[0],
      supplier: initialData?.supplier || '',
      category: initialData?.category || SimpleExpenseCategory.OTHER,
      subCategory: initialData?.subCategory || '',
      items: initialData?.items || [{
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0
      }],
      receiptFile: undefined,
      inventoryUpdates: initialData?.inventoryUpdates || [],
      relatedRequestId: initialData?.relatedRequestId || ''
    }
  });

  const { addExpense, fetchExpenses } = useSimpleExpenses();
  const { partners, fetchPartners } = usePartners();
  const { user } = useAuth();
  const { toast } = useToast();
  const { materials } = useMaterials();
  const { products } = useProducts();
  const { branches } = useBranches();

  // 중복 데이터 체크 함수
  const checkDuplicateData = useCallback(async (processedData: any[]) => {
    try {
      // 현재 지점의 기존 지출 데이터를 직접 Firestore에서 가져오기
      const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      const q = query(
        collection(db, 'simpleExpenses'),
        where('branchId', '==', selectedBranchId || ''),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      const existingExpenses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const duplicates: any[] = [];
      const uniqueData: any[] = [];

      for (const item of processedData) {
        const purchaseDateStr = item.purchaseDate.toISOString().split('T')[0];

        // 중복 체크: 같은 날짜, 같은 구매처, 같은 품목명
        const isDuplicate = existingExpenses.some((existing: any) => {
          if (!existing.date) return false;
          const existingDateStr = existing.date.toDate().toISOString().split('T')[0];
          return (
            existingDateStr === purchaseDateStr &&
            existing.supplier === item['구매처'] &&
            existing.description === item['품목명']
          );
        });

        if (isDuplicate) {
          duplicates.push({
            ...item,
            reason: '기존 데이터와 중복'
          });
        } else {
          uniqueData.push(item);
        }
      }

      return { duplicates, uniqueData };
    } catch (error) {
      console.error('중복 데이터 체크 오류:', error);
      return { duplicates: [], uniqueData: processedData };
    }
  }, [selectedBranchId]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const {
    fields: inventoryFields,
    append: appendInventory,
    remove: removeInventory
  } = useFieldArray({
    control: form.control,
    name: "inventoryUpdates"
  });

  // 컴포넌트 언마운트 시 cleanup
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // 모든 상태를 즉시 초기화
      setSupplierOpen(false);
      setSelectedFile(null);
      setSupplierSearchValue('');
      setIsDirectInput(false);
      // 폼 상태도 초기화
      form.reset();
    };
  }, [form]);

  // 안전한 상태 업데이트 함수
  const safeSetState = useCallback((setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    if (isMountedRef.current) {
      setter(value);
    }
  }, []);

  // 품목 추가
  const addItem = useCallback(() => {
    if (isMountedRef.current) {
      append({
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0
      });
    }
  }, [append]);

  // 총 금액 계산
  const totalAmount = form.watch('items').reduce((sum, item) => sum + (item.amount || 0), 0);

  const selectedCategory = form.watch('category');

  // 카테고리별 세부 분류 옵션
  const getSubCategoryOptions = useCallback((category: SimpleExpenseCategory) => {
    switch (category) {
      case SimpleExpenseCategory.MATERIAL:
        return Object.entries(MATERIAL_SUB_CATEGORY_LABELS);
      case SimpleExpenseCategory.FIXED_COST:
        return Object.entries(FIXED_COST_SUB_CATEGORY_LABELS);
      case SimpleExpenseCategory.UTILITY:
        return Object.entries(UTILITY_SUB_CATEGORY_LABELS);
      case SimpleExpenseCategory.MEAL:
        return Object.entries(MEAL_SUB_CATEGORY_LABELS);
      case SimpleExpenseCategory.TRANSPORT:
        return Object.entries(TRANSPORT_SUB_CATEGORY_LABELS);
      case SimpleExpenseCategory.OFFICE:
        return Object.entries(OFFICE_SUB_CATEGORY_LABELS);
      case SimpleExpenseCategory.MARKETING:
        return Object.entries(MARKETING_SUB_CATEGORY_LABELS);
      case SimpleExpenseCategory.MAINTENANCE:
        return Object.entries(MAINTENANCE_SUB_CATEGORY_LABELS);
      case SimpleExpenseCategory.INSURANCE:
        return Object.entries(INSURANCE_SUB_CATEGORY_LABELS);
      default:
        return [];
    }
  }, []);

  // 구매처 검색 - 거래처관리에서 가져온 데이터 사용
  const handleSupplierSearch = useCallback((searchTerm: string) => {
    if (isMountedRef.current) {
      safeSetState(setSupplierSearchValue, searchTerm);
    }
  }, [safeSetState]);

  // Popover 상태 변경 핸들러 - 더 안전한 방식으로 개선
  const handlePopoverOpenChange = useCallback((open: boolean) => {
    if (!isMountedRef.current) return;

    // 상태 변경을 즉시 수행하되, DOM 조작과 분리
    if (open) {
      safeSetState(setSupplierOpen, true);
    } else {
      // 닫을 때는 약간의 지연을 두어 DOM 조작 충돌 방지
      setTimeout(() => {
        if (isMountedRef.current) {
          safeSetState(setSupplierOpen, false);
          safeSetState(setIsDirectInput, false);
          safeSetState(setSupplierSearchValue, '');
        }
      }, 50);
    }
  }, [safeSetState]);

  // 구매처 선택 핸들러 개선
  const handleSupplierSelect = useCallback((supplierName: string) => {
    if (!isMountedRef.current) return;

    // 즉시 폼 값 설정
    form.setValue('supplier', supplierName);

    // 상태 변경을 지연시켜 DOM 조작 충돌 방지
    setTimeout(() => {
      if (isMountedRef.current) {
        safeSetState(setSupplierOpen, false);
        safeSetState(setSupplierSearchValue, '');
        safeSetState(setIsDirectInput, false);
        }
    }, 100);
  }, [form, safeSetState]);

  // 직접 입력 모드 활성화 개선
  const handleDirectInput = useCallback(() => {
    if (!isMountedRef.current) return;

    setTimeout(() => {
      if (isMountedRef.current) {
        safeSetState(setIsDirectInput, true);
        safeSetState(setSupplierOpen, false);
      }
    }, 50);
  }, [safeSetState]);

  // 직접 입력 구매처 저장
  const handleDirectInputSubmit = useCallback(() => {
    if (isMountedRef.current) {
      const inputValue = supplierSearchValue.trim();
      if (inputValue) {
        handleSupplierSelect(inputValue);
      }
    }
  }, [supplierSearchValue, handleSupplierSelect]);

  // 파일 선택
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (isMountedRef.current) {
      const file = event.target.files?.[0];
      if (file) {
        safeSetState(setSelectedFile, file);
        form.setValue('receiptFile', file);
      }
    }
  }, [form, safeSetState]);

  // 품목 삭제
  const handleRemoveItem = useCallback((index: number) => {
    if (isMountedRef.current && fields.length > 1) {
      remove(index);
    }
  }, [fields.length, remove]);

  // 엑셀 파일 처리
  const handleExcelUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isMountedRef.current) return;

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          toast({
            title: "오류",
            description: "엑셀 파일에 데이터가 없습니다.",
            variant: "destructive",
          });
          return;
        }

        // 헤더 검증
        const headers = jsonData[0] as string[];
        const requiredHeaders = ['날짜', '지점', '구매처', '분류', '세부분류', '품목명', '수량', '단가', '금액'];
        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

        if (missingHeaders.length > 0) {
          toast({
            title: "오류",
            description: `필수 헤더가 누락되었습니다: ${missingHeaders.join(', ')}`,
            variant: "destructive",
          });
          return;
        }

        // 데이터 처리 - 빈 행 필터링 추가
        const processedData = jsonData.slice(1)
          .filter((row: any) => {
            // 빈 행 필터링 (모든 셀이 비어있거나 null인 경우)
            return row && row.some((cell: any) => cell !== null && cell !== undefined && cell !== '');
          })
          .map((row: any, index: number) => {
            const rowData: any = {};
            headers.forEach((header, colIndex) => {
              rowData[header] = row[colIndex] || '';
            });

            // 데이터 검증
            if (!rowData['날짜'] || !rowData['지점'] || !rowData['구매처'] || !rowData['분류'] || !rowData['품목명']) {
              throw new Error(`행 ${index + 2}: 필수 데이터가 누락되었습니다.`);
            }

            // 지점명 검증 - 등록된 지점인지 확인
            const isValidBranch = branches.some(branch => branch.name === rowData['지점']);
            if (!isValidBranch) {
              console.warn(`행 ${index + 2}: 등록되지 않은 지점명 "${rowData['지점']}"입니다.`);
            }

            // 날짜 처리 개선
            let purchaseDate: Date;
            try {
              // 엑셀에서 날짜가 숫자로 저장된 경우 처리
              if (typeof rowData['날짜'] === 'number') {
                // Excel의 날짜는 1900년 1월 1일부터의 일수
                const excelDate = rowData['날짜'];
                const utcDaysSince1900 = excelDate - 25569; // 1900년 1월 1일부터 1970년 1월 1일까지의 일수
                const utcMillisecondsSince1970 = utcDaysSince1900 * 24 * 60 * 60 * 1000;
                purchaseDate = new Date(utcMillisecondsSince1970);
              } else {
                // 문자열로 저장된 경우
                purchaseDate = new Date(rowData['날짜']);
              }

              // 날짜 유효성 검사
              if (isNaN(purchaseDate.getTime())) {
                throw new Error(`행 ${index + 2}: 유효하지 않은 날짜 형식입니다: ${rowData['날짜']}`);
              }
            } catch (error) {
              throw new Error(`행 ${index + 2}: 날짜 처리 중 오류가 발생했습니다: ${rowData['날짜']}`);
            }

            // 분류 검증
            const categoryKey = Object.keys(SIMPLE_EXPENSE_CATEGORY_LABELS).find(
              key => SIMPLE_EXPENSE_CATEGORY_LABELS[key as SimpleExpenseCategory] === rowData['분류']
            );

            if (!categoryKey) {
              throw new Error(`행 ${index + 2}: 유효하지 않은 분류입니다: ${rowData['분류']}`);
            }

            return {
              ...rowData,
              purchaseDate: purchaseDate, // 파싱된 날짜 객체 추가
              category: categoryKey as SimpleExpenseCategory,
              quantity: parseFloat(rowData['수량']) || 1,
              unitPrice: parseFloat(rowData['단가']) || 0,
              amount: parseFloat(rowData['금액']) || 0,
              rowIndex: index + 2
            };
          });

        // 중복 데이터 체크
        const { duplicates, uniqueData } = await checkDuplicateData(processedData);

        safeSetState(setExcelData, uniqueData);
        safeSetState(setDuplicateData, duplicates);

        let message = `${uniqueData.length}개의 지출 데이터가 로드되었습니다.`;
        if (duplicates.length > 0) {
          message += ` (중복 데이터 ${duplicates.length}개 제외)`;
        }

        toast({
          title: "성공",
          description: message,
        });
      } catch (error) {
        console.error('엑셀 처리 오류:', error);
        toast({
          title: "오류",
          description: error instanceof Error ? error.message : "엑셀 파일 처리 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  }, [toast, safeSetState, checkDuplicateData]);

  // 엑셀 데이터 일괄 등록
  const handleBulkUpload = useCallback(async () => {
    if (!isMountedRef.current || excelData.length === 0) return;

    try {
      safeSetState(setIsExcelUploading, true);
      let successCount = 0;
      let errorCount = 0;

      for (const item of excelData) {
        if (!isMountedRef.current) break;

        try {
          // 엑셀에서 지점 정보를 읽어서 사용
          const branchName = item['지점'] || selectedBranchName || '';

          // 지점명을 branchId로 변환
          let branchId = selectedBranchId || '';
          let finalBranchName = branchName;

          if (branchName && branchName !== selectedBranchName) {
            // 엑셀에서 읽은 지점명이 현재 선택된 지점과 다르면 해당 지점의 ID를 찾기
            const branch = branches.find(b => b.name === branchName);
            if (branch) {
              branchId = branch.id;
              finalBranchName = branchName;
              } else {
              console.warn(`지점을 찾을 수 없습니다: ${branchName}, 현재 선택된 지점 사용`);
              finalBranchName = selectedBranchName || '';
            }
          } else {
            finalBranchName = selectedBranchName || '';
          }

          // 자재 자동 업데이트를 위한 inventoryUpdates 생성
          const inventoryUpdates = [];

          // 자재비 카테고리인 경우 자재 관리에 자동 업데이트
          if (item.category === 'material') {
            // 해당 지점의 기존 자재 검색
            const existingMaterial = materials.find(m => 
              m.name === item['품목명'] && m.branch === finalBranchName
            );

            if (existingMaterial) {
              // 해당 지점에 같은 이름의 자재가 있으면 해당 ID 사용
              inventoryUpdates.push({
                type: 'material',
                id: existingMaterial.id,
                name: item['품목명'],
                quantity: item.quantity,
                unitPrice: item.unitPrice
              });
              console.log(`기존 자재 사용 - ID: ${existingMaterial.id}`);
            } else {
              // 해당 지점에 같은 이름의 자재가 없으면 새로 생성
              const materialId = `M${String(Date.now()).slice(-5)}`;
              inventoryUpdates.push({
                type: 'material',
                id: materialId,
                name: item['품목명'],
                quantity: item.quantity,
                unitPrice: item.unitPrice
              });
              console.log(`새 자재 생성 - ID: ${materialId}`);
            }
          }

          // 제품 카테고리인 경우 제품 관리에 자동 업데이트
          if (item.category === 'product') {
            // 같은 이름의 제품이 있는지 확인 (지점 무관)
            const existingProduct = products.find(p => 
              p.name === item['품목명']
            );

            if (existingProduct) {
              // 같은 이름의 제품이 있으면 기존 ID 사용
              inventoryUpdates.push({
                type: 'product',
                id: existingProduct.id,
                name: item['품목명'],
                quantity: item.quantity,
                unitPrice: item.unitPrice
              });
              } else {
              // 같은 이름의 제품이 없으면 새로 생성
              const productId = `P${String(Date.now()).slice(-5)}`;
              inventoryUpdates.push({
                type: 'product',
                id: productId,
                name: item['품목명'],
                quantity: item.quantity,
                unitPrice: item.unitPrice
              });
              }
          }

          const expenseData = {
            date: Timestamp.fromDate(item.purchaseDate), // 파싱된 날짜 객체 사용
            supplier: item['구매처'],
            category: item.category,
            subCategory: item['세부분류'] || '',
            description: item['품목명'],
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            receiptFile: undefined,
            inventoryUpdates: inventoryUpdates, // 자재 자동 업데이트 추가
          };

          // 거래처 자동 등록을 위해 addExpense 함수 사용
          console.log(`엑셀 데이터 처리 중: ${item['구매처']} - ${item['품목명']}`);
          await addExpense(expenseData, branchId, finalBranchName);
          successCount++;
        } catch (error) {
          console.error(`행 ${item.rowIndex} 등록 오류:`, error);
          errorCount++;
        }
      }

      if (isMountedRef.current) {
        toast({
          title: "완료",
          description: `성공: ${successCount}개, 실패: ${errorCount}개`,
        });

        if (successCount > 0) {
          safeSetState(setExcelData, []);
          safeSetState(setUploadMode, 'manual');
          // 거래처 목록 새로고침
          await fetchPartners();
          onSuccess?.();
        }
      }
    } catch (error) {
      console.error('일괄 업로드 오류:', error);
      if (isMountedRef.current) {
        toast({
          title: "오류",
          description: "일괄 업로드 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } finally {
      if (isMountedRef.current) {
        safeSetState(setIsExcelUploading, false);
      }
    }
  }, [excelData, addExpense, selectedBranchId, selectedBranchName, onSuccess, toast, safeSetState]);

  // 엑셀 템플릿 다운로드
  const downloadExcelTemplate = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]; // 오늘 날짜
    const templateData = [
      ['날짜', '지점', '구매처', '분류', '세부분류', '품목명', '수량', '단가', '금액'],
      [today, selectedBranchName || '지점명', '예시거래처', '자재비', '생화', '장미 10송이', '1', '10000', '10000'],
      ['2024-01-15', selectedBranchName || '지점명', '다른거래처', '고정비', '임대료', '월세', '1', '50000', '50000']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '간편지출템플릿');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '간편지출_템플릿.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [selectedBranchName]);

  // 폼 제출
  const onSubmit = useCallback(async (values: ExpenseFormValues) => {
    if (!isMountedRef.current) return;

    try {
      safeSetState(setIsSubmitting, true);

      // 각 품목을 개별 지출로 생성
      for (const item of values.items) {
        if (!isMountedRef.current) break;

        const expenseData = {
          date: Timestamp.fromDate(new Date(values.date)),
          supplier: values.supplier,
          category: values.category,
          subCategory: values.subCategory,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          receiptFile: selectedFile,
          branchId: selectedBranchId || '', // 지점 ID 추가
          branchName: selectedBranchName || '', // 지점 이름 추가
        };

        await addExpense(expenseData, selectedBranchId || '', selectedBranchName || '');
      }

      if (isMountedRef.current) {
        toast({
          title: "성공",
          description: `${values.items.length}개 품목이 등록되었습니다.`,
        });

        if (!continueMode) {
          // 폼 초기화
          form.reset({
            date: new Date().toISOString().split('T')[0],
            supplier: '',
            category: SimpleExpenseCategory.OTHER,
            subCategory: '',
            items: [{
              description: '',
              quantity: 1,
              unitPrice: 0,
              amount: 0
            }],
            receiptFile: undefined
          });
          safeSetState(setSelectedFile, null);
          safeSetState(setSupplierSearchValue, '');
          safeSetState(setSupplierOpen, false);
          safeSetState(setIsDirectInput, false);
        }

        // 거래처 목록 새로고침
        await fetchPartners();
        onSuccess?.();
      }
    } catch (error) {
      console.error('지출 등록 오류:', error);
      if (isMountedRef.current) {
        toast({
          title: "오류",
          description: "지출 등록 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } finally {
      if (isMountedRef.current) {
        safeSetState(setIsSubmitting, false);
      }
    }
  }, [addExpense, selectedFile, selectedBranchId, selectedBranchName, continueMode, onSuccess, toast, form, safeSetState]);

  // 폼 초기화
  const handleReset = useCallback(() => {
    if (isMountedRef.current) {
      form.reset({
        date: new Date().toISOString().split('T')[0],
        supplier: '',
        category: SimpleExpenseCategory.OTHER,
        subCategory: '',
        items: [{
          description: '',
          quantity: 1,
          unitPrice: 0,
          amount: 0
        }],
        receiptFile: undefined
      });
      safeSetState(setSelectedFile, null);
      safeSetState(setSupplierSearchValue, '');
      safeSetState(setSupplierOpen, false);
      safeSetState(setIsDirectInput, false);
      safeSetState(setDuplicateData, []);
    }
  }, [form, safeSetState]);

  // 검색된 거래처 필터링
  const filteredPartners = partners.filter(partner =>
    String(partner.name ?? '').toLowerCase().includes(supplierSearchValue.toLowerCase()) ||
    String(partner.type ?? '').toLowerCase().includes(supplierSearchValue.toLowerCase())
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          간편지출 입력
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          카테고리를 선택하고 해당 카테고리의 여러 품목을 한 번에 입력할 수 있습니다.
        </p>

        {/* 모드 선택 */}
        <div className="flex items-center space-x-4 mt-4">
          <Button
            variant={uploadMode === 'manual' ? 'default' : 'outline'}
            onClick={() => setUploadMode('manual')}
            size="sm"
          >
            수동 입력
          </Button>
          <Button
            variant={uploadMode === 'excel' ? 'default' : 'outline'}
            onClick={() => setUploadMode('excel')}
            size="sm"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            엑셀 업로드
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {uploadMode === 'manual' ? (
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 기존 수동 입력 폼 */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* 날짜 */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>날짜</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 구매처 */}
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>구매처</FormLabel>
                      {isDirectInput ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="구매처명을 직접 입력하세요"
                              value={supplierSearchValue}
                              onChange={(e) => safeSetState(setSupplierSearchValue, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleDirectInputSubmit();
                                }
                              }}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleDirectInputSubmit}
                              disabled={!supplierSearchValue.trim()}
                            >
                              저장
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                safeSetState(setIsDirectInput, false);
                                safeSetState(setSupplierSearchValue, '');
                              }}
                            >
                              취소
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            새로운 구매처를 직접 입력합니다. 나중에 거래처관리에서 관리할 수 있습니다.
                          </p>
                        </div>
                      ) : (
                        <div className="relative">
                          <Popover
                            key={`supplier-popover-${supplierOpen}`}
                            open={supplierOpen}
                            onOpenChange={handlePopoverOpenChange}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={supplierOpen}
                                  className={cn(
                                    "justify-between w-full",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    {field.value ? (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{field.value}</span>
                                        <Badge variant="outline" className="text-xs">
                                          선택됨
                                        </Badge>
                                      </div>
                                    ) : (
                                      "구매처를 선택하거나 입력하세요"
                                    )}
                                  </div>
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[400px] p-0"
                              onOpenAutoFocus={(e) => e.preventDefault()}
                              onCloseAutoFocus={(e) => e.preventDefault()}
                              sideOffset={4}
                            >
                              <Command>
                                <div className="flex items-center border-b px-3 py-2">
                                  <Building2 className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                  <CommandInput
                                    placeholder="거래처명 또는 유형으로 검색..."
                                    value={supplierSearchValue}
                                    onValueChange={handleSupplierSearch}
                                    className="border-0 focus:ring-0"
                                  />
                                </div>
                                <CommandEmpty>
                                  <div className="p-4 text-center">
                                    <Building2 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground mb-2">
                                      "{supplierSearchValue}" 검색 결과가 없습니다.
                                    </p>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={handleDirectInput}
                                      className="w-full"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      새 구매처로 직접 입력
                                    </Button>
                                  </div>
                                </CommandEmpty>
                                <CommandGroup className="max-h-[300px] overflow-auto">
                                  {filteredPartners.length > 0 && (
                                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                      등록된 거래처 ({filteredPartners.length}개)
                                    </div>
                                  )}
                                  {filteredPartners.map((partner) => (
                                    <div
                                      key={partner.id}
                                      className={cn(
                                        "flex items-center gap-3 p-3 cursor-pointer hover:bg-accent rounded-md transition-colors",
                                        field.value === partner.name && "bg-accent border border-primary/20"
                                      )}
                                      onClick={() => {
                                        handleSupplierSelect(partner.name);
                                      }}
                                    >
                                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                                        <Building2 className="h-4 w-4 text-primary" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium truncate">{partner.name}</span>
                                          <Badge variant="secondary" className="text-xs">
                                            {partner.type}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <span>{partner.contactPerson || '연락처 없음'}</span>
                                          {partner.phone && (
                                            <span>• {partner.phone}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 카테고리 선택 */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">카테고리 선택</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    선택한 카테고리에 여러 품목을 추가할 수 있습니다.
                  </p>
                </div>

                {/* 전체 분류 */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>분류</FormLabel>
                      <Select
                        key={`category-select-${field.value}`}
                        onValueChange={(value) => {
                          if (isMountedRef.current) {
                            setTimeout(() => {
                              if (isMountedRef.current) {
                                try {
                                  field.onChange(value);
                                } catch (error) {
                                  console.error('Category change error:', error);
                                }
                              }
                            }, 100);
                          }
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="분류 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(SIMPLE_EXPENSE_CATEGORY_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 세부 분류 */}
                {getSubCategoryOptions(form.watch('category')).length > 0 && (
                  <FormField
                    control={form.control}
                    name="subCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>세부 분류</FormLabel>
                        <Select
                          key={`subcategory-select-${field.value}`}
                          onValueChange={(value) => {
                            if (isMountedRef.current) {
                              setTimeout(() => {
                                if (isMountedRef.current) {
                                  try {
                                    field.onChange(value);
                                  } catch (error) {
                                    console.error('Subcategory change error:', error);
                                  }
                                }
                              }, 100);
                            }
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="세부 분류 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getSubCategoryOptions(form.watch('category')).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* 품목 목록 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">
                      {SIMPLE_EXPENSE_CATEGORY_LABELS[form.watch('category')] || '카테고리'} 품목 ({fields.length}개)
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      같은 카테고리의 여러 품목을 추가할 수 있습니다.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    품목 추가
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 border-2 border-dashed border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-blue-600">품목 {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                      {/* 품목명 */}
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>품목명</FormLabel>
                            <FormControl>
                              <Input placeholder="구매한 품목명" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 수량 */}
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>수량</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="1"
                                {...field}
                                onChange={(e) => {
                                  const newQuantity = Math.max(1, parseFloat(e.target.value) || 1);
                                  field.onChange(newQuantity);
                                  // 수량 변경 시 금액 자동 계산
                                  const unitPrice = form.getValues(`items.${index}.unitPrice`) || 0;
                                  const newAmount = newQuantity * unitPrice;
                                  form.setValue(`items.${index}.amount`, newAmount);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 단가 */}
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>단가</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => {
                                  const newUnitPrice = parseFloat(e.target.value) || 0;
                                  field.onChange(newUnitPrice);
                                  // 단가 변경 시 금액 자동 계산
                                  const quantity = form.getValues(`items.${index}.quantity`) || 1;
                                  const newAmount = quantity * newUnitPrice;
                                  form.setValue(`items.${index}.amount`, newAmount);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 금액 (자동 계산) */}
                      <FormField
                        control={form.control}
                        name={`items.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>금액 (자동 계산)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                readOnly
                                className="bg-gray-50"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Card>
                ))}
              </div>

              {/* 총 금액 표시 */}
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-800">총 금액:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {totalAmount.toLocaleString()}원
                  </span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  {fields.length}개 품목이 {SIMPLE_EXPENSE_CATEGORY_LABELS[form.watch('category')] || '선택된 카테고리'}에 등록됩니다.
                </p>
              </div>

              {/* 영수증 첨부 */}
              <div className="space-y-2">
                <Label htmlFor="receipt-upload">영수증 첨부 (선택사항)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <Label
                    htmlFor="receipt-upload"
                    className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4" />
                    {selectedFile ? selectedFile.name : '영수증 선택'}
                  </Label>
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        safeSetState(setSelectedFile, null);
                        form.setValue('receiptFile', undefined);
                      }}
                    >
                      제거
                    </Button>
                  )}
                </div>
              </div>

              {/* 자재요청 연동 섹션 */}
              {selectedCategory === SimpleExpenseCategory.MATERIAL && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">자재요청 연동</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      이 구매가 특정 자재요청과 관련이 있다면 요청 ID를 입력하세요. 자동으로 완료 처리됩니다.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="relatedRequestId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>관련 자재요청 ID (선택사항)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="예: REQ-20241206-123456"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {/* 재고 업데이트 섹션 */}
              {selectedCategory === SimpleExpenseCategory.MATERIAL && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">재고 업데이트</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      구매한 자재의 재고를 자동으로 업데이트할 수 있습니다.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="mb-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          // 품목명 기반 자동 매칭
                          const items = form.getValues('items');
                          const suggestions: any[] = [];

                          items.forEach(item => {
                            // 자재에서 매칭 찾기
                            const matchedMaterial = materials.find(m =>
                              m.branch === selectedBranchName &&
                              m.name.toLowerCase().includes(item.description.toLowerCase())
                            );

                            if (matchedMaterial) {
                              suggestions.push({
                                type: 'material',
                                id: matchedMaterial.id,
                                name: matchedMaterial.name,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice
                              });
                                        } else {
              // 상품에서 매칭 찾기 (지점별로 검색)
              const matchedProduct = products.find(p =>
                p.branch === selectedBranchName &&
                p.name.toLowerCase().includes(item.description.toLowerCase())
              );

              if (matchedProduct) {
                suggestions.push({
                  type: 'product',
                  id: matchedProduct.id,
                  name: matchedProduct.name,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice
                });
              } else {
                // 다른 지점에서 같은 이름의 상품 찾기 (ID 재사용)
                const sameNameProduct = products.find(p =>
                  p.name.toLowerCase().includes(item.description.toLowerCase())
                );

                if (sameNameProduct) {
                  suggestions.push({
                    type: 'product',
                    id: sameNameProduct.id, // 같은 이름이면 같은 ID 사용
                    name: sameNameProduct.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice
                  });
                }
              }
            }
                          });

                          // 기존 재고 업데이트 항목 제거하고 새로 추가
                          form.setValue('inventoryUpdates', suggestions);

                          toast({
                            title: "자동 매칭 완료",
                            description: `${suggestions.length}개 품목이 매칭되었습니다.`
                          });
                        }}
                      >
                        품목명으로 자동 매칭
                      </Button>
                    </div>

                    {inventoryFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-2">
                          <Label>유형</Label>
                          <FormField
                            control={form.control}
                            name={`inventoryUpdates.${index}.type`}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="material">자재</SelectItem>
                                  <SelectItem value="product">상품</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        <div className="col-span-3">
                          <Label>품목</Label>
                          <FormField
                            control={form.control}
                            name={`inventoryUpdates.${index}.id`}
                            render={({ field }) => (
                              <Select onValueChange={(value) => {
                                field.onChange(value);
                                const selectedItem = [...materials, ...products].find(item => item.id === value);
                                if (selectedItem) {
                                  form.setValue(`inventoryUpdates.${index}.name`, selectedItem.name);
                                }
                              }}>
                                <SelectTrigger>
                                  <SelectValue placeholder="품목 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  {materials.filter(m => m.branch === selectedBranchName).map(material => (
                                    <SelectItem key={material.id} value={material.id}>
                                      {material.name}
                                    </SelectItem>
                                  ))}
                                  {products.filter(p => p.branch === selectedBranchName).map(product => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>수량</Label>
                          <FormField
                            control={form.control}
                            name={`inventoryUpdates.${index}.quantity`}
                            render={({ field }) => (
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>단가</Label>
                          <FormField
                            control={form.control}
                            name={`inventoryUpdates.${index}.unitPrice`}
                            render={({ field }) => (
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            )}
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeInventory(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendInventory({
                        type: 'material',
                        id: '',
                        name: '',
                        quantity: 1,
                        unitPrice: 0
                      })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      재고 업데이트 항목 추가
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* 버튼 그룹 */}
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {fields.length}개 품목 저장
                </Button>
                {continueMode && (
                  <Button type="button" variant="outline" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    초기화
                  </Button>
                )}
              </div>
            </form>
          </FormProvider>
        ) : (
          /* 엑셀 업로드 모드 */
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <FileSpreadsheet className="h-12 w-12 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium">엑셀 파일 업로드</h3>
                <p className="text-sm text-muted-foreground">
                  엑셀 파일을 업로드하여 대량의 지출 데이터를 한 번에 등록할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <Button onClick={downloadExcelTemplate} variant="outline">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  템플릿 다운로드
                </Button>
                <div className="relative">
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelUpload}
                    className="hidden"
                    id="excel-upload"
                    disabled={isExcelUploading}
                  />
                  <Button
                    onClick={() => document.getElementById('excel-upload')?.click()}
                    disabled={isExcelUploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    엑셀 파일 선택
                  </Button>
                </div>
              </div>

              {excelData.length > 0 && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">업로드된 데이터</h4>
                    <p className="text-sm text-green-600 mb-3">
                      {excelData.length}개의 지출 데이터가 로드되었습니다.
                    </p>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {excelData.map((item, index) => (
                        <div key={index} className="text-xs bg-white p-2 rounded border">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{item['날짜']}</span>
                            <span className="text-green-600 font-bold">
                              {item.amount.toLocaleString()}원
                            </span>
                          </div>
                          <div className="text-gray-600">
                            {item['구매처']} - {item['품목명']}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 중복 데이터 표시 */}
                  {duplicateData.length > 0 && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-medium text-yellow-800 mb-2">중복 데이터 (제외됨)</h4>
                      <p className="text-sm text-yellow-600 mb-3">
                        다음 {duplicateData.length}개의 데이터는 기존 데이터와 중복되어 제외되었습니다.
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {duplicateData.map((item, index) => (
                          <div key={index} className="text-xs bg-white p-2 rounded border border-yellow-300">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{item['날짜']}</span>
                              <span className="text-yellow-600 font-bold">
                                {item.amount.toLocaleString()}원
                              </span>
                            </div>
                            <div className="text-gray-600">
                              {item['구매처']} - {item['품목명']}
                            </div>
                            <div className="text-xs text-yellow-600 mt-1">
                              ⚠️ {item.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={handleBulkUpload}
                      disabled={isExcelUploading}
                      className="flex-1 max-w-xs"
                    >
                      {isExcelUploading ? (
                        <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {excelData.length}개 데이터 등록
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        safeSetState(setExcelData, []);
                        safeSetState(setUploadMode, 'manual');
                      }}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
