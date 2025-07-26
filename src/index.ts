// This file is the entry point for Firebase Functions.
// It configures the Next.js server to run as a function and exports AI flows.

import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import next from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

// AI flows are dynamically imported and re-exported.
import * as aiFlows from './ai/dev.js';

// Set global options for Firebase Functions
setGlobalOptions({ maxInstances: 10, region: 'us-central1' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextjsDistDir = path.join(__dirname, '../.next');

const nextServer = next({
    dev: false,
    conf: {
        distDir: nextjsDistDir,
    },
});

const nextjsHandle = nextServer.getRequestHandler();

// Export the Next.js server as a Firebase Function called 'server'.
export const server = onRequest((req, res) => {
    return nextServer.prepare().then(() => nextjsHandle(req, res));
});

// Export all AI flows from the dynamically imported module.
export const { processReceipt, helloFlow } = aiFlows;
