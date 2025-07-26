// This file is the entry point for Firebase Functions.
// AI flows are exported from here.

import { processReceipt } from "./ai/flows/receipt-processor";
import { helloFlow } from "./ai/flows/helloFlow";

// Export the AI flows
export {
    processReceipt,
    helloFlow
};
