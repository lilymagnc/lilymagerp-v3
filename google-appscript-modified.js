const SHEET_NAME = "주문내역";
const HEADERS = [
    "주문일시", "지점명", "주문상품", "상품금액", "배송비", "결제수단", "총금액", 
    "주문상태", "결제상태", "주문자명", "주문자연락처", "주문자이메일", "수령방법", 
    "픽업/배송일시", "수령인명", "수령인연락처", "배송주소", "메세지타입", "메세지내용", "요청사항"
];

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  
  // 시트가 존재하지만 비어있는 경우(헤더가 없는 경우) 헤더 추가
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  
  return sheet;
}

function doPost(e) {
  try {
    const sheet = getOrCreateSheet();
    
    // JSON 데이터 파싱
    const orderData = JSON.parse(e.postData.contents);

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
    
    sheet.appendRow(rowData);

    return ContentService.createTextOutput(JSON.stringify({ 
      "success": true, 
      "message": "주문 데이터가 성공적으로 저장되었습니다." 
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

  } catch (error) {
    Logger.log(error.toString());
    return ContentService.createTextOutput(JSON.stringify({ 
      "success": false, 
      "error": error.toString() 
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
  }
}

function doOptions(e) {
  return ContentService.createTextOutput('')
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
} 