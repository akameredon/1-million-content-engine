import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExternalPrompt, parseExternalAiResponse } from '../src/externalAi.js';

test('external Gemini prompt includes the brief, allowed patterns, JSON schema, and originality rules', () => {
  const prompt = buildExternalPrompt({ topic: 'cash flow', idea: 'track money in and out', audience: 'small businesses', category: 'Business', count: 3, patternId: 'auto' });
  assert.match(prompt, /cash flow/);
  assert.match(prompt, /track money in and out/);
  assert.match(prompt, /Do not copy existing posts/);
  assert.match(prompt, /"posts"/);
  assert.match(prompt, /"patternId"/);
  assert.match(prompt, /3/);
});

test('external Gemini response imports drafts with validated pattern provenance', () => {
  const posts = parseExternalAiResponse(JSON.stringify({ posts: [
    { text: 'Track cash flow weekly and compare expected receipts with actual payments.', angle: 'simple routine', patternId: 'plain-language-explainer' },
    { text: 'Before changing a budget, review the evidence in your recent transactions.', angle: 'evidence lens', patternId: 'evidence-first-teacher' },
  ] }), { category: 'Business', audience: 'small businesses' });
  assert.equal(posts.length, 2);
  assert.equal(posts[0].category, 'Business');
  assert.equal(posts[0].generationMethod, 'external-ai');
  assert.equal(posts[1].patternId, 'evidence-first-teacher');
  assert.ok(posts[1].sourceIds.length);
});

test('external Gemini response accepts fenced JSON and rejects invalid pattern attribution', () => {
  const posts = parseExternalAiResponse('```json\n{"posts":[{"text":"A clear educational post with a useful lesson.","patternId":"plain-language-explainer"}]}\n```');
  assert.equal(posts.length, 1);
  assert.throws(() => parseExternalAiResponse('{"posts":[{"text":"Draft","patternId":"made-up"}]}'), /unknown pattern ID/);
  assert.throws(() => parseExternalAiResponse('not JSON'), /Could not read valid JSON/);
  assert.throws(() => parseExternalAiResponse('{"posts":[]}'), /non-empty/);
});
