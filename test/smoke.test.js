import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { createElement, act } from 'react';
import { JSDOM } from 'jsdom';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const root = new URL('../', import.meta.url);

test('starter has the required app entry points', async () => {
  await access(new URL('index.html', root));
  await access(new URL('src/main.jsx', root));
  await access(new URL('src/App.jsx', root));
  await access(new URL('src/style.css', root));
});

test('package uses explicit runtime versions and required scripts', async () => {
  const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  assert.equal(pkg.scripts.dev, 'vite --host 0.0.0.0');
  assert.equal(pkg.scripts.build, 'vite build');
  assert.equal(pkg.scripts.test, 'node --test');
  assert.equal(pkg.engines.node, '>=22.13.0');
  for (const name of ['@vitejs/plugin-react', 'vite', 'react', 'react-dom', 'jsdom']) {
    const version = pkg.dependencies[name] ?? pkg.devDependencies[name];
    assert.match(version, /^\d+\.\d+\.\d+$/);
    assert.notEqual(version, 'latest');
  }
});

test('HTML contains mobile viewport and app root', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.match(html, /name="viewport"/);
  assert.match(html, /id="root"/);
});

test('the actual React app renders its release checklist and accessible progress', async () => {
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
    assert.match(html, /Turn a good idea into a/);
    assert.match(html, /Start with the user/);
    assert.match(html, /Ship the smallest useful version/);
    assert.match(html, /Verify before release/);
    assert.match(html, /role="progressbar"/);
    assert.match(html, /aria-valuenow="0"/);
    assert.equal((html.match(/type="checkbox"/g) || []).length, 3);
  } finally {
    await server.close();
  }
});

test('checking and unchecking items updates the live checklist progress', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
  });
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    navigator: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
    HTMLElement: globalThis.HTMLElement,
    MutationObserver: globalThis.MutationObserver,
    IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
  };

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator });
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.MutationObserver = dom.window.MutationObserver;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  let reactRoot;
  let server;
  try {
    const { createRoot } = await import('react-dom/client');
    server = await createServer({
      configFile: new URL('../vite.config.js', import.meta.url).pathname,
      root: new URL('../', import.meta.url).pathname,
      server: { middlewareMode: true },
      appType: 'custom',
      logLevel: 'error',
    });
    const { default: App } = await server.ssrLoadModule('/src/App.jsx');
    reactRoot = createRoot(document.getElementById('root'));
    await act(async () => {
      reactRoot.render(createElement(App));
    });

    const progress = document.querySelector('[role="progressbar"]');
    const count = document.querySelector('.progress');
    const checkboxes = [...document.querySelectorAll('input[type="checkbox"]')];
    assert.equal(checkboxes.length, 3);
    assert.equal(progress.getAttribute('aria-valuenow'), '0');
    assert.equal(count.textContent, '0 of 3');

    await act(async () => {
      checkboxes[0].click();
    });
    assert.equal(checkboxes[0].checked, true);
    assert.equal(progress.getAttribute('aria-valuenow'), '1');
    assert.equal(count.textContent, '1 of 3');

    await act(async () => {
      checkboxes[1].click();
    });
    assert.equal(checkboxes[1].checked, true);
    assert.equal(progress.getAttribute('aria-valuenow'), '2');
    assert.equal(count.textContent, '2 of 3');

    await act(async () => {
      checkboxes[0].click();
    });
    assert.equal(checkboxes[0].checked, false);
    assert.equal(progress.getAttribute('aria-valuenow'), '1');
    assert.equal(count.textContent, '1 of 3');
  } finally {
    if (reactRoot) {
      await act(async () => reactRoot.unmount());
    }
    if (server) await server.close();
    dom.window.close();
    globalThis.window = previous.window;
    globalThis.document = previous.document;
    if (previous.navigator) Object.defineProperty(globalThis, 'navigator', previous.navigator);
    else delete globalThis.navigator;
    if (previous.HTMLElement === undefined) delete globalThis.HTMLElement;
    else globalThis.HTMLElement = previous.HTMLElement;
    if (previous.MutationObserver === undefined) delete globalThis.MutationObserver;
    else globalThis.MutationObserver = previous.MutationObserver;
    globalThis.IS_REACT_ACT_ENVIRONMENT = previous.IS_REACT_ACT_ENVIRONMENT;
  }
});
