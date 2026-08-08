import test from 'node:test';
import assert from 'node:assert/strict';
import { formatGeminiError } from '../src/ai/geminiClient';

test('formatGeminiError explains quota exhaustion without leaking raw API text', () => {
  const error = {
    message:
      'You exceeded your current quota, please check your plan and billing details. ... RESOURCE_EXHAUSTED',
    status: 'RESOURCE_EXHAUSTED',
    code: 429,
  };

  assert.equal(
    formatGeminiError(error),
    'Gemini API quota has been exhausted. Please check your plan, billing, or API limits and try again later.'
  );
});

test('formatGeminiError keeps a safe fallback for unknown Gemini failures', () => {
  const error = { message: 'something unexpected happened' };

  assert.equal(
    formatGeminiError(error),
    'Gemini API request failed. Please try again in a moment.'
  );
});
