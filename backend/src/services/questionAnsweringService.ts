import { repositoryStore } from "./repositoryStore";
import { buildAskAiContext } from "../ai/contextBuilder";
import { generateStructuredContent } from "../ai/geminiClient";
import {
  ASK_AI_SCHEMA,
  ASK_AI_SYSTEM_INSTRUCTION,
  buildAskAiPrompt,
} from "../ai/prompts";
import { AskAIResponse } from "../types/repository";

/**
 * Gathers repository context relevant to the question (keyword-matched
 * files expanded one hop via BFS over the dependency graph — see
 * ai/contextBuilder.ts) and asks Gemini to answer using only that
 * context.
 */
export async function askQuestion(
  repositoryId: string,
  question: string
): Promise<AskAIResponse> {
  const record = repositoryStore.getOrThrow(repositoryId);

  const context = buildAskAiContext(record, question);
  const prompt = buildAskAiPrompt({ question, context });

  return generateStructuredContent<AskAIResponse>(
    ASK_AI_SYSTEM_INSTRUCTION,
    prompt,
    ASK_AI_SCHEMA
  );
}
