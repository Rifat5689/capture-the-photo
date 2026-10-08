import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import express from 'express';
import helmet from 'helmet';
import Newspaper from '../models/Newspaper.js';
import { generateSharePreview } from './visitorController.js';

test('clean news links expose crawler metadata and redirect readers without loops', async () => {
  const config = JSON.parse(fs.readFileSync(new URL('../../../frontend/firebase.json', import.meta.url), 'utf8'));
  const rule = config.hosting.redirects.find(item => item.source === '/news/:linkId');
  assert.equal(rule.type, 302);
  const originalFindOne = Newspaper.findOne;
  Newspaper.findOne = async ({ linkId }) => linkId === 'missing' ? null : {
    headline: '????? "headline" & <news>',
    summary: 'A "quoted" summary & details',
    coverImage: 'https://images.example/cover.png?size=large&format=png'
  };
  const app = express();
  app.use(helmet());
  app.get(rule.source, (req, res) => {
    const destination = new URL(rule.destination.replace(':linkId', encodeURIComponent(req.params.linkId)));
    // Exercise the configured hosting redirect through the local API fixture.
    res.redirect(rule.type, destination.pathname + destination.search);
  });
  app.get('/news/:linkId/verify', (req, res) => res.send('Consent popup'));
  app.get('/news/:linkId/view', (req, res) => res.send('Article'));
  app.get('/api/visitor/:linkId/share', generateSharePreview);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const userAgent of ['facebookexternalhit/1.1', 'WhatsApp/2.0', 'Mozilla/5.0']) {
      const response = await fetch(origin + '/news/story', { headers: { 'User-Agent': userAgent } });
      const html = await response.text();
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /text\/html/);
      assert.ok(html.includes('content="????? &quot;headline&quot; &amp; &lt;news&gt;"'));
      assert.ok(html.includes('content="https://images.example/cover.png?size=large&amp;format=png"'));
      assert.ok(html.includes('property="og:url" content="https://capture-f5c1a.web.app/news/story"'));
      assert.ok(html.includes('rel="canonical" href="https://capture-f5c1a.web.app/news/story"'));
      assert.doesNotMatch(html, /http-equiv="refresh"/);
      const [, nonce, script] = html.match(/<script nonce="([^"]+)">([\s\S]*?)<\/script>/);
      assert.ok(response.headers.get('content-security-policy').includes(`'nonce-${nonce}'`));
      assert.ok(response.headers.get('content-security-policy').includes("object-src 'none'"));
      let destination;
      vm.runInNewContext(script, {
        document: { getElementById: () => ({ href: 'https://capture-f5c1a.web.app/news/story/verify' }) },
        window: { location: { replace: url => { destination = url; } } }
      });
      assert.equal(destination, 'https://capture-f5c1a.web.app/news/story/verify');
      assert.ok(html.includes('href="' + destination + '"'));
    }
    for (const path of ['/news/story/verify', '/news/story/view']) {
      const response = await fetch(origin + path, { redirect: 'manual' });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('location'), null);
    }
    for (const frontendUrl of ['javascript:alert(1)', 'not-a-url', 'https://user:pass@news.example']) {
      const response = await fetch(`${origin}/api/visitor/story/share?frontendUrl=${encodeURIComponent(frontendUrl)}`);
      assert.equal(response.status, 400);
    }
    assert.equal((await fetch(origin + '/api/visitor/story/share?frontendUrl=https://one.example&frontendUrl=https://two.example')).status, 400);
    assert.equal((await fetch(origin + '/news/missing')).status, 404);
    Newspaper.findOne = async () => { throw new Error('Unavailable'); };
    assert.equal((await fetch(origin + '/news/story')).status, 500);
  } finally {
    Newspaper.findOne = originalFindOne;
    await new Promise(resolve => server.close(resolve));
  }
});
