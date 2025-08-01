"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.processReceipt = processReceipt;
/**
 * @fileOverview An AI agent for processing receipts to update stock.
 *
 * - processReceipt - A function that handles parsing receipt text or image.
 * - ReceiptProcessInput - The input type for the processReceipt function.
 * - ReceiptProcessOutput - The return type for the processReceipt function.
 */
const genkit_1 = require("@/ai/genkit");
const genkit_2 = require("genkit");
// Mock data of available materials. In a real app, this would be fetched from the database.
const AVAILABLE_MATERIALS = [
    "마르시아 장미", "레드 카네이션", "몬스테라", "만천홍", "포장용 크라프트지", "유칼립투스"
];
const ReceiptProcessInputSchema = genkit_2.z.object({
    receiptText: genkit_2.z.string().optional().describe('The text content of a receipt or an order slip.'),
    photoDataUri: genkit_2.z.string().optional().describe("A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
const ProcessedItemSchema = genkit_2.z.object({
    itemName: genkit_2.z.string().describe('The name of the material found on the receipt. Must be one of the available materials.'),
    quantity: genkit_2.z.number().describe('The quantity of the material.'),
});
const ReceiptProcessOutputSchema = genkit_2.z.object({
    items: genkit_2.z.array(ProcessedItemSchema).describe('A list of materials and their quantities parsed from the receipt.'),
});
async function processReceipt(input) {
    return processReceiptFlow(input);
}
const prompt = genkit_1.ai.definePrompt({
    name: 'receiptProcessPrompt',
    input: { schema: genkit_2.z.object({
            receiptText: genkit_2.z.string().optional(),
            photoDataUri: genkit_2.z.string().optional(),
            availableMaterials: genkit_2.z.array(genkit_2.z.string()),
        }) },
    output: { schema: ReceiptProcessOutputSchema },
    prompt: `You are an expert inventory manager for a flower shop.
Your task is to parse the provided receipt information and identify the materials and quantities being stocked.

The receipt information is as follows:
---
{{#if receiptText}}
Receipt Text:
{{{receiptText}}}
{{/if}}
{{#if photoDataUri}}
Receipt Photo:
{{media url=photoDataUri}}
{{/if}}
---

Here is a list of available materials in our inventory:
{{#each availableMaterials}}
- {{{this}}}
{{/each}}

Please analyze the receipt information and extract each material and its corresponding quantity.
The item name in your output MUST EXACTLY MATCH one of the names from the available materials list.
If you cannot find a matching material or a quantity for an item, ignore it.
Respond with a list of processed items in the specified JSON format.
`,
});
const processReceiptFlow = genkit_1.ai.defineFlow({
    name: 'processReceiptFlow',
    inputSchema: ReceiptProcessInputSchema,
    outputSchema: ReceiptProcessOutputSchema,
}, async (input) => {
    if (!input.receiptText && !input.photoDataUri) {
        throw new Error("Either receiptText or photoDataUri must be provided.");
    }
    const { output } = await prompt({
        ...input,
        availableMaterials: AVAILABLE_MATERIALS,
    });
    if (!output) {
        return { items: [] };
    }
    return output;
});
