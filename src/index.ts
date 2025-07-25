
import { https } from 'firebase-functions';
import { default as next } from 'next';

const server = next({
  dev: false,
  conf: {
    distDir: '.next',
  },
});

const nextjsHandle = server.getRequestHandler();

export const server = https.onRequest((req, res) => {
  return server.prepare().then(() => nextjsHandle(req, res));
});
