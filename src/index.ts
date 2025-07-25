
import { https } from 'firebase-functions';
import { default as next } from 'next';
import { defineString } from 'firebase-functions/params';

// Define parameters for Firebase app config
defineString('NEXT_PUBLIC_FIREBASE_API_KEY');
defineString('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
defineString('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
defineString('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
defineString('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
defineString('NEXT_PUBLIC_FIREBASE_APP_ID');

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
