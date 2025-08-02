// 구글 시트 API를 사용하여 데이터를 저장하는 서비스

interface GoogleSheetsConfig {
  spreadsheetId: string;
  apiKey: string;
  range: string;
}

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

export class GoogleSheetsService {
  private config: GoogleSheetsConfig;

  constructor(config: GoogleSheetsConfig) {
    this.config = config;
  }

  /**
   * 주문 데이터를 구글 시트에 저장
   */
  async saveOrderToSheet(orderData: OrderData): Promise<boolean> {
    try {
      const values = [
        [
          orderData.orderDate,
          orderData.branchName,
          orderData.orderItems,
          orderData.itemPrice,
          orderData.deliveryFee,
          orderData.paymentMethod,
          orderData.totalAmount,
          orderData.orderStatus,
          orderData.paymentStatus,
          orderData.ordererName,
          orderData.ordererContact,
          orderData.ordererEmail,
          orderData.deliveryMethod,
          orderData.pickupDate,
          orderData.recipientName,
          orderData.recipientContact,
          orderData.deliveryAddress,
          orderData.messageType,
          orderData.messageContent,
          orderData.specialRequests
        ]
      ];

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${this.config.range}:append?valueInputOption=RAW&key=${this.config.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values
        })
      });

      if (!response.ok) {
        throw new Error(`구글 시트 저장 실패: ${response.statusText}`);
      }

      return true;
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

  /**
   * 구글 시트에서 데이터 읽기
   */
  async readFromSheet(): Promise<any[][]> {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${this.config.range}?key=${this.config.apiKey}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`구글 시트 읽기 실패: ${response.statusText}`);
      }

      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('구글 시트 읽기 오류:', error);
      return [];
    }
  }
}

/**
 * 환경 변수에서 구글 시트 설정 가져오기
 */
export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  return {
    spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID || '',
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY || '',
    range: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_RANGE || 'Sheet1!A:T'
  };
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