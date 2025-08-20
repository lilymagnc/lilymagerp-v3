import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ChecklistRecord, ChecklistTemplate } from '@/types/checklist';
import { SimpleExpense } from '@/types/simple-expense';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// 단일 체크리스트를 엑셀로 내보내기
export const exportSingleChecklist = (
  checklist: ChecklistRecord, 
  template?: ChecklistTemplate
) => {
  // 워크북 생성
  const wb = XLSX.utils.book_new();
  
  // 체크리스트 기본 정보
  const basicInfo = [
    ['체크리스트 정보'],
    [''],
    ['날짜', checklist.date],
    ['카테고리', checklist.category === 'daily' ? '일일' : checklist.category === 'weekly' ? '주간' : '월간'],
    ['담당자', checklist.responsiblePerson || '미입력'],
    ['오픈 담당자', checklist.openWorker || '미입력'],
    ['마감 담당자', checklist.closeWorker || '미입력'],
    ['상태', checklist.status === 'completed' ? '완료' : checklist.status === 'partial' ? '진행중' : '대기'],
    ['메모', checklist.notes || ''],
    ['날씨', checklist.weather || ''],
    ['특별 이벤트', checklist.specialEvents || ''],
    [''],
  ];

  // 체크리스트 항목 데이터
  const itemsData = [
    ['체크리스트 항목'],
    [''],
    ['순서', '항목명', '상태', '체크 시간', '비고']
  ];

  checklist.items.forEach((item, index) => {
    const templateItem = template?.items.find(t => t.id === item.itemId);
         itemsData.push([
       String(index + 1),
       templateItem?.title || `항목 ${item.itemId}`,
       item.checked ? '완료' : '미완료',
       item.checkedAt ? format(item.checkedAt.toDate(), 'yyyy-MM-dd HH:mm', { locale: ko }) : '',
       templateItem?.required ? '필수' : '선택'
     ]);
  });

  // 완료율 계산
  let completionRate = 0;
  if (template) {
    const requiredItems = template.items.filter(item => item.required && item.category === checklist.category);
    const requiredItemIds = requiredItems.map(item => item.id);
    const completedRequiredItems = checklist.items.filter(item => 
      item.checked && requiredItemIds.includes(item.itemId)
    ).length;
    completionRate = requiredItemIds.length > 0 ? (completedRequiredItems / requiredItemIds.length) * 100 : 0;
  } else {
    const totalItems = checklist.items.length;
    const completedItems = checklist.items.filter(item => item.checked).length;
    completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  }

  const summaryData = [
    [''],
    ['요약 정보'],
    [''],
    ['총 항목 수', checklist.items.length],
    ['완료 항목 수', checklist.items.filter(item => item.checked).length],
    ['완료율', `${completionRate.toFixed(1)}%`],
    ['생성일', checklist.completedAt ? format(checklist.completedAt.toDate(), 'yyyy-MM-dd HH:mm', { locale: ko }) : '']
  ];

  // 모든 데이터를 하나의 배열로 합치기
  const allData = [...basicInfo, ...itemsData, ...summaryData];

  // 워크시트 생성
  const ws = XLSX.utils.aoa_to_sheet(allData);

  // 열 너비 설정
  ws['!cols'] = [
    { width: 15 }, // 순서
    { width: 40 }, // 항목명
    { width: 12 }, // 상태
    { width: 20 }, // 체크 시간
    { width: 15 }  // 비고
  ];

  // 워크북에 워크시트 추가
  const sheetName = `${checklist.category === 'daily' ? '일일' : checklist.category === 'weekly' ? '주간' : '월간'}체크리스트`;
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // 파일명 생성
  const fileName = `체크리스트_${checklist.date}_${checklist.category === 'daily' ? '일일' : checklist.category === 'weekly' ? '주간' : '월간'}.xlsx`;

  // 파일 다운로드
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, fileName);
};

// 여러 체크리스트를 하나의 엑셀 파일로 내보내기
export const exportMultipleChecklists = (
  checklists: ChecklistRecord[],
  templates: Record<string, ChecklistTemplate>
) => {
  // 워크북 생성
  const wb = XLSX.utils.book_new();

  // 각 체크리스트를 별도 시트로 추가
  checklists.forEach((checklist, index) => {
    const template = templates[checklist.branchId];
    
    // 체크리스트 기본 정보
    const basicInfo = [
      ['체크리스트 정보'],
      [''],
      ['날짜', checklist.date],
      ['카테고리', checklist.category === 'daily' ? '일일' : checklist.category === 'weekly' ? '주간' : '월간'],
      ['담당자', checklist.responsiblePerson || '미입력'],
      ['오픈 담당자', checklist.openWorker || '미입력'],
      ['마감 담당자', checklist.closeWorker || '미입력'],
      ['상태', checklist.status === 'completed' ? '완료' : checklist.status === 'partial' ? '진행중' : '대기'],
      ['메모', checklist.notes || ''],
      ['날씨', checklist.weather || ''],
      ['특별 이벤트', checklist.specialEvents || ''],
      [''],
    ];

    // 체크리스트 항목 데이터
    const itemsData = [
      ['체크리스트 항목'],
      [''],
      ['순서', '항목명', '상태', '체크 시간', '비고']
    ];

    checklist.items.forEach((item, itemIndex) => {
      const templateItem = template?.items.find(t => t.id === item.itemId);
           itemsData.push([
       String(itemIndex + 1),
       templateItem?.title || `항목 ${item.itemId}`,
       item.checked ? '완료' : '미완료',
       item.checkedAt ? format(item.checkedAt.toDate(), 'yyyy-MM-dd HH:mm', { locale: ko }) : '',
       templateItem?.required ? '필수' : '선택'
     ]);
    });

    // 완료율 계산
    let completionRate = 0;
    if (template) {
      const requiredItems = template.items.filter(item => item.required && item.category === checklist.category);
      const requiredItemIds = requiredItems.map(item => item.id);
      const completedRequiredItems = checklist.items.filter(item => 
        item.checked && requiredItemIds.includes(item.itemId)
      ).length;
      completionRate = requiredItemIds.length > 0 ? (completedRequiredItems / requiredItemIds.length) * 100 : 0;
    } else {
      const totalItems = checklist.items.length;
      const completedItems = checklist.items.filter(item => item.checked).length;
      completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    }

    const summaryData = [
      [''],
      ['요약 정보'],
      [''],
      ['총 항목 수', checklist.items.length],
      ['완료 항목 수', checklist.items.filter(item => item.checked).length],
      ['완료율', `${completionRate.toFixed(1)}%`],
      ['생성일', checklist.completedAt ? format(checklist.completedAt.toDate(), 'yyyy-MM-dd HH:mm', { locale: ko }) : '']
    ];

    // 모든 데이터를 하나의 배열로 합치기
    const allData = [...basicInfo, ...itemsData, ...summaryData];

    // 워크시트 생성
    const ws = XLSX.utils.aoa_to_sheet(allData);

    // 열 너비 설정
    ws['!cols'] = [
      { width: 15 }, // 순서
      { width: 40 }, // 항목명
      { width: 12 }, // 상태
      { width: 20 }, // 체크 시간
      { width: 15 }  // 비고
    ];

    // 시트명 생성 (중복 방지)
    const baseSheetName = `${checklist.category === 'daily' ? '일일' : checklist.category === 'weekly' ? '주간' : '월간'}체크리스트`;
    const sheetName = checklists.filter(c => c.category === checklist.category).length > 1 
      ? `${baseSheetName}_${index + 1}` 
      : baseSheetName;

    // 워크북에 워크시트 추가
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // 파일명 생성
  const today = format(new Date(), 'yyyy-MM-dd', { locale: ko });
  const fileName = `체크리스트_통합_${today}.xlsx`;

  // 파일 다운로드
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, fileName);
};

// 체크리스트 요약 정보를 엑셀로 내보내기
export const exportChecklistSummary = (checklists: ChecklistRecord[]) => {
  // 워크북 생성
  const wb = XLSX.utils.book_new();

  // 요약 데이터 생성
  const summaryData = [
    ['체크리스트 요약'],
    [''],
    ['날짜', '카테고리', '담당자', '완료율', '상태', '생성일']
  ];

  checklists.forEach(checklist => {
    const totalItems = checklist.items.length;
    const completedItems = checklist.items.filter(item => item.checked).length;
    const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    summaryData.push([
      checklist.date,
      checklist.category === 'daily' ? '일일' : checklist.category === 'weekly' ? '주간' : '월간',
      checklist.responsiblePerson || '미입력',
      `${completionRate.toFixed(1)}%`,
      checklist.status === 'completed' ? '완료' : checklist.status === 'partial' ? '진행중' : '대기',
      checklist.completedAt ? format(checklist.completedAt.toDate(), 'yyyy-MM-dd HH:mm', { locale: ko }) : ''
    ]);
  });

  // 워크시트 생성
  const ws = XLSX.utils.aoa_to_sheet(summaryData);

  // 열 너비 설정
  ws['!cols'] = [
    { width: 15 }, // 날짜
    { width: 12 }, // 카테고리
    { width: 20 }, // 담당자
    { width: 12 }, // 완료율
    { width: 12 }, // 상태
    { width: 20 }  // 생성일
  ];

  // 워크북에 워크시트 추가
  XLSX.utils.book_append_sheet(wb, ws, '요약');

  // 파일명 생성
  const today = format(new Date(), 'yyyy-MM-dd', { locale: ko });
  const fileName = `체크리스트_요약_${today}.xlsx`;

  // 파일 다운로드
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, fileName);
}; 

// 픽업/배송 예약 현황 엑셀 출력 함수
export const exportPickupDeliveryToExcel = (
  orders: any[], 
  type: 'pickup' | 'delivery', 
  startDate: string, 
  endDate: string
) => {
  // 날짜 필터링
  const filteredOrders = orders.filter(order => {
    const orderDate = order.orderDate?.toDate?.() || new Date(order.orderDate);
    const orderDateStr = orderDate.toISOString().split('T')[0];
    return orderDateStr >= startDate && orderDateStr <= endDate;
  });

  // 헤더 정의
  const headers = type === 'pickup' 
    ? [
        '주문번호', '주문일시', '주문자명', '주문자연락처', '픽업자명', '픽업자연락처', 
        '픽업예정일', '픽업예정시간', '지점명', '주문상태', '상품금액', '배송비', '총금액', '결제방법', '결제상태'
      ]
    : [
        '주문번호', '주문일시', '주문자명', '주문자연락처', '수령자명', '수령자연락처',
        '배송예정일', '배송예정시간', '배송지주소', '배송지역', '배송기사소속', '배송기사명', 
        '배송기사연락처', '지점명', '주문상태', '상품금액', '배송비', '실제배송비', '배송비차익', '총금액', '결제방법', '결제상태'
      ];

  // 데이터 변환
  const data = filteredOrders.map(order => {
    const orderDate = order.orderDate?.toDate?.() || new Date(order.orderDate);
    const formattedOrderDate = orderDate.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const baseData = [
      order.id,
      formattedOrderDate,
      order.orderer?.name || '-',
      order.orderer?.contact || '-',
    ];

    if (type === 'pickup') {
      return [
        ...baseData,
        order.pickupInfo?.pickerName || '-',
        order.pickupInfo?.pickerContact || '-',
        order.pickupInfo?.date || '-',
        order.pickupInfo?.time || '-',
        order.branchName || '-',
        order.status || '-',
        (order.summary?.subtotal || 0).toLocaleString(),
        (order.summary?.deliveryFee || 0).toLocaleString(),
        (order.summary?.total || 0).toLocaleString(),
        order.payment?.method || '-',
        order.payment?.status || '-'
      ];
    } else {
      return [
        ...baseData,
        order.deliveryInfo?.recipientName || '-',
        order.deliveryInfo?.recipientContact || '-',
        order.deliveryInfo?.date || '-',
        order.deliveryInfo?.time || '-',
        order.deliveryInfo?.address || '-',
        order.deliveryInfo?.district || '-',
        order.deliveryInfo?.driverAffiliation || '-',
        order.deliveryInfo?.driverName || '-',
        order.deliveryInfo?.driverContact || '-',
        order.branchName || '-',
        order.status || '-',
        (order.summary?.subtotal || 0).toLocaleString(),
        (order.summary?.deliveryFee || 0).toLocaleString(),
        order.actualDeliveryCost ? order.actualDeliveryCost.toLocaleString() : '-',
        order.deliveryProfit !== undefined ? order.deliveryProfit.toLocaleString() : '-',
        (order.summary?.total || 0).toLocaleString(),
        order.payment?.method || '-',
        order.payment?.status || '-'
      ];
    }
  });

  // 워크북 생성
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // 열 너비 설정
  const colWidths = type === 'pickup' 
    ? [
        { width: 15 }, // 주문번호
        { width: 20 }, // 주문일시
        { width: 12 }, // 주문자명
        { width: 15 }, // 주문자연락처
        { width: 12 }, // 픽업자명
        { width: 15 }, // 픽업자연락처
        { width: 12 }, // 픽업예정일
        { width: 10 }, // 픽업예정시간
        { width: 12 }, // 지점명
        { width: 10 }, // 주문상태
        { width: 12 }, // 상품금액
        { width: 10 }, // 배송비
        { width: 12 }, // 총금액
        { width: 10 }, // 결제방법
        { width: 10 }, // 결제상태
      ]
    : [
        { width: 15 }, // 주문번호
        { width: 20 }, // 주문일시
        { width: 12 }, // 주문자명
        { width: 15 }, // 주문자연락처
        { width: 12 }, // 수령자명
        { width: 15 }, // 수령자연락처
        { width: 12 }, // 배송예정일
        { width: 10 }, // 배송예정시간
        { width: 30 }, // 배송지주소
        { width: 12 }, // 배송지역
        { width: 15 }, // 배송기사소속
        { width: 12 }, // 배송기사명
        { width: 15 }, // 배송기사연락처
        { width: 12 }, // 지점명
        { width: 10 }, // 주문상태
        { width: 12 }, // 상품금액
        { width: 10 }, // 배송비
        { width: 12 }, // 실제배송비
        { width: 12 }, // 배송비차익
        { width: 12 }, // 총금액
        { width: 10 }, // 결제방법
        { width: 10 }, // 결제상태
      ];

  worksheet['!cols'] = colWidths;

  // 시트 이름 설정
  const sheetName = type === 'pickup' ? '픽업예약현황' : '배송예약현황';
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 파일명 생성
  const typeText = type === 'pickup' ? '픽업예약' : '배송예약';
  const fileName = `${typeText}_현황_${startDate}_${endDate}.xlsx`;

  // 파일 다운로드
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array' 
  });
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}; 

// 주문 내보내기 함수
export const exportOrdersToExcel = (orders: any[], startDate?: string, endDate?: string) => {
  // 날짜 필터링 (선택사항)
  let filteredOrders = orders;
  if (startDate && endDate) {
    filteredOrders = orders.filter(order => {
      const orderDate = order.orderDate?.toDate?.() || new Date(order.orderDate);
      const orderDateStr = orderDate.toISOString().split('T')[0];
      return orderDateStr >= startDate && orderDateStr <= endDate;
    });
  }

  // 헤더 정의
  const headers = [
    '주문번호', '주문일시', '지점명', '주문자명', '주문자연락처', '주문상태',
    '상품명', '수량', '단가', '상품금액', '배송비', '총금액',
    '결제방법', '결제상태', '픽업예정일', '픽업예정시간', '배송예정일', '배송예정시간',
    '배송지주소', '수령자명', '수령자연락처', '메모', '생성일'
  ];

  // 데이터 변환
  const data = filteredOrders.map(order => {
    const orderDate = order.orderDate?.toDate?.() || new Date(order.orderDate);
    const formattedOrderDate = orderDate.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    // 상품 정보 (첫 번째 상품만 표시, 나머지는 별도 행으로)
    const firstItem = order.items?.[0];
    const itemName = firstItem ? firstItem.name : '-';
    const itemQuantity = firstItem ? firstItem.quantity : 0;
    const itemPrice = firstItem ? firstItem.price : 0;
    const itemTotal = firstItem ? firstItem.total : 0;

    return [
      order.id,
      formattedOrderDate,
      order.branchName || '-',
      order.orderer?.name || '-',
      order.orderer?.contact || '-',
      order.status || '-',
      itemName,
      itemQuantity,
      itemPrice.toLocaleString(),
      itemTotal.toLocaleString(),
      (order.summary?.deliveryFee || 0).toLocaleString(),
      (order.summary?.total || 0).toLocaleString(),
      order.payment?.method || '-',
      order.payment?.status || '-',
      order.pickupInfo?.date || '-',
      order.pickupInfo?.time || '-',
      order.deliveryInfo?.date || '-',
      order.deliveryInfo?.time || '-',
      order.deliveryInfo?.address || '-',
      order.deliveryInfo?.recipientName || '-',
      order.deliveryInfo?.recipientContact || '-',
      order.memo || '-',
      order.createdAt ? format(order.createdAt.toDate(), 'yyyy-MM-dd HH:mm', { locale: ko }) : '-'
    ];
  });

  // 추가 상품이 있는 경우 별도 행으로 추가
  const additionalRows: any[] = [];
  filteredOrders.forEach(order => {
    if (order.items && order.items.length > 1) {
      for (let i = 1; i < order.items.length; i++) {
        const item = order.items[i];
        additionalRows.push([
          order.id,
          '', // 주문일시는 첫 번째 행에만 표시
          '', // 지점명
          '', // 주문자명
          '', // 주문자연락처
          '', // 주문상태
          item.name,
          item.quantity,
          item.price.toLocaleString(),
          item.total.toLocaleString(),
          '', // 배송비
          '', // 총금액
          '', // 결제방법
          '', // 결제상태
          '', // 픽업예정일
          '', // 픽업예정시간
          '', // 배송예정일
          '', // 배송예정시간
          '', // 배송지주소
          '', // 수령자명
          '', // 수령자연락처
          '', // 메모
          ''  // 생성일
        ]);
      }
    }
  });

  // 모든 데이터 합치기
  const allData = [headers, ...data, ...additionalRows];

  // 워크북 생성
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(allData);

  // 열 너비 설정
  worksheet['!cols'] = [
    { width: 15 }, // 주문번호
    { width: 20 }, // 주문일시
    { width: 12 }, // 지점명
    { width: 12 }, // 주문자명
    { width: 15 }, // 주문자연락처
    { width: 10 }, // 주문상태
    { width: 30 }, // 상품명
    { width: 8 },  // 수량
    { width: 12 }, // 단가
    { width: 12 }, // 상품금액
    { width: 10 }, // 배송비
    { width: 12 }, // 총금액
    { width: 10 }, // 결제방법
    { width: 10 }, // 결제상태
    { width: 12 }, // 픽업예정일
    { width: 10 }, // 픽업예정시간
    { width: 12 }, // 배송예정일
    { width: 10 }, // 배송예정시간
    { width: 30 }, // 배송지주소
    { width: 12 }, // 수령자명
    { width: 15 }, // 수령자연락처
    { width: 20 }, // 메모
    { width: 20 }  // 생성일
  ];

  // 시트 이름 설정
  XLSX.utils.book_append_sheet(workbook, worksheet, '주문내역');

  // 파일명 생성
  const today = format(new Date(), 'yyyy-MM-dd', { locale: ko });
  const fileName = startDate && endDate 
    ? `주문내역_${startDate}_${endDate}.xlsx`
    : `주문내역_${today}.xlsx`;

  // 파일 다운로드
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array' 
  });
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// 간편지출 내보내기 함수
export const exportToExcel = (expenses: SimpleExpense[], startDate?: string, endDate?: string) => {
  // 날짜 필터링 (선택사항)
  let filteredExpenses = expenses;
  if (startDate && endDate) {
    filteredExpenses = expenses.filter(expense => {
      const expenseDate = expense.date && typeof expense.date === 'object' && 'toDate' in expense.date ? 
        expense.date.toDate() : new Date(expense.date);
      const expenseDateStr = expenseDate.toISOString().split('T')[0];
      return expenseDateStr >= startDate && expenseDateStr <= endDate;
    });
  }

  // 헤더 정의
  const headers = [
    '날짜', '카테고리', '항목', '금액', '지점명', '담당자', '메모', '생성일'
  ];

  // 데이터 변환
  const data = filteredExpenses.map(expense => {
    const expenseDate = expense.date && typeof expense.date === 'object' && 'toDate' in expense.date ? 
      expense.date.toDate() : new Date(expense.date);
    const formattedDate = format(expenseDate, 'yyyy-MM-dd', { locale: ko });

    return [
      formattedDate,
      expense.category || '-',
      expense.description || '-',
      expense.amount?.toLocaleString() || '0',
      expense.branchName || '-',
      expense.supplier || '-',
      expense.description || '-',
      expense.createdAt && typeof expense.createdAt === 'object' && 'toDate' in expense.createdAt ? 
        format(expense.createdAt.toDate(), 'yyyy-MM-dd HH:mm', { locale: ko }) : '-'
    ];
  });

  // 워크북 생성
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // 열 너비 설정
  worksheet['!cols'] = [
    { width: 12 }, // 날짜
    { width: 15 }, // 카테고리
    { width: 25 }, // 항목
    { width: 12 }, // 금액
    { width: 15 }, // 지점명
    { width: 15 }, // 담당자
    { width: 30 }, // 메모
    { width: 20 }  // 생성일
  ];

  // 시트 이름 설정
  XLSX.utils.book_append_sheet(workbook, worksheet, '간편지출');

  // 파일명 생성
  const today = format(new Date(), 'yyyy-MM-dd', { locale: ko });
  const fileName = startDate && endDate 
    ? `간편지출_${startDate}_${endDate}.xlsx`
    : `간편지출_${today}.xlsx`;

  // 파일 다운로드
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array' 
  });
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  saveAs(blob, fileName);
};
