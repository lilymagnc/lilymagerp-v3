
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import next from 'next';
import path from 'path';

// This is required for Genkit to work with Firebase Functions.
import { helloFlow } from './ai/flows/helloFlow.js';
import { processReceipt } from './ai/flows/receipt-processor.js';
export { helloFlow, processReceipt };

setGlobalOptions({ maxInstances: 10, region: 'us-central1' });

const nextServer = next({
  dev: false,
  conf: {
    distDir: path.join(process.cwd(), '.next'),
  },
});

const nextjsHandle = nextServer.getRequestHandler();

export const serverV2 = onRequest((req, res) => {
  return nextServer.prepare().then(() => nextjsHandle(req, res));
});
