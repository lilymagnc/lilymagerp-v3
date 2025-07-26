
/**
 * This file is the entry point for your Firebase Functions.
 * It uses the Next.js server as the handler for HTTP requests and also exports
 * any Genkit flows you have defined.
 */
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import next from "next";

// Import your Genkit flows here. Make sure to use the .js extension.
import { helloFlow } from "./lib/ai/flows/helloFlow.js";
import { processReceipt } from "./lib/ai/flows/receipt-processor.js";


// Set global options for all functions
setGlobalOptions({ maxInstances: 10, region: "us-central1" });

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// HTTP function to handle all requests to the Next.js app
export const serverV2 = onRequest((req, res) => {
  return app.prepare().then(() => handle(req, res));
});

// Export Genkit flows to be deployed as Firebase Functions
export { helloFlow, processReceipt };
