import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { assessPosts, generatePosts, toCsv } from '../src/contentEngine.js';

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
