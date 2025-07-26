
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const next = require("next");
const { processReceipt } = require("./lib/ai/flows/receipt-processor");
const { helloFlow } = require("./lib/ai/flows/helloFlow");

// AI 플로우 export
exports.processReceipt = processReceipt;
exports.helloFlow = helloFlow;

setGlobalOptions({ region: "us-central1" });

const nextjsServer = next({
  dev: false,
  // Next.js 빌드 결과물(standalone)의 위치를 올바르게 지정합니다.
  conf: { distDir: ".next" },
});
const nextjsHandle = nextjsServer.getRequestHandler();

exports.web = onRequest(
  {
    // Cloud Function의 메모리를 증가시켜 안정성을 확보합니다.
    memory: "1GiB",
  },
  (req, res) => {
    return nextjsServer.prepare().then(() => nextjsHandle(req, res));
  }
);
