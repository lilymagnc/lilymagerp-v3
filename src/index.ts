
import { https } from 'firebase-functions';
import { default as next } from 'next';

const nextServer = next({
  dev: false,
  conf: {
    distDir: '.next',
  },
});

const nextjsHandle = nextServer.getRequestHandler();

export const server = https.onRequest((req, res) => {
  return nextServer.prepare().then(() => nextjsHandle(req, res));
});
