import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { assessPosts, generatePosts, toCsv } from '../src/contentEngine.js';
import { composeContentDNA, contentDnaDimensions, scoreDiversity } from '../src/contentDNA.js';
import { creatorProfiles, researchPatterns, researchSources } from '../src/researchLibrary.js';

const root = new URL('../', import.meta.url);

test('project has its required app entry points', async () => {
  for (const path of ['index.html', 'src/main.jsx', 'src/App.jsx', 'src/style.css', 'src/contentEngine.js']) await access(new URL(path, root));
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
