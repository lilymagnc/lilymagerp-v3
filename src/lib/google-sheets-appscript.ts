// 구글 앱스크립트를 사용하여 데이터를 저장하는 서비스

interface OrderData {
  id: string;
  orderDate: string;
  branchName: string;
  orderItems: string;
  itemPrice: number;
  deliveryFee: number;
  paymentMethod: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  ordererName: string;
  ordererContact: string;
  ordererEmail: string;
  deliveryMethod: string;
  pickupDate: string;
  recipientName: string;
  recipientContact: string;
  deliveryAddress: string;
  messageType: string;
  messageContent: string;
  specialRequests: string;
}

export class GoogleSheetsAppScriptService {
  private webAppUrl: string;

  constructor(webAppUrl: string) {
    this.webAppUrl = webAppUrl;
  }

  /**
   * 주문 데이터를 구글 시트에 저장 (앱스크립트 방식)
   */
  async saveOrderToSheet(orderData: OrderData): Promise<boolean> {
    try {
      console.log('구글 앱스크립트 서비스 - 저장 시작');
      console.log('웹앱 URL:', this.webAppUrl);
      console.log('전송할 데이터:', orderData);

      const response = await fetch(this.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      console.log('응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('응답 오류:', errorText);
        throw new Error(`구글 시트 저장 실패: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('응답 결과:', result);
      return result.success === true;
    } catch (error) {
      console.error('구글 시트 저장 오류:', error);
      return false;
    }
  }

  /**
   * 여러 주문 데이터를 일괄 저장
   */
  async saveMultipleOrdersToSheet(ordersData: OrderData[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const orderData of ordersData) {
      const result = await this.saveOrderToSheet(orderData);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }
}

/**
 * 환경 변수에서 구글 앱스크립트 웹앱 URL 가져오기
 */
export function getGoogleAppScriptConfig(): { webAppUrl: string } {
  const webAppUrl = process.env.NEXT_PUBLIC_GOOGLE_APPSCRIPT_WEBAPP_URL || '';
  console.log('구글 앱스크립트 설정:', { webAppUrl });
  return { webAppUrl };
}

/**
 * 주문 데이터를 구글 시트 형식으로 변환
 */
export function convertOrderToSheetFormat(order: any): OrderData {
  return {
    id: order.id,
    orderDate: order.orderDate ? new Date(order.orderDate.toDate()).toLocaleString('ko-KR') : '',
    branchName: order.branchName || '',
    orderItems: order.items?.map((item: any) => item.name).join(', ') || '',
    itemPrice: order.summary?.subtotal || 0,
    deliveryFee: order.summary?.deliveryFee || 0,
    paymentMethod: order.payment?.method || '',
    totalAmount: order.summary?.total || 0,
    orderStatus: order.status || '',
    paymentStatus: order.payment?.status || '',
    ordererName: order.orderer?.name || '',
    ordererContact: order.orderer?.contact || '',
    ordererEmail: order.orderer?.email || '',
    deliveryMethod: order.delivery?.method || '',
    pickupDate: order.delivery?.pickupDate ? new Date(order.delivery.pickupDate.toDate()).toLocaleString('ko-KR') : '',
    recipientName: order.delivery?.recipient?.name || '',
    recipientContact: order.delivery?.recipient?.contact || '',
    deliveryAddress: order.delivery?.address || '',
    messageType: order.message?.type || '',
    messageContent: order.message?.content || '',
    specialRequests: order.specialRequests || ''
  };
} 