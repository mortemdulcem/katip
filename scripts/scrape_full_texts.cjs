/* Sinerji 871 karar tam metin scraper.
 * Output: scripts/sinerji_dump/full/{id}.json
 * Token refresh every ~25 min via /api/mev/auth/refresh.
 */
const fs = require('fs');
const path = require('path');

const REFRESH_TOKEN = '0d66831c-21a9-4157-a8c9-57f34a25822b';
let ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtb3J0ZW1kdWxjZW0iLCJhdXRoIjpbeyJhdXRob3JpdHkiOiJST0xFX1VTRVIifV0sImlhdCI6MTc3ODQ5OTE1MCwiZXhwIjoxNzc4NTAwOTUwfQ.o33eBOHK_0baw9EcAzGvDEFCnhQV_nWGujgr755mabQ';

const OUT_DIR = path.join(__dirname, 'sinerji_dump', 'full');
fs.mkdirSync(OUT_DIR, { recursive: true });

function hdr() {
  return {
    'accept':'application/json, text/plain, */*',
    'content-type':'application/json',
    'cookie':`consent-cookie=true; refresh-token=${REFRESH_TOKEN}; access-token=${ACCESS_TOKEN}`,
    'authorization':`Bearer ${ACCESS_TOKEN}`,
    'origin':'https://mevzuat.sinerjias.com.tr',
    'referer':'https://mevzuat.sinerjias.com.tr/',
    'user-agent':'Mozilla/5.0',
  };
}

async function refreshToken() {
  const r = await fetch('https://mevzuat.sinerjias.com.tr/api/mev/auth/refresh', {
    method:'POST', headers: hdr(),
    body: JSON.stringify({ refreshToken: REFRESH_TOKEN }),
  });
  const sc = r.headers.get('set-cookie') || '';
  const m = sc.match(/access-token=([^;,\s]+)/);
  if (m) {
    ACCESS_TOKEN = m[1];
    console.log('  ↻ token refreshed at', new Date().toISOString());
    return true;
  }
  console.log('  ✗ refresh failed:', r.status, await r.text());
  return false;
}

async function getKarar(id, retry = 0) {
  const r = await fetch('https://mevzuat.sinerjias.com.tr/api/mev/yuksekmahkeme/get', {
    method:'POST', headers: hdr(), body: JSON.stringify({ id }),
  });
  if (r.status === 401 || r.status === 403) {
    if (retry > 1) throw new Error('auth failed twice');
    await refreshToken();
    return getKarar(id, retry + 1);
  }
  if (r.status !== 200) {
    const t = await r.text();
    return { error: `HTTP ${r.status}: ${t.slice(0,200)}` };
  }
  return r.json();
}

(async () => {
  const all = require('./sinerji_dump/all_results.json');
  const skipTipler = new Set(['Yönetmelik','Cumhurbaşkanlığı']); // bu endpoint kabul etmiyor
  const targets = all.filter(r => !skipTipler.has(r.tipadi));
  console.log(`Target: ${targets.length} / ${all.length} kayıt`);

  let success = 0, skipped = 0, failed = 0;
  const t0 = Date.now();
  let lastRefresh = Date.now();

  for (let i = 0; i < targets.length; i++) {
    const r = targets[i];
    const file = path.join(OUT_DIR, r.id.replace(/[\/+=]/g, '_') + '.json');
    if (fs.existsSync(file) && fs.statSync(file).size > 100) { skipped++; continue; }

    // Proactive refresh every 25 min
    if (Date.now() - lastRefresh > 25 * 60 * 1000) {
      await refreshToken();
      lastRefresh = Date.now();
    }

    try {
      const data = await getKarar(r.id);
      if (data && data.data && data.data.metin) {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        success++;
      } else if (data && data.error) {
        fs.writeFileSync(file + '.err', data.error);
        failed++;
        console.log(`  ✗ ${i+1}/${targets.length} ${r.tipadi} ${r.id.slice(0,20)} — ${data.error.slice(0,80)}`);
      } else {
        failed++;
        console.log(`  ? ${i+1}/${targets.length} unexpected:`, JSON.stringify(data).slice(0,200));
      }
    } catch (e) {
      failed++;
      console.log(`  ✗ ${i+1}/${targets.length} EXCEPTION:`, e.message);
    }

    if ((i + 1) % 25 === 0) {
      const elapsed = (Date.now() - t0) / 1000;
      const rate = (success + skipped) / elapsed;
      const eta = Math.round((targets.length - i - 1) / Math.max(rate, 0.1));
      console.log(`  [${i+1}/${targets.length}] ✓${success} ⊘${skipped} ✗${failed} | ${rate.toFixed(1)}/s | ETA ${eta}s`);
    }

    await new Promise(r => setTimeout(r, 180));
  }

  console.log(`\nDONE: ✓${success} success, ⊘${skipped} skipped, ✗${failed} failed`);
  console.log(`Total time: ${Math.round((Date.now()-t0)/1000)}s`);
  console.log(`Output dir: ${OUT_DIR}`);
})();
