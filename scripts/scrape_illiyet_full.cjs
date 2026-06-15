const fs = require('fs');
const path = require('path');

const REFRESH_TOKEN = '0d66831c-21a9-4157-a8c9-57f34a25822b';
let ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtb3J0ZW1kdWxjZW0iLCJhdXRoIjpbeyJhdXRob3JpdHkiOiJST0xFX1VTRVIifV0sImlhdCI6MTc3ODUwNjExMywiZXhwIjoxNzc4NTA3OTEzfQ.tzZGb_f_tERY-V9Lyrv7UkYy51I5mONAWJZu7a9uuDc';

const OUT_DIR = path.join(__dirname, 'sinerji_dump', 'full');
fs.mkdirSync(OUT_DIR, { recursive: true });

const hdr = (id) => ({
  'accept':'application/json, text/plain, */*',
  'content-type':'application/json',
  'cookie':`consent-cookie=true; refresh-token=${REFRESH_TOKEN}; access-token=${ACCESS_TOKEN}`,
  'authorization':`Bearer ${ACCESS_TOKEN}`,
  'origin':'https://mevzuat.sinerjias.com.tr',
  'referer': id ? `https://mevzuat.sinerjias.com.tr/karar?id=${encodeURIComponent(id)}` : 'https://mevzuat.sinerjias.com.tr/',
  'user-agent':'Mozilla/5.0',
});

async function refreshToken() {
  const r = await fetch('https://mevzuat.sinerjias.com.tr/api/mev/auth/refresh', {
    method:'POST', headers: hdr(), body: JSON.stringify({ refreshToken: REFRESH_TOKEN }),
  });
  const sc = r.headers.get('set-cookie') || '';
  const m = sc.match(/access-token=([^;,\s]+)/);
  if (m) { ACCESS_TOKEN = m[1]; console.log('  ↻ refreshed'); return true; }
  console.log('  ✗ refresh failed', r.status); return false;
}

const TYPE_TO_ENDPOINT = {
  'Yargıtay':'yuksekmahkeme', 'Anayasa':'yuksekmahkeme', 'Danıştay':'yuksekmahkeme',
  'A.İ.H.M.':'yuksekmahkeme', 'Bölge Adliye Mahkemesi':'yuksekmahkeme',
  'Askeri Yargıtay':'yuksekmahkeme', 'A.Y.İ.M.':'yuksekmahkeme',
  'Bölge İdare Mahkemesi':'yuksekmahkeme', 'Uyuşmazlık Mahkemesi':'yuksekmahkeme',
  'Sayıştay':'yuksekmahkeme',
};

async function getKarar(id, retry = 0) {
  const r = await fetch('https://mevzuat.sinerjias.com.tr/api/mev/yuksekmahkeme/get', {
    method:'POST', headers: hdr(id), body: JSON.stringify({ id }),
  });
  if (r.status === 401 || r.status === 403) {
    if (retry > 1) return { error: `auth failed ${r.status}` };
    await refreshToken();
    return getKarar(id, retry + 1);
  }
  if (r.status !== 200) return { error: `HTTP ${r.status}: ${(await r.text()).slice(0,150)}` };
  return r.json();
}

(async () => {
  const targets = JSON.parse(fs.readFileSync('/tmp/illiyet_to_fetch.json'));
  console.log(`Targets: ${targets.length}`);
  await refreshToken(); // proactive at start
  let success=0, skipped=0, failed=0;
  const t0=Date.now(); let lastRefresh=Date.now();

  for (let i=0; i<targets.length; i++) {
    const r = targets[i];
    const file = path.join(OUT_DIR, r.id.replace(/[\/+=]/g,'_') + '.json');
    if (fs.existsSync(file) && fs.statSync(file).size > 100) { skipped++; continue; }
    if (Date.now()-lastRefresh > 22*60*1000) { await refreshToken(); lastRefresh=Date.now(); }
    try {
      const data = await getKarar(r.id);
      if (data && data.data && data.data.metin) {
        fs.writeFileSync(file, JSON.stringify(data));
        success++;
      } else if (data && data.error) {
        fs.writeFileSync(file+'.err', data.error); failed++;
      } else { failed++; }
    } catch (e) { failed++; console.log(' EXC',e.message); }
    if ((i+1)%50===0) {
      const el=(Date.now()-t0)/1000, rate=(success+skipped+failed)/el;
      console.log(`[${i+1}/${targets.length}] ✓${success} ⊘${skipped} ✗${failed} | ${rate.toFixed(1)}/s | ETA ${Math.round((targets.length-i-1)/Math.max(rate,0.1))}s`);
    }
    await new Promise(x=>setTimeout(x,160));
  }
  console.log(`DONE: ✓${success} ⊘${skipped} ✗${failed} in ${Math.round((Date.now()-t0)/1000)}s`);
})().catch(e=>{console.log('FATAL:',e.message);});
