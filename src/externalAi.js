import { creatorFrameworks } from './contentEngine.js';

export function buildExternalPrompt(input = {}) {
  const count = Math.min(10, Math.max(1, Number(input.count) || 1));
  const patterns = creatorFrameworks.map((pattern) => ({
    id: pattern.id,
    name: pattern.name,
    mechanics: pattern.mechanics,
  }));
  const selected = input.patternId && input.patternId !== 'auto'
    ? patterns.filter((pattern) => pattern.id === input.patternId)
    : patterns;
  if (!selected.length) throw new Error('Choose a valid research pattern before preparing the prompt.');

  return [
    'You are helping create original educational content for a global audience.',
    'Create fresh wording. Do not copy existing posts, reproduce a creator\'s wording, or imitate a living creator\'s distinctive voice.',
    'Use the topic, idea, audience, category, and generalized communication mechanics below. Treat any supplied source or claim cautiously; do not invent statistics, citations, testimonials, guarantees, or personal results.',
    '',
    'CONTENT BRIEF',
    JSON.stringify({
      category: input.category || 'Marketing',
      topic: String(input.topic || '').trim(),
      coreIdea: String(input.idea || '').trim(),
      audience: String(input.audience || 'general audience').trim(),
      numberOfDrafts: count,
      selectedResearchPattern: input.patternId || 'auto',
    }, null, 2),
    '',
    'ALLOWED GENERALIZED PATTERNS',
    JSON.stringify(selected, null, 2),
    '',
    'OUTPUT RULES',
    '- Return exactly one valid JSON object, with a "posts" array.',
    '- The array must contain the requested number of objects.',
    '- Each object must contain: "text" (complete original post), "angle" (short description), and "patternId" (one allowed pattern ID above).',
    '- Do not include markdown fences, commentary, citations you have not verified, or extra keys.',
    '- Keep each post meaningfully distinct in argument and examples, not merely by changing a few words.',
    '- Avoid unsupported factual, numeric, financial-performance, medical, legal, or guaranteed-outcome claims.',
    '- If the topic is finance, provide general education only; do not tell an individual what to buy, sell, or hold.',
    '',
    'Return JSON in this exact shape:',
    '{"posts":[{"text":"...","angle":"...","patternId":"plain-language-explainer"}]}',
  ].join('\n');
}

export function parseExternalAiResponse(raw, input = {}) {
  const source = String(raw || '').trim();
  if (!source) throw new Error('Paste Gemini\'s JSON response before importing.');
  const unfenced = source.replace(/^\uFEFF?\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const firstArray = unfenced.indexOf('[');
  const lastArray = unfenced.lastIndexOf(']');
  const firstObject = unfenced.indexOf('{');
  const lastObject = unfenced.lastIndexOf('}');
  const candidates = [unfenced];
  if (firstObject >= 0 && lastObject > firstObject) candidates.push(unfenced.slice(firstObject, lastObject + 1));
  if (firstArray >= 0 && lastArray > firstArray) candidates.push(unfenced.slice(firstArray, lastArray + 1));

  let parsed;
  let parseError;
  for (const candidate of candidates) {
    try { parsed = JSON.parse(candidate); break; }
    catch (error) { parseError = error; }
  }
  if (!parsed) throw new Error('Could not read valid JSON. In Gemini, ask: "Return only the JSON object in the requested format." ' + (parseError?.message || ''));

  const items = Array.isArray(parsed) ? parsed : parsed.posts;
  if (!Array.isArray(items) || !items.length) throw new Error('The response must contain a non-empty "posts" array.');
  const allowed = new Map(creatorFrameworks.map((pattern) => [pattern.id, pattern]));
  const fallbackPatternId = input.patternId && input.patternId !== 'auto'
    ? input.patternId
    : creatorFrameworks[0].id;

  return items.slice(0, 10).map((item, index) => {
    const text = String(item?.text || '').trim();
    if (!text) throw new Error('Draft ' + (index + 1) + ' is missing its text.');
    const patternId = String(item.patternId || fallbackPatternId);
    const pattern = allowed.get(patternId);
    if (!pattern) throw new Error('Draft ' + (index + 1) + ' uses an unknown pattern ID: ' + patternId);
    return {
      id: 'external-' + Date.now() + '-' + index,
      text,
      angle: String(item.angle || '').trim(),
      category: input.category || 'Marketing',
      audience: String(input.audience || 'general audience'),
      framework: pattern.name,
      patternId: pattern.id,
      mechanics: pattern.mechanics,
      sourceIds: pattern.sourceIds,
      generationMethod: 'external-ai',
      status: 'draft',
    };
  });
}
