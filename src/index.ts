
// This file is the entry point for Firebase Functions.
// It configures the Next.js server to run as a function and exports AI flows.

import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import next from 'next';
import path from 'path';
import { processReceipt } from "./ai/flows/receipt-processor.js";
import { helloFlow } from "./ai/flows/helloFlow.js";

// Set global options for Firebase Functions
setGlobalOptions({ maxInstances: 10, region: 'us-central1' });

const nextjsDistDir = path.join(__dirname, '../.next');

const nextServer = next({
    dev: false,
    conf: {
        distDir: nextjsDistDir,
    },
});

const nextjsHandle = nextServer.getRequestHandler();

// Export the Next.js server as a Firebase Function
export const server = onRequest((req, res) => {
    return nextServer.prepare().then(() => nextjsHandle(req, res));
});

// Export the AI flows
export {
    processReceipt,
    helloFlow
};
