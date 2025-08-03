// 구글 앱스크립트 - 주문 데이터 저장 서비스

/**
 * 주문 데이터를 시트에 추가하는 함수
 */
function addOrderToSheet(orderData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // 한국어 헤더가 있는지 확인하고 없으면 추가
  const headerRow = sheet.getRange(1, 1, 1, 20).getValues()[0];
  const expectedHeaders = [
    '주문일시', '지점명', '주문상품', '상품금액', '배송비', '결제수단', '총금액', 
    '주문상태', '결제상태', '주문자명', '주문자연락처', '주문자이메일', '수령방법', 
    '픽업/배송일시', '수령인명', '수령인연락처', '배송주소', '메세지타입', '메세지내용', '요청사항'
  ];
  
  // 헤더가 없으면 추가
  if (headerRow[0] !== '주문일시') {
    sheet.getRange(1, 1, 1, 20).setValues([expectedHeaders]);
  }
  
  // 주문 데이터를 배열로 변환
  const rowData = [
    orderData.orderDate || '',
    orderData.branchName || '',
    orderData.orderItems || '',
    orderData.itemPrice || 0,
    orderData.deliveryFee || 0,
    orderData.paymentMethod || '',
    orderData.totalAmount || 0,
    orderData.orderStatus || 'processing',
    orderData.paymentStatus || 'pending',
    orderData.ordererName || '',
    orderData.ordererContact || '',
    orderData.ordererEmail || '',
    orderData.deliveryMethod || 'pickup',
    orderData.pickupDate || '',
    orderData.recipientName || '',
    orderData.recipientContact || '',
    orderData.deliveryAddress || '',
    orderData.messageType || 'none',
    orderData.messageContent || '',
    orderData.specialRequests || ''
  ];
  
  // 데이터 추가
  sheet.appendRow(rowData);
  
  return { 
    success: true, 
    message: '주문 데이터가 성공적으로 저장되었습니다.',
    timestamp: new Date().toLocaleString('ko-KR')
  };
}

/**
 * 웹 앱으로 배포하기 위한 doPost 함수
 */
function doPost(e) {
  try {
    // CORS 헤더 설정
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    // 요청 데이터 파싱
    const orderData = JSON.parse(e.postData.contents);
    
    // 데이터 유효성 검사
    if (!orderData.ordererName || !orderData.branchName) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: '주문자명과 지점명은 필수입니다.' 
        }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }
    
    // 주문 데이터 저장
    const result = addOrderToSheet(orderData);
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
      
  } catch (error) {
    console.error('오류 발생:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: '데이터 처리 중 오류가 발생했습니다: ' + error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
}

/**
 * OPTIONS 요청 처리 (CORS)
 */
function doOptions(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  return ContentService
    .createTextOutput('')
    .setHeaders(headers);
}

/**
 * 테스트용 함수 - 샘플 데이터로 테스트
 */
function testAddOrder() {
  const testData = {
    orderDate: "2024-01-15 14:30",
    branchName: "강남점",
    orderItems: "장미 10송이, 튤립 5송이",
    itemPrice: 50000,
    deliveryFee: 3000,
    paymentMethod: "카드",
    totalAmount: 53000,
    orderStatus: "processing",
    paymentStatus: "pending",
    ordererName: "김철수",
    ordererContact: "010-1234-5678",
    ordererEmail: "kim@example.com",
    deliveryMethod: "pickup",
    pickupDate: "2024-01-16 15:00",
    recipientName: "",
    recipientContact: "",
    deliveryAddress: "",
    messageType: "card",
    messageContent: "생일 축하해요!",
    specialRequests: "특별한 포장 부탁드립니다."
  };
  
  const result = addOrderToSheet(testData);
  console.log('테스트 결과:', result);
  return result;
}

/**
 * 시트 초기화 함수 - 헤더만 있는 깨끗한 시트 생성
 */
function initializeSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // 기존 데이터 모두 삭제
  sheet.clear();
  
  // 한국어 헤더 추가
  const headers = [
    '주문일시', '지점명', '주문상품', '상품금액', '배송비', '결제수단', '총금액', 
    '주문상태', '결제상태', '주문자명', '주문자연락처', '주문자이메일', '수령방법', 
    '픽업/배송일시', '수령인명', '수령인연락처', '배송주소', '메세지타입', '메세지내용', '요청사항'
  ];
  
  sheet.getRange(1, 1, 1, 20).setValues([headers]);
  
  // 헤더 스타일링
  const headerRange = sheet.getRange(1, 1, 1, 20);
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  
  // 열 너비 자동 조정
  sheet.autoResizeColumns(1, 20);
  
  console.log('시트가 초기화되었습니다.');
  return { success: true, message: '시트가 성공적으로 초기화되었습니다.' };
}

/**
 * 모든 주문 데이터 조회 함수
 */
function getAllOrders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return { success: false, message: '저장된 주문 데이터가 없습니다.' };
  }
  
  const headers = data[0];
  const orders = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const order = {};
    
    headers.forEach((header, index) => {
      order[header] = row[index] || '';
    });
    
    orders.push(order);
  }
  
  return { 
    success: true, 
    count: orders.length,
    orders: orders 
  };
} 