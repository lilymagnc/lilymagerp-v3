import { SystemSettings } from '@/hooks/use-settings';

// 이메일 템플릿에서 변수를 실제 값으로 치환하는 함수
export function replaceTemplateVariables(template: string, variables: Record<string, string | number>): string {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value));
  });
  
  return result;
}

// 배송완료 이메일 발송
export async function sendDeliveryCompleteEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  deliveryDate: string,
  settings: SystemSettings
): Promise<boolean> {
  if (!settings.autoEmailDeliveryComplete) {
    return false;
  }

  try {
    const emailContent = replaceTemplateVariables(settings.emailTemplateDeliveryComplete, {
      고객명: customerName,
      주문번호: orderNumber,
      배송일: deliveryDate,
      회사명: settings.siteName
    });

    // 실제 이메일 발송 로직 (Firebase Functions 또는 외부 이메일 서비스 사용)
    await sendEmail(customerEmail, `${settings.siteName} - 배송완료 알림`, emailContent);
    
    console.log('배송완료 이메일 발송 완료:', customerEmail);
    return true;
  } catch (error) {
    console.error('배송완료 이메일 발송 실패:', error);
    return false;
  }
}

// 주문확인 이메일 발송
export async function sendOrderConfirmEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  orderDate: string,
  totalAmount: number,
  settings: SystemSettings
): Promise<boolean> {
  if (!settings.autoEmailOrderConfirm) {
    return false;
  }

  try {
    const emailContent = replaceTemplateVariables(settings.emailTemplateOrderConfirm, {
      고객명: customerName,
      주문번호: orderNumber,
      주문일: orderDate,
      총금액: totalAmount.toLocaleString(),
      회사명: settings.siteName
    });

    await sendEmail(customerEmail, `${settings.siteName} - 주문확인`, emailContent);
    
    console.log('주문확인 이메일 발송 완료:', customerEmail);
    return true;
  } catch (error) {
    console.error('주문확인 이메일 발송 실패:', error);
    return false;
  }
}

// 상태변경 이메일 발송
export async function sendStatusChangeEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  previousStatus: string,
  currentStatus: string,
  settings: SystemSettings
): Promise<boolean> {
  if (!settings.autoEmailStatusChange) {
    return false;
  }

  try {
    const emailContent = replaceTemplateVariables(settings.emailTemplateStatusChange, {
      고객명: customerName,
      주문번호: orderNumber,
      이전상태: previousStatus,
      현재상태: currentStatus,
      회사명: settings.siteName
    });

    await sendEmail(customerEmail, `${settings.siteName} - 주문상태 변경 알림`, emailContent);
    
    console.log('상태변경 이메일 발송 완료:', customerEmail);
    return true;
  } catch (error) {
    console.error('상태변경 이메일 발송 실패:', error);
    return false;
  }
}

// 생일축하 이메일 발송
export async function sendBirthdayEmail(
  customerEmail: string,
  customerName: string,
  settings: SystemSettings
): Promise<boolean> {
  if (!settings.autoEmailBirthday) {
    return false;
  }

  try {
    const emailContent = replaceTemplateVariables(settings.emailTemplateBirthday, {
      고객명: customerName,
      회사명: settings.siteName
    });

    await sendEmail(customerEmail, `${settings.siteName} - 생일 축하드립니다!`, emailContent);
    
    console.log('생일축하 이메일 발송 완료:', customerEmail);
    return true;
  } catch (error) {
    console.error('생일축하 이메일 발송 실패:', error);
    return false;
  }
}

// 실제 이메일 발송 함수 (Firebase Functions 또는 외부 서비스 연동)
async function sendEmail(to: string, subject: string, content: string): Promise<void> {
  // 여기에 실제 이메일 발송 로직을 구현
  // 예: Firebase Functions, SendGrid, AWS SES 등
  
  // 현재는 콘솔에 출력만 (실제 구현 시 교체)
  console.log('이메일 발송:', {
    to,
    subject,
    content
  });
  
  // 실제 구현 예시:
  // const response = await fetch('/api/send-email', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ to, subject, content })
  // });
  // 
  // if (!response.ok) {
  //   throw new Error('이메일 발송 실패');
  // }
}

// 메시지 스타일 적용 함수
export function applyMessageStyle(message: string, settings: SystemSettings): string {
  return `
    <div style="
      font-family: '${settings.messageFont}', sans-serif;
      font-size: ${settings.messageFontSize}px;
      color: ${settings.messageColor};
    ">
      ${message}
    </div>
  `;
} 