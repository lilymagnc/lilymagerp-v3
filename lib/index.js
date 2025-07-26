"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverV2 = exports.processReceipt = exports.helloFlow = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const next_1 = __importDefault(require("next"));
const path_1 = __importDefault(require("path"));
// This is required for Genkit to work with Firebase Functions.
const helloFlow_js_1 = require("./ai/flows/helloFlow.js");
Object.defineProperty(exports, "helloFlow", { enumerable: true, get: function () { return helloFlow_js_1.helloFlow; } });
const receipt_processor_js_1 = require("./ai/flows/receipt-processor.js");
Object.defineProperty(exports, "processReceipt", { enumerable: true, get: function () { return receipt_processor_js_1.processReceipt; } });
(0, v2_1.setGlobalOptions)({ maxInstances: 10, region: 'us-central1' });
const nextServer = (0, next_1.default)({
    dev: false,
    conf: {
        distDir: path_1.default.join(process.cwd(), '.next'),
    },
});
const nextjsHandle = nextServer.getRequestHandler();
exports.serverV2 = (0, https_1.onRequest)((req, res) => {
    return nextServer.prepare().then(() => nextjsHandle(req, res));
});
