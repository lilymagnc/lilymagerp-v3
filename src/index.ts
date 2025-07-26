
// This is required for Genkit to work with Firebase Functions.
import { helloFlow } from './ai/flows/helloFlow.js';
import { processReceipt } from './ai/flows/receipt-processor.js';

export { helloFlow, processReceipt };
