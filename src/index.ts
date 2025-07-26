
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import next from "next";
import { helloFlow } from "./ai/flows/helloFlow.js";
import { processReceipt } from "./ai/flows/receipt-processor.js";

setGlobalOptions({ maxInstances: 10, region: "us-central1" });

const server = next({
  dev: false,
  hostname: "localhost",
  port: 3000,
});

const nextjsHandle = server.getRequestHandler();

export const api = onRequest({ region: "us-central1" }, (req, res) => {
  return server.prepare().then(() => nextjsHandle(req, res));
});

export { helloFlow, processReceipt };
