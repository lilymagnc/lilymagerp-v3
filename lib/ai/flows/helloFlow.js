"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloFlow = helloFlow;
/**
 * @fileOverview A simple "Hello World" flow to test Genkit.
 */
const genkit_1 = require("@/ai/genkit");
const genkit_2 = require("genkit");
const HelloInputSchema = genkit_2.z.object({
    name: genkit_2.z.string().describe("The name of the person to greet."),
});
const HelloOutputSchema = genkit_2.z.object({
    greeting: genkit_2.z.string().describe("The AI-generated greeting."),
});
async function helloFlow(name) {
    const output = await helloGenkitFlow({ name });
    return output.greeting;
}
const prompt = genkit_1.ai.definePrompt({
    name: 'helloPrompt',
    input: { schema: HelloInputSchema },
    output: { schema: HelloOutputSchema },
    prompt: `Please generate a short, friendly greeting for {{name}}.`,
});
const helloGenkitFlow = genkit_1.ai.defineFlow({
    name: 'helloGenkitFlow',
    inputSchema: HelloInputSchema,
    outputSchema: HelloOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    return output ?? { greeting: `Hello, ${input.name}!` };
});
