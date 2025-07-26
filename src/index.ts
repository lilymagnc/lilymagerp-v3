
import {https, setGlobalOptions} from 'firebase-functions/v2';
import next from 'next';
import path from 'path';

// 2세대 함수를 위한 전역 옵션 설정
setGlobalOptions({maxInstances: 10, region: 'us-central1'});

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
