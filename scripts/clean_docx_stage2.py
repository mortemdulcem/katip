import json, os, re, urllib.request, time
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE = os.environ['AI_INTEGRATIONS_OPENAI_BASE_URL']
KEY = os.environ['AI_INTEGRATIONS_OPENAI_API_KEY']
CKPT = 'scripts/clean_stage2.json'

with open('scripts/clean_stage1.json', encoding='utf-8') as f:
    data = json.load(f)

# Build list of indices that need LLM (nonempty)
work = [o for o in data if o['t'].strip()]

SYS = (
"Sen profesyonel bir Türkçe metin düzeltme uzmanısın. Sana, İngilizceden Türkçeye "
"otomatik çeviri sırasında BOZULMUŞ bir kitabın paragrafları veriliyor. Görevin SADECE "
"bozulmaları düzeltmek:\n"
"1) ı/i bozulması: 'yayinlarin'→'yayınların', 'açik'→'açık', 'kullanimi'→'kullanımı'.\n"
"2) Kelime içi gereksiz boşluklar: 'seris i'→'serisi', 'yö neticilere'→'yöneticilere', "
"'geliştiric ilere'→'geliştiricilere', 'biraki lmiştir'→'bırakılmıştır'.\n"
"3) ç/ö/ü/ş/ğ harf bozulmaları: 'çikarmak'→'çıkarmak'.\n"
"4) Ağır harf ikameleri (l→i, ç→g, ö→δ, k→k): 'biieşen'→'bileşen', 'bağiantisi'→'bağlantısı', "
"'Dδngüsei'→'Döngüsel', 'İikesi'→'İlkesi', 'sonug'→'sonuç', 'agik'→'açık', 'segenekieri'→'seçenekleri'.\n"
"5) Satır sonu tire bölünmeleri: 'eisenho- wer'→'eisenhower', 'Infor- mit'→'Informit'.\n"
"6) Hatalı büyük/küçük harf: cümle başı dışında uydurma büyük harfleri düzelt; özel adları koru "
"('Robert c.'→'Robert C.', 'amerika birleşik devletleri'→'Amerika Birleşik Devletleri').\n\n"
"MUTLAK KURALLAR:\n"
"- İçeriği ASLA değiştirme, yeniden yazma, özetleme, ekleme veya çıkarma yapma. Sadece yazım/boşluk/harf düzeltmesi.\n"
"- Sayıları (sayfa numaraları dahil) aynen koru.\n"
"- Her paragrafı kendi ⟦n⟧ etiketiyle birebir eşle. Etiket sayısını ve sırasını koru.\n"
"- Çıktı SADECE düzeltilmiş paragraflar olsun, ⟦n⟧ etiketleriyle. Başka açıklama yazma."
)

def make_chunks(items, max_chars=4500):
    chunks, cur, cl = [], [], 0
    for o in items:
        l = len(o['t']) + 12
        if cur and cl + l > max_chars:
            chunks.append(cur); cur, cl = [], 0
        cur.append(o); cl += l
    if cur:
        chunks.append(cur)
    return chunks

chunks = make_chunks(work)
print("nonempty paras:", len(work), "chunks:", len(chunks))

def build_prompt(chunk):
    return "\n".join(f"⟦{o['i']}⟧ {o['t']}" for o in chunk)

def parse_response(text):
    # returns dict idx->cleaned
    res = {}
    parts = re.split(r'⟦(\d+)⟧', text)
    # parts: [pre, idx, body, idx, body, ...]
    for k in range(1, len(parts)-1, 2):
        idx = int(parts[k])
        body = parts[k+1].strip()
        res[idx] = body
    return res

def call(chunk, attempt=0):
    prompt = build_prompt(chunk)
    body = {"model":"gpt-5.1","messages":[
        {"role":"system","content":SYS},
        {"role":"user","content":prompt}]}
    req = urllib.request.Request(BASE+"/chat/completions",
        data=json.dumps(body).encode(),
        headers={"Authorization":"Bearer "+KEY,"Content-Type":"application/json"})
    try:
        r = urllib.request.urlopen(req, timeout=180)
        out = json.loads(r.read())
        content = out["choices"][0]["message"]["content"]
        parsed = parse_response(content)
        # validate: all idx present
        missing = [o['i'] for o in chunk if o['i'] not in parsed]
        if missing and attempt < 2:
            return call(chunk, attempt+1)
        return parsed
    except Exception as e:
        if attempt < 3:
            time.sleep(2*(attempt+1))
            return call(chunk, attempt+1)
        print("CHUNK FAILED:", [c['i'] for c in chunk][:3], e)
        return {}

results = {}
# resume
if os.path.exists(CKPT):
    with open(CKPT, encoding='utf-8') as f:
        results = {int(k):v for k,v in json.load(f).items()}
    print("resumed with", len(results), "done")

todo = [c for c in chunks if not all(o['i'] in results for o in c)]
print("chunks to process:", len(todo))

done_count = [0]
def save():
    with open(CKPT,'w',encoding='utf-8') as f:
        json.dump({str(k):v for k,v in results.items()}, f, ensure_ascii=False)

with ThreadPoolExecutor(max_workers=8) as ex:
    futs = {ex.submit(call, c): c for c in todo}
    for fut in as_completed(futs):
        parsed = fut.result()
        results.update(parsed)
        done_count[0]+=1
        if done_count[0] % 10 == 0:
            save()
            print(f"  {done_count[0]}/{len(todo)} chunks, {len(results)} paras")
save()

# fallback for any missing
miss = [o for o in work if o['i'] not in results]
print("still missing after LLM:", len(miss))
for o in miss:
    results[o['i']] = o['t']
save()
print("DONE total cleaned paras:", len(results))
