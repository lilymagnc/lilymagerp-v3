import * as XLSX from 'xlsx';
import { Order } from '@/hooks/use-orders';
import { format } from 'date-fns';

export const exportOrdersToExcel = (orders: Order[], filename: string = '주문내역') => {
  try {
    // 주문 데이터를 Excel 형식으로 변환 (업로드 템플릿 순서에 맞춤)
    const excelData = orders.map(order => {
      // 안전한 데이터 변환
      const orderDate = order.orderDate ? 
        (typeof order.orderDate === 'object' && 'toDate' in order.orderDate) 
          ? format(order.orderDate.toDate(), 'yyyy-MM-dd HH:mm')
          : format(new Date(order.orderDate), 'yyyy-MM-dd HH:mm')
        : '';

      // 업로드 템플릿과 동일한 순서로 헤더 배치
      return {
        // === 업로드 템플릿과 동일한 순서 ===
        '주문일시': orderDate,
        '지점명': order.branchName || '',
        '주문상품': order.items?.map(item => `${item.name || ''} (${item.quantity || 0}개)`).join(', ') || '',
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
        
        // === 업로드 템플릿에 없는 추가 정보들 (뒤쪽에 배치) ===
        '주문 ID': order.id || '',
        '회사명': order.orderer?.company || '',
        '주문유형': getOrderTypeText(order.orderType),
        '상품수량': order.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0,
        '할인': (order.summary?.discount || 0).toLocaleString(),
        '포인트사용': (order.summary?.pointsUsed || 0).toLocaleString(),
        '포인트적립': (order.summary?.pointsEarned || 0).toLocaleString(),
        '고객등록여부': order.registerCustomer ? '예' : '아니오',
        '익명주문': order.isAnonymous ? '예' : '아니오'
      };
    });

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 열 너비 자동 조정 (업로드 템플릿 순서 + 추가 정보)
    const columnWidths = [
      // === 업로드 템플릿과 동일한 순서 ===
      { wch: 15 }, // 주문일시
      { wch: 12 }, // 지점명
      { wch: 50 }, // 주문상품
      { wch: 12 }, // 상품금액
      { wch: 10 }, // 배송비
      { wch: 12 }, // 결제수단
      { wch: 12 }, // 총금액
      { wch: 10 }, // 주문상태
      { wch: 10 }, // 결제상태
      { wch: 12 }, // 주문자명
      { wch: 15 }, // 주문자연락처
      { wch: 20 }, // 주문자이메일
      { wch: 10 }, // 수령방법
      { wch: 20 }, // 픽업/배송일시
      { wch: 12 }, // 수령인명
      { wch: 15 }, // 수령인연락처
      { wch: 30 }, // 배송주소
      { wch: 10 }, // 메세지타입
      { wch: 30 }, // 메세지내용
      { wch: 30 }, // 요청사항
      
      // === 업로드 템플릿에 없는 추가 정보들 ===
      { wch: 15 }, // 주문 ID
      { wch: 15 }, // 회사명
      { wch: 10 }, // 주문유형
      { wch: 10 }, // 상품수량
      { wch: 10 }, // 할인
      { wch: 12 }, // 포인트사용
      { wch: 12 }, // 포인트적립
      { wch: 12 }, // 고객등록여부
      { wch: 10 }, // 익명주문
    ];
    worksheet['!cols'] = columnWidths;

    // 워크시트를 워크북에 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, '주문내역');

    // 파일 다운로드 - 더 안전한 방법
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      compression: true
    });
    
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // 브라우저 호환성을 위한 다운로드 방법
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      // IE/Edge 지원
      window.navigator.msSaveOrOpenBlob(blob, `${filename}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
    } else {
      // 다른 브라우저 지원
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Excel export error:', error);
    throw new Error(`엑셀 파일 생성 중 오류가 발생했습니다: ${error.message}`);
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