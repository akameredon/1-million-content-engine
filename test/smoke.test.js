import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { assessPosts, generatePosts, toCsv } from '../src/contentEngine.js';
import { composeContentDNA, contentDnaDimensions, scoreDiversity } from '../src/contentDNA.js';
import { assessPosts as assessQuality, summarizeQuality } from '../src/qualityEngine.js';
import { creatorProfiles, researchPatterns, researchSources } from '../src/researchLibrary.js';
import { createEvidenceRecord, getEvidenceReadiness, getPublicationReadiness, reviewEvidence } from '../src/evidenceEngine.js';
import geminiHandler from '../api/generate.js';
import { generateAiPosts, getAiServiceStatus } from '../src/aiGeneration.js';

const root = new URL('../', import.meta.url);

test('project has its required app entry points', async () => {
  for (const path of ['index.html', 'src/main.jsx', 'src/App.jsx', 'src/style.css', 'src/contentEngine.js', 'src/aiGeneration.js', 'api/generate.js']) await access(new URL(path, root));
});

test('package identity and scripts are configured for this product', async () => {
  const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  assert.equal(pkg.name, '1-million-content-engine');
  assert.equal(pkg.scripts.build, 'vite build');
  assert.equal(pkg.scripts.test, 'node --test');
  assert.equal(pkg.engines.node, '>=22.13.0');
});

test('generator creates distinct drafts with framework metadata and enforces batch cap', () => {
  const posts = generatePosts({ topic: 'personal finance', idea: 'build an emergency fund', count: 30 });
  assert.equal(posts.length, 30);
  assert.equal(new Set(posts.map((post) => post.text)).size, 30);
  assert.ok(posts.every((post) => post.framework && post.mechanics.length));
  assert.equal(generatePosts({ topic: 'finance', idea: 'budgeting', count: 9000 }).length, 5000);
});

test('generator validates required inputs', () => {
  assert.throws(() => generatePosts({ topic: '', idea: 'test' }), /topic and a core idea/);
});

test('quality checks flag duplicate and unsupported numeric claims for review', () => {
  const checked = assessPosts([
    { text: 'This is a sufficiently detailed post that includes a 100% certain result and should be reviewed.' },
    { text: 'This is a sufficiently detailed post that includes a 100% certain result and should be reviewed.' },
  ]);
  assert.equal(checked[0].quality, 'review');
  assert.ok(checked[0].issues.includes('Potentially misleading claim'));
  assert.ok(checked[1].issues.includes('Duplicate'));
});

test('CSV export quotes content safely', () => {
  const csv = toCsv([{ text: 'Say "hello", creator', category: 'Marketing', audience: 'teams', framework: 'Story', status: 'draft', quality: 'ready', issues: [] }]);
  assert.match(csv, /""hello""/);
  assert.match(csv, /text,category,audience/);
});

test('the React app renders the actual content generation workflow', async () => {
  const server = await createServer({
    configFile: new URL('../vite.config.js', import.meta.url).pathname,
    root: new URL('../', import.meta.url).pathname,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  });
  try {
    const { default: App } = await server.ssrLoadModule('/src/App.jsx');
    const html = renderToStaticMarkup(createElement(App));
    assert.match(html, /One idea/);
    assert.match(html, /Generate original drafts/);
    assert.match(html, /AI-assisted/);
    assert.match(html, /Communication frameworks/);
    assert.match(html, /Export CSV/);
  } finally { await server.close(); }
});

test('creator intelligence records cite public sources and disclose research limits', () => {
  assert.equal(creatorProfiles.length, 5);
  assert.equal(researchPatterns.length, 5);
  assert.equal(researchSources.length, 5);
  const sourceIds = new Set(researchSources.map((source) => source.id));
  assert.ok(creatorProfiles.every((creator) => sourceIds.has(creator.sourceId) && creator.limitation));
  assert.ok(researchPatterns.every((pattern) => pattern.sourceIds.length > 0 && pattern.mechanics.length >= 3));
});

test('generator applies a selected research pattern and preserves source traceability', () => {
  const posts = generatePosts({ topic: 'customer acquisition', idea: 'test one channel and measure qualified leads', audience: 'new founders', patternId: 'evidence-first-teacher', count: 12 });
  assert.equal(posts.length, 12);
  assert.ok(posts.every((post) => post.patternId === 'evidence-first-teacher'));
  assert.ok(posts.every((post) => post.sourceIds.includes('ben-investing101')));
  assert.ok(posts[0].text.includes('evidence'));
});

test('auto mode mixes source-backed patterns and CSV retains pattern provenance', () => {
  const posts = generatePosts({ topic: 'marketing strategy', idea: 'understand the audience before choosing channels', count: 50 });
  assert.ok(new Set(posts.map((post) => post.patternId)).size > 1);
  const csv = toCsv(posts);
  assert.match(csv, /pattern_id,source_ids/);
  assert.match(csv, /neil-guide/);
});


test('content DNA exposes seven reusable dimensions and deterministic combinations', () => {
  assert.deepEqual(Object.keys(contentDnaDimensions), ['hook', 'audienceLens', 'teaching', 'proof', 'story', 'objection', 'callToAction']);
  const first = composeContentDNA({ topic: 'marketing', idea: 'understand customer needs', audience: 'new founders', index: 14, seed: 9 });
  const repeat = composeContentDNA({ topic: 'marketing', idea: 'understand customer needs', audience: 'new founders', index: 14, seed: 9 });
  assert.equal(first.signature, repeat.signature);
  assert.equal(first.text, repeat.text);
  assert.equal(Object.keys(first.components).length, 7);
});

test('recombination varies DNA signatures and records the assembly on each draft', () => {
  const posts = generatePosts({ topic: 'business finance', idea: 'track cash flow and review decisions', count: 80, seed: 4 });
  assert.ok(posts.every((post) => post.dnaSignature && Object.keys(post.dnaComponents).length === 7));
  assert.ok(new Set(posts.map((post) => post.dnaSignature)).size > 1);
  const diversity = scoreDiversity(posts);
  assert.equal(diversity.total, posts.length);
  assert.ok(diversity.score > 0);
  assert.equal(diversity.repeated, posts.length - diversity.uniqueSignatures);
});

test('DNA metadata is preserved in CSV and duplicate signatures are measurable', () => {
  const posts = generatePosts({ topic: 'marketing', idea: 'test a clear offer', count: 12 });
  const csv = toCsv(posts);
  assert.match(csv, /dna_signature,dna_components/);
  assert.match(csv, /misconception|question|contrast|beginner|observation|myth/);
  assert.deepEqual(scoreDiversity([]), { score: 0, uniqueSignatures: 0, total: 0, repeated: 0 });
});


test('quality engine catches near-duplicates while retaining the earlier draft reference', () => {
  const checked = assessQuality([
    { id: 'a', text: 'A practical guide to building a budget helps small business owners track their cash flow and plan spending with care.' },
    { id: 'b', text: 'A practical guide to building a budget helps small business owners track their cash flow and plan spending with care today.' },
    { id: 'c', text: 'Compare customer interviews, product usage, and support requests before choosing the next marketing experiment.' },
  ]);
  assert.equal(checked[1].quality, 'review');
  assert.ok(checked[1].qualityFlags.some((flag) => flag.code === 'near-duplicate'));
  assert.equal(checked[1].duplicateOf, 'a');
  assert.equal(checked[2].quality, 'ready');
});

test('finance claims with numbers, guarantees, and personal trade instructions are flagged', () => {
  const checked = assessQuality([
    { category: 'Finance', text: 'This investment will return 25% every year with no risk and guaranteed profits for everyone.' },
    { category: 'Finance', text: 'You should buy this stock today and move your retirement savings into it.' },
  ]);
  assert.ok(checked[0].qualityFlags.some((flag) => flag.code === 'numeric-claim-needs-source'));
  assert.ok(checked[0].qualityFlags.some((flag) => flag.code === 'guaranteed-outcome'));
  assert.ok(checked[1].qualityFlags.some((flag) => flag.code === 'personalized-investment-direction'));
  assert.ok(checked.every((post) => post.quality === 'review'));
});

test('quality summary reports average score, review count, near duplicates and evidence flags', () => {
  const checked = assessQuality([
    { id: 'one', text: 'A detailed practical lesson with enough words to explain the topic in a clear and useful way for readers.' },
    { id: 'two', category: 'Finance', text: 'An investment can return 12% each year if the market conditions remain favourable and the evidence supports the claim.' },
  ]);
  const summary = summarizeQuality(checked);
  assert.equal(summary.ready + summary.review, 2);
  assert.ok(summary.averageScore >= 0 && summary.averageScore <= 100);
  assert.equal(summary.evidenceFlags, 1);
});

test('CSV includes quality scores, structured flags and duplicate references', () => {
  const checked = assessQuality([
    { id: 'one', text: 'A useful detailed post about customer research, careful testing, and how to evaluate a marketing experiment.' },
  ]);
  const csv = toCsv(checked);
  assert.match(csv, /quality_score,quality_flags,duplicate_of,similarity_to_previous/);
  assert.match(csv, /100/);
});


test('evidence records require a claim, title and safe http(s) URL', () => {
  assert.throws(() => createEvidenceRecord({ claim: 'A claim', title: 'Source', url: 'javascript:alert(1)' }), /http or https/);
  assert.throws(() => createEvidenceRecord({ title: 'Source', url: 'https://example.com' }), /specific claim/);
  const record = createEvidenceRecord({ claim: 'The report states this result.', title: 'Official report', url: 'https://example.com/report', publisher: 'Example agency', excerpt: 'Relevant passage' });
  assert.equal(record.status, 'provided');
  assert.equal(record.url, 'https://example.com/report');
});

test('a supplied URL never becomes human-verified without an explicit review decision', () => {
  const record = createEvidenceRecord({ claim: 'Revenue increased in the period.', title: 'Annual report', url: 'https://example.com/report' });
  const post = { category: 'Finance', text: 'An investment discussion with a factual statement.', evidence: record };
  assert.equal(getEvidenceReadiness(post).status, 'provided');
  assert.equal(getPublicationReadiness(post).canPublish, false);
  const reviewed = reviewEvidence(record, 'human-verified', 'Checked the cited page and relevant table.');
  assert.equal(getEvidenceReadiness({ evidence: reviewed }).status, 'human-verified');
  assert.equal(getPublicationReadiness({ ...post, evidence: reviewed }).canPublish, true);
});

test('finance drafts remain blocked when evidence is missing or rejected', () => {
  const financePost = { category: 'Finance', text: 'A beginner guide to investing.' };
  assert.equal(getPublicationReadiness(financePost).canPublish, false);
  const rejected = reviewEvidence(createEvidenceRecord({ claim: 'Unsupported claim.', title: 'Weak source', url: 'https://example.com' }), 'rejected', 'The page does not support this claim.');
  assert.equal(getPublicationReadiness({ ...financePost, evidence: rejected }).canPublish, false);
});

test('marketing numeric claims are evidence-gated and CSV preserves review trace', () => {
  const post = { category: 'Marketing', text: 'This campaign produced 25% growth for every customer.', qualityFlags: [{ code: 'numeric-claim-needs-source' }] };
  assert.equal(getPublicationReadiness(post).canPublish, false);
  const csv = toCsv([{ ...post, evidence: createEvidenceRecord({ claim: 'This campaign produced 25% growth.', title: 'Case study', url: 'https://example.com/case' }) }]);
  assert.match(csv, /evidence_claim,evidence_url,evidence_title/);
  assert.match(csv, /provided/);
});

function apiRequest(method, body, headers = {}) {
  const req = { method, body, headers: { host: 'content.test', origin: 'https://content.test', ...headers }, async *[Symbol.asyncIterator]() {} };
  const res = {
    statusCode: 200, headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(value) { this.body = value; },
  };
  return { req, res, run: async () => { await geminiHandler(req, res); return { status: res.statusCode, headers: res.headers, payload: JSON.parse(res.body) }; } };
}

test('AI status endpoint reports setup without revealing credentials', async () => {
  const oldKey = process.env.GEMINI_API_KEY, oldToken = process.env.CONTENT_ENGINE_ACCESS_TOKEN;
  delete process.env.GEMINI_API_KEY; delete process.env.CONTENT_ENGINE_ACCESS_TOKEN;
  try {
    const result = await apiRequest('GET').run();
    assert.equal(result.status, 200); assert.equal(result.payload.configured, false);
    assert.equal(JSON.stringify(result.payload).includes('API_KEY'), false);
  } finally {
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey;
    if (oldToken === undefined) delete process.env.CONTENT_ENGINE_ACCESS_TOKEN; else process.env.CONTENT_ENGINE_ACCESS_TOKEN = oldToken;
  }
});

test('AI endpoint rejects incorrect access codes and batches over ten', async () => {
  const oldKey = process.env.GEMINI_API_KEY, oldToken = process.env.CONTENT_ENGINE_ACCESS_TOKEN;
  process.env.GEMINI_API_KEY = 'server-key-test'; process.env.CONTENT_ENGINE_ACCESS_TOKEN = 'correct-access-code';
  try {
    const denied = await apiRequest('POST', { topic: 'marketing', idea: 'test an offer', count: 2 }, { authorization: 'Bearer wrong', 'x-forwarded-for': 'ai-test-ip-1' }).run();
    assert.equal(denied.status, 401);
    const invalid = await apiRequest('POST', { topic: 'marketing', idea: 'test an offer', count: 11 }, { authorization: 'Bearer correct-access-code', 'x-forwarded-for': 'ai-test-ip-2' }).run();
    assert.equal(invalid.status, 400); assert.match(invalid.payload.error, /1–10/);
  } finally {
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey;
    if (oldToken === undefined) delete process.env.CONTENT_ENGINE_ACCESS_TOKEN; else process.env.CONTENT_ENGINE_ACCESS_TOKEN = oldToken;
  }
});

test('AI endpoint sends the Gemini key in a header and returns validated draft metadata', async () => {
  const oldKey = process.env.GEMINI_API_KEY, oldToken = process.env.CONTENT_ENGINE_ACCESS_TOKEN, oldModel = process.env.GEMINI_MODEL, oldFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'server-only-secret'; process.env.CONTENT_ENGINE_ACCESS_TOKEN = 'server-access-code'; process.env.GEMINI_MODEL = 'gemini-3.1-flash-lite';
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url: String(url), options };
    return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ posts: [
      { text: 'A useful short lesson about testing a marketing message with one clear audience and one measurable next step.', angle: 'Small experiment', patternId: 'problem-to-process' },
      { text: 'Before changing every channel, find the customer problem your offer actually solves and explain it plainly.', angle: 'Customer clarity', patternId: 'audience-intent-guide' },
    ] }) }] } }] }) };
  };
  try {
    const result = await apiRequest('POST', { topic: 'customer acquisition', idea: 'test one channel', audience: 'small business owners', category: 'Marketing', count: 2, patternId: 'auto' }, { authorization: 'Bearer server-access-code', 'x-forwarded-for': 'ai-test-ip-3' }).run();
    assert.equal(result.status, 200); assert.equal(result.payload.posts.length, 2);
    assert.equal(result.payload.posts[0].generationMode, 'ai'); assert.equal(result.payload.posts[0].aiModel, 'gemini-3.1-flash-lite');
    assert.equal(captured.options.headers['x-goog-api-key'], 'server-only-secret');
    assert.equal(captured.url.includes('server-only-secret'), false); assert.equal(captured.options.body.includes('server-only-secret'), false);
    assert.equal(JSON.parse(captured.options.body).generationConfig.responseFormat.text.mimeType, 'application/json');
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey;
    if (oldToken === undefined) delete process.env.CONTENT_ENGINE_ACCESS_TOKEN; else process.env.CONTENT_ENGINE_ACCESS_TOKEN = oldToken;
    if (oldModel === undefined) delete process.env.GEMINI_MODEL; else process.env.GEMINI_MODEL = oldModel;
  }
});

test('AI endpoint rejects cross-origin requests and unsupported methods', async () => {
  const cross = await apiRequest('POST', {}, { origin: 'https://attacker.test', 'x-forwarded-for': 'ai-test-ip-4' }).run();
  assert.equal(cross.status, 403);
  const method = await apiRequest('DELETE', {}).run(); assert.equal(method.status, 405);
});

test('AI client sends only the short-lived access code and caps requests at ten', async () => {
  let captured;
  const posts = await generateAiPosts({ topic: 'marketing', idea: 'test an offer', audience: 'founders', category: 'Marketing', count: 50, patternId: 'auto' }, 'temporary-access-code', async (url, options) => {
    captured = { url, options }; return { ok: true, json: async () => ({ posts: [{ id: 'ai-1', text: 'A generated draft.' }] }) };
  });
  assert.equal(posts.length, 1); assert.equal(captured.url, '/api/generate');
  assert.equal(captured.options.headers.Authorization, 'Bearer temporary-access-code');
  assert.equal(JSON.parse(captured.options.body).count, 10);
});

test('AI client reads provider readiness without persisting credentials', async () => {
  const status = await getAiServiceStatus(async (url, options) => {
    assert.equal(url, '/api/generate'); assert.equal(options.method, 'GET');
    return { ok: true, json: async () => ({ configured: true, provider: 'Google Gemini', maxBatch: 10 }) };
  });
  assert.equal(status.configured, true); assert.equal(status.maxBatch, 10);
});