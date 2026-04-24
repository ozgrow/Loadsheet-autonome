// Node harness to run tests/tests.html against app.js via JSDOM
// Prints pass/fail counts and exits with non-zero if any test fails.
// NOT committed to repo (gitignored via node_modules or ephemeral).

const fs = require('fs');
const path = require('path');
const { JSDOM, ResourceLoader } = require('jsdom');

const root = path.resolve(__dirname, '..');
const appJs = fs.readFileSync(path.join(root, 'static/js/app.js'), 'utf8');
const testsHtml = fs.readFileSync(path.join(root, 'tests/tests.html'), 'utf8');

// Strip the auth gate + CDN scripts; inject jsPDF/autotable via require + window assignment
let html = testsHtml
  .replace(/<script>\s*\/\/ Auth gate[\s\S]*?\}\)\(\);\s*<\/script>/, '')
  .replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/jspdf[^"]+"><\/script>/g, '')
  .replace('<script src="../static/js/app.js"></script>', `<script>${appJs}<\/` + `script>`);

(async () => {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/tests/',
    virtualConsole: (() => {
      const { VirtualConsole } = require('jsdom');
      const vc = new VirtualConsole();
      vc.on('jsdomError', (e) => { console.error('[jsdomError]', e && e.stack ? e.stack : e); });
      vc.on('log', (...args) => console.log('[log]', ...args));
      vc.on('warn', (...args) => console.warn('[warn]', ...args));
      vc.on('error', (...args) => console.error('[error]', ...args));
      return vc;
    })(),
    beforeParse(window) {
      // Provide crypto.subtle via Node webcrypto (JSDOM's readonly getter blocks direct set)
      const nodeCrypto = require('crypto').webcrypto;
      try {
        Object.defineProperty(window, 'crypto', { value: nodeCrypto, configurable: true, writable: true });
      } catch(e) {
        window.crypto = nodeCrypto;
      }
      // jsPDF with autotable plugin
      const { jsPDF } = require('jspdf');
      require('jspdf-autotable');
      window.jspdf = { jsPDF };
      // logout stub (referenced by sendEmail when session expires)
      window.logout = function() {};
      window.getJwt = function() { return 'test-jwt-token'; };
    },
  });

  // Wait until tests.html async IIFE finishes (it sets #summary text)
  let timedOut = false;
  await new Promise((resolve) => {
    const t0 = Date.now();
    const tick = () => {
      const summary = dom.window.document.getElementById('summary');
      if (summary && summary.textContent && /tests?/i.test(summary.textContent)) return resolve();
      if (Date.now() - t0 > 30000) { timedOut = true; return resolve(); }
      setTimeout(tick, 100);
    };
    tick();
  });
  if (timedOut) console.error('*** TIMEOUT — dumping partial results ***');

  const doc = dom.window.document;
  const results = doc.getElementById('results').textContent;
  const summary = doc.getElementById('summary').textContent;
  const passes = (results.match(/OK - /g) || []).length;
  const fails = (results.match(/FAIL - /g) || []).length;

  // Print failing tests for debugging
  if (fails > 0) {
    const lines = results.split('\n').filter(l => l.includes('FAIL - '));
    console.log('--- FAILURES ---');
    lines.forEach(l => console.log(l.trim()));
    console.log('--- END ---');
  }

  console.log(`Summary: ${summary}`);
  console.log(`Passed: ${passes}, Failed: ${fails}`);
  process.exit(fails > 0 ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
