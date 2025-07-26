
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

// Export the Next.js server as a single function named 'server'
exports.server = onRequest((req, res) => {
    return nextServer.prepare().then(() => nextjsHandle(req, res));
});

// AI flows are also exported from here
const aiFlows = require("./lib/ai/dev.js");
exports.processReceipt = aiFlows.processReceipt;
exports.helloFlow = aiFlows.helloFlow;
