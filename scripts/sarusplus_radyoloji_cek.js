/*
  SARUSPLUS — RADYOLOJİ SONUÇLARI ÇEKME SCRİPTİ
  ================================================
  
  "Tetkik Sonuçları" sayfasında çalışır.
  
  KULLANIM:
  1. SARUSPLUS > Tetkik Sonuçları sayfasını açın
  2. F12 > Console > "allow pasting" yazıp Enter
  3. Bu scripti yapıştırıp Enter
  4. RAD.scout() ile DOM yapısını keşfedin
  5. RAD.search() ile nisan ayı BT sonuçlarını arayın
*/

(function() {
  "use strict";
  console.log("=== RADYOLOJİ SONUÇLARI ÇEKME v1 ===");

  function getAllDocs() {
    const docs = [];
    function dig(win, depth) {
      try {
        docs.push({ doc: win.document, win: win, depth: depth });
      } catch(e) {}
      try {
        for (let i = 0; i < win.frames.length; i++) {
          try { dig(win.frames[i], depth + 1); } catch(e) {}
        }
      } catch(e) {}
    }
    dig(window, 0);
    return docs;
  }

  function scout() {
    console.log("\n========== DOM KEŞFİ ==========");
    const frames = getAllDocs();
    console.log(`Toplam ${frames.length} frame bulundu\n`);

    frames.forEach((f, idx) => {
      const doc = f.doc;
      try {
        console.log(`\n--- FRAME ${idx} (depth:${f.depth}) URL: ${doc.location?.href?.slice(0,100) || "?"} ---`);
      } catch(e) {
        console.log(`\n--- FRAME ${idx} (depth:${f.depth}) ---`);
      }

      // Select/dropdown elemanları
      const selects = doc.querySelectorAll("select");
      selects.forEach(sel => {
        const options = Array.from(sel.options).map(o => `${o.value}:${o.text.trim().slice(0,40)}`);
        console.log(`  SELECT id:"${sel.id}" name:"${sel.name}" [${options.length} seçenek]`);
        if (options.length <= 30) {
          options.forEach(o => console.log(`    - ${o}`));
        } else {
          options.slice(0, 10).forEach(o => console.log(`    - ${o}`));
          console.log(`    ... +${options.length - 10} daha`);
        }
      });

      // Input alanları
      const inputs = doc.querySelectorAll("input:not([type='hidden'])");
      inputs.forEach(inp => {
        console.log(`  INPUT id:"${inp.id}" name:"${inp.name}" type:${inp.type} placeholder:"${inp.placeholder}" value:"${inp.value}"`);
      });

      // Butonlar
      const buttons = doc.querySelectorAll("button, input[type='button'], input[type='submit'], a[onclick], img[onclick]");
      buttons.forEach(btn => {
        const t = (btn.value || btn.innerText || btn.title || btn.alt || "").trim().slice(0, 40);
        if (t) console.log(`  BUTTON ${btn.tagName} id:"${btn.id}" → "${t}"`);
      });

      // Tablo başlıkları
      const tables = doc.querySelectorAll("table");
      tables.forEach((tbl, ti) => {
        const headers = tbl.querySelectorAll("th, thead td");
        if (headers.length > 0) {
          const hs = Array.from(headers).map(h => h.innerText.trim().slice(0, 20)).filter(h => h);
          console.log(`  TABLE[${ti}] id:"${tbl.id}" headers: ${hs.join(" | ")}`);
        }
        const rows = tbl.querySelectorAll("tbody tr, tr");
        if (rows.length > 1) {
          console.log(`    ${rows.length} satır`);
          // İlk 3 satırı göster
          Array.from(rows).slice(0, 3).forEach((row, ri) => {
            const cells = Array.from(row.querySelectorAll("td")).map(c => c.innerText.trim().slice(0, 30));
            if (cells.length > 0) console.log(`    ROW[${ri}]: ${cells.join(" | ")}`);
          });
        }
      });

      // Label'lar (filtrelerin yanındaki etiketler)
      const labels = doc.querySelectorAll("label, .label");
      labels.forEach(lbl => {
        const t = (lbl.innerText || lbl.textContent || "").trim();
        if (t && t.length < 50) console.log(`  LABEL: "${t}" for:"${lbl.htmlFor || ""}"`);
      });
    });

    return frames;
  }

  function findInFrames(selector) {
    const frames = getAllDocs();
    for (const f of frames) {
      const el = f.doc.querySelector(selector);
      if (el) return { el, doc: f.doc, win: f.win };
    }
    return null;
  }

  function findAllInFrames(selector) {
    const results = [];
    const frames = getAllDocs();
    for (const f of frames) {
      const els = f.doc.querySelectorAll(selector);
      els.forEach(el => results.push({ el, doc: f.doc, win: f.win }));
    }
    return results;
  }

  function findByText(text, tags) {
    const frames = getAllDocs();
    for (const f of frames) {
      const els = f.doc.querySelectorAll(tags || "*");
      for (const el of els) {
        const t = (el.innerText || el.textContent || el.value || "").trim();
        if (t.includes(text)) return { el, doc: f.doc, win: f.win };
      }
    }
    return null;
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function setVal(input, value) {
    input.focus();
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Tab" }));
    input.blur();
  }

  function selectOption(selectEl, valueOrText) {
    for (const opt of selectEl.options) {
      if (opt.value === valueOrText || opt.text.includes(valueOrText)) {
        selectEl.value = opt.value;
        selectEl.dispatchEvent(new Event("change", { bubbles: true }));
        console.log(`  Seçildi: ${opt.text}`);
        return true;
      }
    }
    console.warn(`  "${valueOrText}" seçeneği bulunamadı`);
    return false;
  }

  async function search() {
    console.log("\n=== NİSAN AYI BEYİN BT ARAMASI ===");

    const allInputs = findAllInFrames("input");
    const allSelects = findAllInFrames("select");
    console.log(`${allInputs.length} input, ${allSelects.length} select bulundu`);

    // İşlem dropdown'unda BT ile ilgili seçenekleri bul
    console.log("\n--- İŞLEM SEÇENEKLERİ (BT/Kranial/Beyin) ---");
    const btKeywords = ["bt", "beyin", "kranial", "cranial", "kraniyal", "head", "brain", "kafa", "serebral", "cerebral"];
    allSelects.forEach(({el}, si) => {
      const matchingOpts = [];
      for (const opt of el.options) {
        const t = opt.text.toLowerCase();
        if (btKeywords.some(k => t.includes(k))) {
          matchingOpts.push({ value: opt.value, text: opt.text.trim() });
        }
      }
      if (matchingOpts.length > 0) {
        console.log(`\nSELECT[${si}] id:"${el.id}" name:"${el.name}" — BT eşleşmeleri:`);
        matchingOpts.forEach(o => console.log(`  ✓ value:"${o.value}" text:"${o.text}"`));
      }
      // Ayrıca tüm seçenekleri de dökelim (ilk select hariç çok uzunsa)
      if (el.options.length <= 50 || matchingOpts.length > 0) {
        console.log(`\n  [select${si}] TÜM seçenekler (${el.options.length}):`);
        for (const opt of el.options) {
          console.log(`    "${opt.value}" → "${opt.text.trim()}"`);
        }
      }
    });

    // Tarih alanlarını bul
    console.log("\n--- TARİH ALANLARI ---");
    allInputs.forEach(({el}, i) => {
      const idName = (el.id + el.name + el.placeholder + el.className).toLowerCase();
      if (el.type !== "hidden" && (idName.includes("tarih") || idName.includes("date") || /\d{2}[./-]\d{2}[./-]\d{4}/.test(el.value))) {
        console.log(`  [${i}] id:"${el.id}" name:"${el.name}" type:${el.type} value:"${el.value}"`);
      }
    });

    // Hasta ve Kabul alanları
    console.log("\n--- HASTA / KABUL ALANLARI ---");
    allInputs.forEach(({el}) => {
      const idName = (el.id + el.name + el.placeholder).toLowerCase();
      if (el.type !== "hidden" && (idName.includes("hasta") || idName.includes("kabul") || idName.includes("patient") || idName.includes("tc"))) {
        console.log(`  id:"${el.id}" name:"${el.name}" type:${el.type} value:"${el.value}"`);
      }
    });

    const araBtn = findByText("Ara", "button, input[type='button'], input[type='submit'], a, td, span");
    console.log("\nAra butonu:", araBtn ? "BULUNDU" : "BULUNAMADI");

    console.log("\n=== SONRAKI ADIMLAR ===");
    console.log("1. Yukarıdaki BT eşleşmesinden doğru value'yu not edin");
    console.log("2. RAD.setDates('01.04.2026', '15.04.2026')");
    console.log("3. RAD.selectBT('value_buraya')  — veya");
    console.log("   RAD.autoBT()                  — Otomatik BT seç");
    console.log("4. RAD.clickSearch()");
    console.log("5. RAD.getResults()");
  }

  function selectBT(value) {
    const allSelects = findAllInFrames("select");
    for (const {el} of allSelects) {
      for (const opt of el.options) {
        if (opt.value === value || opt.text.trim() === value) {
          el.value = opt.value;
          el.dispatchEvent(new Event("change", { bubbles: true }));
          console.log(`Seçildi: "${opt.text.trim()}" (value: ${opt.value})`);
          return true;
        }
      }
    }
    console.error(`"${value}" seçeneği bulunamadı!`);
    return false;
  }

  function autoBT() {
    const btKeywords = ["kranial bt", "beyin bt", "bt beyin", "bt kranial", "cranial ct", "brain ct", "bt kafa", "kraniyal bt"];
    const allSelects = findAllInFrames("select");
    for (const {el} of allSelects) {
      for (const opt of el.options) {
        const t = opt.text.trim().toLowerCase();
        for (const kw of btKeywords) {
          if (t.includes(kw) || t === kw) {
            el.value = opt.value;
            el.dispatchEvent(new Event("change", { bubbles: true }));
            console.log(`Otomatik seçildi: "${opt.text.trim()}" (value: ${opt.value})`);
            return true;
          }
        }
      }
    }
    // Geniş arama: sadece "bt" veya "ct" içerenleri listele
    console.warn("Tam eşleşme bulunamadı. BT/CT içeren seçenekler:");
    for (const {el} of allSelects) {
      for (const opt of el.options) {
        const t = opt.text.trim().toLowerCase();
        if (t.includes("bt") || t.includes(" ct") || t.includes("tomografi")) {
          console.log(`  → "${opt.text.trim()}" (value: ${opt.value})`);
        }
      }
    }
    return false;
  }

  function setDates(start, end) {
    const allInputs = findAllInFrames("input[type='text'], input[type='date'], input:not([type])");
    let dateInputs = [];

    allInputs.forEach(({el}) => {
      const idName = (el.id + el.name + el.placeholder + el.className).toLowerCase();
      if (idName.includes("tarih") || idName.includes("date") || idName.includes("baslangic") || idName.includes("bitis")) {
        dateInputs.push(el);
      }
    });

    if (dateInputs.length === 0) {
      // Tarih formatındaki değer içerenleri bul
      allInputs.forEach(({el}) => {
        if (/\d{2}\.\d{2}\.\d{4}/.test(el.value) || el.value === "") {
          const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
          if (rect && rect.width > 0) dateInputs.push(el);
        }
      });
    }

    console.log(`${dateInputs.length} tarih inputu bulundu`);
    if (dateInputs.length >= 2) {
      setVal(dateInputs[0], start);
      setVal(dateInputs[1], end);
      console.log(`Tarihler ayarlandı: ${start} - ${end}`);
    } else if (dateInputs.length === 1) {
      setVal(dateInputs[0], start);
      console.log(`Sadece 1 tarih inputu bulundu, başlangıç ayarlandı: ${start}`);
    } else {
      console.error("Tarih inputları bulunamadı! RAD.scout() çalıştırıp paylaşın.");
    }
  }

  function clickSearch() {
    // "Ara" butonunu bul
    const araBtn = findByText("Ara", "button, input[type='button'], input[type='submit'], a, td, span");
    if (araBtn) {
      araBtn.el.click();
      console.log("Ara butonuna tıklandı");
      return true;
    }

    // Alternatif: magnify icon
    const imgs = findAllInFrames("img");
    for (const {el} of imgs) {
      const src = (el.src || "").toLowerCase();
      if (src.includes("search") || src.includes("ara") || src.includes("magnif") || src.includes("find")) {
        el.click();
        console.log("Arama ikonu tıklandı");
        return true;
      }
    }

    console.error("Arama butonu bulunamadı!");
    return false;
  }

  function getResults() {
    const frames = getAllDocs();
    const allRows = [];

    frames.forEach(f => {
      const tables = f.doc.querySelectorAll("table");
      tables.forEach(tbl => {
        const rows = tbl.querySelectorAll("tr");
        if (rows.length <= 1) return;

        const headers = Array.from(rows[0].querySelectorAll("th, td")).map(c => c.innerText.trim());
        if (headers.length < 3) return;

        console.log(`Tablo bulundu: ${headers.join(" | ")} (${rows.length - 1} satır)`);

        for (let i = 1; i < rows.length; i++) {
          const cells = Array.from(rows[i].querySelectorAll("td")).map(c => c.innerText.trim());
          if (cells.length >= 3 && cells.some(c => c.length > 0)) {
            const row = {};
            headers.forEach((h, j) => { row[h] = cells[j] || ""; });
            allRows.push(row);
          }
        }
      });
    });

    console.log(`\nToplam ${allRows.length} satır bulundu`);
    if (allRows.length > 0) {
      console.log("İlk 5 satır:");
      allRows.slice(0, 5).forEach((r, i) => console.log(`  [${i}]`, JSON.stringify(r)));
    }

    return allRows;
  }

  function downloadResults(data) {
    const rows = data || getResults();
    if (rows.length === 0) {
      console.error("İndirilecek veri yok!");
      return;
    }

    const headers = Object.keys(rows[0]);
    let csv = headers.join(",") + "\n";
    rows.forEach(r => {
      csv += headers.map(h => `"${(r[h] || "").replace(/"/g, '""')}"`).join(",") + "\n";
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "radyoloji_sonuclari_nisan_" + new Date().toISOString().slice(0,10) + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    console.log(`CSV indirildi: ${rows.length} satır`);
  }

  // Tablo satırına tıklayıp rapor detayını çekme
  async function getReportDetail(rowIndex) {
    const frames = getAllDocs();
    let targetRow = null;
    let rowCount = 0;

    for (const f of frames) {
      const tables = f.doc.querySelectorAll("table");
      for (const tbl of tables) {
        const rows = tbl.querySelectorAll("tbody tr, tr");
        if (rows.length <= 1) continue;
        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].querySelectorAll("td");
          if (cells.length >= 3) {
            if (rowCount === rowIndex) {
              targetRow = rows[i];
              break;
            }
            rowCount++;
          }
        }
        if (targetRow) break;
      }
      if (targetRow) break;
    }

    if (!targetRow) {
      console.error(`Satır ${rowIndex} bulunamadı (toplam ${rowCount} satır var)`);
      return null;
    }

    console.log("Satıra tıklanıyor...");
    targetRow.click();
    // Çift tıklama da dene
    targetRow.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));

    await sleep(2000);

    // Açılan rapor metnini çek
    const reportTexts = [];
    const docs = getAllDocs();
    docs.forEach(f => {
      const areas = f.doc.querySelectorAll("textarea, [contenteditable='true'], .ql-editor, [class*='rapor'], [class*='sonuc'], [class*='bulgu'], [id*='rapor'], [id*='sonuc']");
      areas.forEach(el => {
        const t = (el.value || el.innerText || el.textContent || "").trim();
        if (t.length > 10) reportTexts.push(t);
      });
    });

    console.log(`${reportTexts.length} rapor metni bulundu`);
    reportTexts.forEach((t, i) => console.log(`[${i}] ${t.slice(0, 300)}`));

    return reportTexts;
  }

  // Toplu rapor çekme
  async function fetchAllReports() {
    const results = getResults();
    if (results.length === 0) {
      console.error("Önce RAD.clickSearch() ile arama yapın!");
      return;
    }

    console.log(`\n=== ${results.length} SONUÇ İÇİN RAPOR ÇEKME ===`);
    const allReports = [];

    for (let i = 0; i < results.length; i++) {
      console.log(`\n[${i+1}/${results.length}]`);
      const texts = await getReportDetail(i);
      allReports.push({
        ...results[i],
        raporMetni: texts ? texts.join("\n---\n") : "BOŞ"
      });
      await sleep(1000);
    }

    // CSV indir
    if (allReports.length > 0) {
      const headers = Object.keys(allReports[0]);
      let csv = headers.join(",") + "\n";
      allReports.forEach(r => {
        csv += headers.map(h => `"${(r[h] || "").replace(/"/g, '""')}"`).join(",") + "\n";
      });
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "beyin_bt_raporlari_detay_" + new Date().toISOString().slice(0,10) + ".csv";
      a.click();
      URL.revokeObjectURL(url);
    }

    console.log(`\n=== TAMAMLANDI: ${allReports.length} rapor ===`);
    return allReports;
  }

  // Keşif yap
  scout();

  window.RAD = {
    scout: scout,
    search: search,
    setDates: setDates,
    selectBT: selectBT,
    autoBT: autoBT,
    clickSearch: clickSearch,
    getResults: getResults,
    downloadResults: downloadResults,
    getReportDetail: getReportDetail,
    fetchAllReports: fetchAllReports,
  };

  console.log("\n=== KOMUTLAR ===");
  console.log("RAD.scout()                              — DOM yapısını keşfet");
  console.log("RAD.search()                             — Filtreleri keşfet + BT seçeneklerini göster");
  console.log("RAD.autoBT()                             — Kranial/Beyin BT otomatik seç");
  console.log("RAD.selectBT('değer')                    — BT'yi elle seç");
  console.log("RAD.setDates('01.04.2026','15.04.2026')  — Tarih ayarla");
  console.log("RAD.clickSearch()                        — Ara butonuna bas");
  console.log("RAD.getResults()                         — Tablo sonuçlarını çek");
  console.log("RAD.downloadResults()                    — Sonuçları CSV indir");
  console.log("RAD.getReportDetail(0)                   — İlk satırın raporunu aç");
  console.log("RAD.fetchAllReports()                    — Tüm raporları tek tek çek + CSV indir");
})();
