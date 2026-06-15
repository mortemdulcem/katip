#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.GITHUB_TOKEN;
const DRY = process.env.DRY === '1';
const REPO_NAME = process.env.REPO_NAME || 'epigenetik-makale-revize';
const PRIVATE = process.env.PUBLIC === '1' ? false : true;
const ROOT = path.resolve(__dirname); // scripts/revize
const MAX_FILE = 10 * 1024 * 1024; // skip files > 10MB
const EXCLUDE_DIRS = new Set(['data', 'out', 'node_modules', '.git']);

if (!TOKEN) { console.error('NO TOKEN in env'); process.exit(1); }

const API = 'https://api.github.com';
const H = {
  Authorization: `Bearer ${TOKEN}`,
  'User-Agent': 'replit-agent-push',
  Accept: 'application/vnd.github+json',
};

async function gh(method, url, body) {
  const res = await fetch(url.startsWith('http') ? url : API + url, {
    method,
    headers: { ...H, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch {}
  return { status: res.status, ok: res.ok, json, text, headers: res.headers };
}

function walk(dir, rel = '') {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    const r = rel ? rel + '/' + name : name;
    const st = fs.statSync(abs);
    if (st.isDirectory()) {
      if (EXCLUDE_DIRS.has(name)) continue;
      out.push(...walk(abs, r));
    } else if (st.isFile()) {
      if (name === path.basename(__filename)) continue; // skip this script
      if (st.size > MAX_FILE) { console.log('  SKIP (>10MB):', r, (st.size/1048576).toFixed(1)+'M'); continue; }
      out.push({ rel: r, abs, size: st.size });
    }
  }
  return out;
}

async function pool(items, n, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return results;
}

(async () => {
  // 1. validate token
  const me = await gh('GET', '/user');
  if (!me.ok) { console.error('Token invalid, status', me.status, me.text.slice(0,200)); process.exit(1); }
  const login = me.json.login;
  console.log('Authenticated as:', login);
  console.log('Scopes:', me.headers.get('x-oauth-scopes'));

  // 2. file inventory
  const files = walk(ROOT);
  const total = files.reduce((a, f) => a + f.size, 0);
  console.log(`Files to push: ${files.length}, total ${(total/1048576).toFixed(1)} MB`);

  if (DRY) {
    console.log('--- DRY RUN, no push ---');
    // show a sample of top-level entries
    const byTop = {};
    for (const f of files) { const t = f.rel.split('/')[0]; byTop[t] = (byTop[t]||0)+1; }
    console.log('by top-level:', JSON.stringify(byTop));
    process.exit(0);
  }

  // 3. ensure repo
  let repo = await gh('GET', `/repos/${login}/${REPO_NAME}`);
  if (repo.status === 404) {
    const created = await gh('POST', '/user/repos', {
      name: REPO_NAME, private: PRIVATE, auto_init: false,
      description: 'Madde bağımlılığı epigenetik yaş ivmelenmesi makalesi — kod ve kaynaklar (revize)'
    });
    if (!created.ok) { console.error('repo create failed', created.status, created.text.slice(0,300)); process.exit(1); }
    repo = created;
    console.log('Created repo:', created.json.full_name);
  } else if (repo.ok) {
    console.log('Using existing repo:', repo.json.full_name);
  } else {
    console.error('repo lookup failed', repo.status, repo.text.slice(0,200)); process.exit(1);
  }
  const owner = login;

  // 4. create blobs
  console.log('Uploading blobs...');
  let done = 0;
  const tree = await pool(files, 8, async (f) => {
    const content = fs.readFileSync(f.abs).toString('base64');
    let attempt = 0, b;
    while (attempt < 3) {
      b = await gh('POST', `/repos/${owner}/${REPO_NAME}/git/blobs`, { content, encoding: 'base64' });
      if (b.ok) break;
      attempt++; await new Promise(r => setTimeout(r, 500 * attempt));
    }
    if (!b.ok) { console.error('blob failed', f.rel, b.status, b.text.slice(0,150)); throw new Error('blob fail'); }
    done++;
    if (done % 25 === 0) console.log(`  ${done}/${files.length}`);
    return { path: f.rel, mode: '100644', type: 'blob', sha: b.json.sha };
  });
  console.log(`  ${done}/${files.length} blobs done`);

  // 5. tree
  const treeRes = await gh('POST', `/repos/${owner}/${REPO_NAME}/git/trees`, { tree });
  if (!treeRes.ok) { console.error('tree failed', treeRes.status, treeRes.text.slice(0,300)); process.exit(1); }

  // 6. commit
  const commitRes = await gh('POST', `/repos/${owner}/${REPO_NAME}/git/commits`, {
    message: 'Makale revize: kod, analiz betikleri ve kaynaklar', tree: treeRes.json.sha, parents: []
  });
  if (!commitRes.ok) { console.error('commit failed', commitRes.status, commitRes.text.slice(0,300)); process.exit(1); }
  const commitSha = commitRes.json.sha;

  // 7. ref (create or force-update main)
  let ref = await gh('POST', `/repos/${owner}/${REPO_NAME}/git/refs`, { ref: 'refs/heads/main', sha: commitSha });
  if (ref.status === 422) {
    ref = await gh('PATCH', `/repos/${owner}/${REPO_NAME}/git/refs/heads/main`, { sha: commitSha, force: true });
  }
  if (!ref.ok) { console.error('ref failed', ref.status, ref.text.slice(0,300)); process.exit(1); }

  console.log('PUSHED OK');
  console.log('REPO_URL:', repo.json.html_url);
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
