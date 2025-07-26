// This file is the entry point for Firebase Functions.
// AI flows are exported from here.

import { processReceipt } from "./ai/flows/receipt-processor";
import { helloFlow } from "./ai/flows/helloFlow";

// Export the AI flows
export {
    processReceipt,
    helloFlow
};

// The following is for the Next.js app
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const next = require("next");
const path = require("path");

setGlobalOptions({ maxInstances: 10, region: 'us-central1' });

const nextjsDistDir = path.join(__dirname, ".next");

const nextServer = next({
    dev: false,
    conf: {
        distDir: nextjsDistDir,
    },
});
const nextjsHandle = nextServer.getRequestHandler();

exports.server = onRequest((req: any, res: any) => {
    return nextServer.prepare().then(() => nextjsHandle(req, res));
});
