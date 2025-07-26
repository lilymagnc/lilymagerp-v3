
import {https, setGlobalOptions} from 'firebase-functions/v2';
import {defineString} from 'firebase-functions/params';
import next from 'next';
import path from 'path';

setGlobalOptions({maxInstances: 10});

// Firebase 프로젝트 설정 값들을 환경 변수로 정의합니다.
// .env 파일에 이 값들이 정의되어 있으면, 배포 시 자동으로 로드됩니다.
defineString('NEXT_PUBLIC_FIREBASE_API_KEY');
defineString('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
defineString('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
defineString('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
defineString('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
defineString('NEXT_PUBLIC_FIREBASE_APP_ID');

const nextjsDistDir = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  '.next'
);

const nextServer = next({
  dev: false,
  conf: {
    distDir: nextjsDistDir,
  },
});

const nextjsHandle = nextServer.getRequestHandler();

export const server = https.onRequest((req, res) => {
  return nextServer.prepare().then(() => nextjsHandle(req, res));
});
