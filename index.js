
// This file is the entry point for Firebase Functions.
// AI flows are exported from here.

const { processReceipt } = require("./lib/ai/flows/receipt-processor");
const { helloFlow } = require("./lib/ai/flows/helloFlow");

exports.processReceipt = processReceipt;
exports.helloFlow = helloFlow;
