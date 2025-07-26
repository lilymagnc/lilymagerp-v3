// AI 플로우를 가져옵니다.
import './ai/dev';

// Firebase Functions V2를 사용하여 플로우를 HTTP 요청으로 노출할 수 있습니다.
// 예를 들어, helloFlow를 HTTP 엔드포인트로 노출하려면 다음과 같이 작성합니다.
/*
import { onCall } from 'firebase-functions/v2/https';
import { helloFlow } from './ai/flows/helloFlow';

export const hello = onCall(async (request) => {
    if (!request.data.name) {
        throw new Error("No name provided.");
    }
    return await helloFlow(request.data.name);
});
*/

// 현재는 AI 플로우가 genkit CLI를 통해 배포되도록 설정되어 있습니다.
// HTTP 엔드포인트가 필요한 경우 위 주석을 참고하여 추가할 수 있습니다.
