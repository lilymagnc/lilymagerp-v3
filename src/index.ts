
import {https, setGlobalOptions} from 'firebase-functions/v2';
import {defineString} from 'firebase-functions/params';
import next from 'next';
import path from 'path';

setGlobalOptions({maxInstances: 10});

// Define parameters for Firebase app config
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
