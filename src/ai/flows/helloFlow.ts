
'use server';
/**
 * @fileOverview A simple "Hello World" flow to test Genkit.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const HelloInputSchema = z.object({
    name: z.string().describe("The name of the person to greet."),
});

const HelloOutputSchema = z.object({
    greeting: z.string().describe("The AI-generated greeting."),
});

export async function helloFlow(name: string): Promise<string> {
    const { output } = await helloGenkitFlow({ name });
    return output?.greeting ?? "No greeting generated.";
}

const prompt = ai.definePrompt({
  name: 'helloPrompt',
  input: { schema: HelloInputSchema },
  output: { schema: HelloOutputSchema },
  prompt: `Please generate a short, friendly greeting for {{name}}.`,
});

const helloGenkitFlow = ai.defineFlow(
  {
    name: 'helloGenkitFlow',
    inputSchema: HelloInputSchema,
    outputSchema: HelloOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return { greeting: output?.greeting ?? `Hello, ${input.name}!` };
  }
);
