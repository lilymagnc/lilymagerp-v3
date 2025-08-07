import * as XLSX from 'xlsx';

interface SheetData {
  name: string;
  data: any[];
}

export const exportToExcel = async (sheets: SheetData[], filename: string) => {
  try {
    // 워크북 생성
    const workbook = XLSX.utils.book_new();

    // 각 시트 추가
    let hasValidSheet = false;
    sheets.forEach(sheet => {
      if (sheet.data.length > 0) {
        hasValidSheet = true;
        // 워크시트 생성
        const worksheet = XLSX.utils.json_to_sheet(sheet.data);
        
        // 열 너비 자동 조정
        const columnWidths = [];
        const headers = Object.keys(sheet.data[0]);
        
        headers.forEach((header, index) => {
          const maxLength = Math.max(
            header.length,
            ...sheet.data.map(row => String(row[header]).length)
          );
          columnWidths[index] = { width: Math.min(maxLength + 2, 50) };
        });
        
        worksheet['!cols'] = columnWidths;
        
        // 워크북에 시트 추가
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
      }
    });

    // 유효한 시트가 없으면 기본 시트 생성
    if (!hasValidSheet && sheets.length > 0) {
      const firstSheet = sheets[0];
      const defaultData = [{
        '메시지': '데이터가 없습니다.',
        '생성일시': new Date().toLocaleString()
      }];
      
      const worksheet = XLSX.utils.json_to_sheet(defaultData);
      XLSX.utils.book_append_sheet(workbook, worksheet, firstSheet.name);
    }

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
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Excel 내보내기 오류:', error);
    throw new Error('Excel 파일 생성에 실패했습니다.');
  }
};

// 단일 시트용 간단한 내보내기 함수
export const exportSingleSheet = async (data: any[], sheetName: string, filename: string) => {
  await exportToExcel([{ name: sheetName, data }], filename);
};

// 주문 내역 엑셀 내보내기 (기존 호환성 유지)
export const exportOrdersToExcel = async (orders: any[], filename: string) => {
  try {
    // 주문 데이터를 Excel 형식으로 변환
    const excelData = orders.map(order => {
      const orderDate = order.orderDate ? 
        (typeof order.orderDate === 'object' && 'toDate' in order.orderDate) 
          ? order.orderDate.toDate().toLocaleDateString()
          : new Date(order.orderDate).toLocaleDateString()
        : '';

      return {
        '주문일시': orderDate,
        '지점명': order.branchName || '',
        '주문상품': order.items?.map((item: any) => `${item.name || ''} (${item.quantity || 0}개)`).join(', ') || '',
        '상품금액': (order.summary?.subtotal || 0).toLocaleString(),
        '배송비': (order.summary?.deliveryFee || 0).toLocaleString(),
        '결제수단': order.payment ? getPaymentMethodText(order.payment.method) : '',
        '총금액': (order.summary?.total || 0).toLocaleString(),
        '주문상태': getStatusText(order.status),
        '결제상태': order.payment ? getPaymentStatusText(order.payment.status) : '',
        '주문자명': order.orderer?.name || '',
        '주문자연락처': order.orderer?.contact || '',
        '주문자이메일': order.orderer?.email || '',
        '수령방법': getReceiptTypeText(order.receiptType),
        '픽업/배송일시': order.pickupInfo ? 
          `${order.pickupInfo.date || ''} ${order.pickupInfo.time || ''}` : 
          order.deliveryInfo ? `${order.deliveryInfo.date || ''} ${order.deliveryInfo.time || ''}` : '',
        '수령인명': order.pickupInfo?.pickerName || order.deliveryInfo?.recipientName || '',
        '수령인연락처': order.pickupInfo?.pickerContact || order.deliveryInfo?.recipientContact || '',
        '배송주소': order.deliveryInfo?.address || '',
        '메세지타입': order.message?.type || '',
        '메세지내용': order.message?.content || '',
        '요청사항': order.request || '',
        '주문 ID': order.id || '',
        '회사명': order.orderer?.company || '',
        '주문유형': getOrderTypeText(order.orderType),
        '상품수량': order.items?.reduce((total: number, item: any) => total + (item.quantity || 0), 0) || 0,
        '할인': (order.summary?.discount || 0).toLocaleString(),
        '포인트사용': (order.summary?.pointsUsed || 0).toLocaleString(),
        '포인트적립': (order.summary?.pointsEarned || 0).toLocaleString(),
        '고객등록여부': order.registerCustomer ? '예' : '아니오',
        '익명주문': order.isAnonymous ? '예' : '아니오'
      };
    });

    await exportToExcel([{ name: '주문내역', data: excelData }], filename);

  } catch (error) {
    console.error('주문 엑셀 내보내기 오류:', error);
    throw new Error('주문 엑셀 파일 생성에 실패했습니다.');
  }
};

// 상태 텍스트 변환 함수들
const getStatusText = (status: string) => {
  switch (status) {
    case 'completed': return '완료';
    case 'processing': return '처리중';
    case 'canceled': return '취소';
    default: return status || '';
  }
};

const getPaymentStatusText = (status: string) => {
  switch (status) {
    case 'completed': return '완결';
    case 'pending': return '미결';
    default: return status || '';
  }
};

const getPaymentMethodText = (method: string) => {
  switch (method) {
    case 'card': return '카드';
    case 'cash': return '현금';
    case 'transfer': return '계좌이체';
    case 'mainpay': return '메인페이';
    case 'shopping_mall': return '쇼핑몰';
    case 'epay': return '이페이';
    default: return method || '';
  }
};

const getOrderTypeText = (type: string) => {
  switch (type) {
    case 'store': return '매장';
    case 'phone': return '전화';
    case 'naver': return '네이버';
    case 'kakao': return '카카오';
    case 'etc': return '기타';
    default: return type || '';
  }
};

const getReceiptTypeText = (type: string) => {
  switch (type) {
    case 'pickup': return '픽업';
    case 'delivery': return '배송';
    default: return type || '';
  }
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
        '픽업예정일', '픽업예정시간', '지점명', '주문상태', '총금액', '결제방법', '결제상태'
      ]
    : [
        '주문번호', '주문일시', '주문자명', '주문자연락처', '수령자명', '수령자연락처',
        '배송예정일', '배송예정시간', '배송지주소', '배송지역', '배송기사소속', '배송기사명', 
        '배송기사연락처', '지점명', '주문상태', '총금액', '결제방법', '결제상태'
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