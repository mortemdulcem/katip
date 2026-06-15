/*
  SARUS HASTA GEÇMİŞİ — OTOMATİK BT RAPOR ÇEKME v3
  ====================================================
  
  URL: hbys.besk.local/sarus.common/forms/PatientHistoryBoard
  
  TEK KOMUT: HG.start()
  - CSV'deki 917 TC'yi otomatik okur
  - Her TC için: Ara → Arşiv No tıkla → RAD → BT raporu çek
  - Sonunda CSV indirir
  
  KULLANIM:
  1. Sayfayı açın
  2. F12 > Console > allow pasting > Enter
  3. Bu scripti yapıştırın > Enter
  4. HG.start() yazın > Enter
  5. Bekleyin, bitince CSV otomatik iner
*/

(function() {
  "use strict";
  console.log("=== OTOMATİK BT RAPOR ÇEKME v3 ===");

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // 917 hastanın TC listesi — CSV'den alındı
  var TC_LIST = [];
  var ALL_RESULTS = [];
  var RUNNING = false;

  // CSV'yi fetch et ve TC'leri parse et
  async function loadTCList() {
    try {
      // Replit'teki CSV'den yükle
      const csvUrl = "https://3497a6be-5b71-4e20-a4cb-1d8575ba7ba9-00-26e1ut5qddpjk.picard.replit.dev/brain_ct_patients.csv";
      console.log("CSV indiriliyor...");
      const resp = await fetch(csvUrl);
      const text = await resp.text();
      const lines = text.trim().split("\n");
      TC_LIST = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");
        if (cols[0]) {
          const tc = cols[0].replace(/^"=""/, "").replace(/""?"$/, "").trim();
          if (tc && tc.length >= 10) {
            const rawName = cols[1] || "";
            const name = rawName.replace(/^"=""/, "").replace(/""?"$/, "").trim();
            TC_LIST.push({ tc, name });
          }
        }
      }
      console.log(`${TC_LIST.length} hasta yüklendi`);
      return TC_LIST;
    } catch(e) {
      console.error("CSV yüklenemedi:", e.message);
      console.log("Manuel yükleme: HG.setList(['tc1','tc2',...])");
      return [];
    }
  }

  function setInput(el, val) {
    el.focus();
    el.value = "";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.value = val;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function findInput(index) {
    return document.querySelectorAll("input:not([type='hidden'])")[index] || null;
  }

  // ========== TEK HASTA İŞLE ==========
  async function processPatient(tc, patientName, idx, total) {
    const label = patientName ? `${patientName} (${tc})` : tc;
    console.log(`\n[${idx+1}/${total}] ${label}`);

    // 1. Kimlik No alanına yaz (2. input)
    const tcInput = findInput(1);
    if (!tcInput) { console.error("Kimlik input bulunamadı!"); return { tc, status: "INPUT_YOK" }; }
    
    // Önce diğer alanları temizle
    const adInput = findInput(0);
    if (adInput) setInput(adInput, "");
    setInput(tcInput, tc);
    await sleep(300);

    // 2. Ara butonuna bas
    const btns = document.querySelectorAll("button, .btn, input[type='button'], [role='button']");
    let araBtn = null;
    for (const b of btns) {
      const t = (b.value || b.innerText || "").trim().toLowerCase();
      if (t === "ara" || t === "search") { araBtn = b; break; }
    }
    if (araBtn) {
      araBtn.click();
    } else {
      tcInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 13, bubbles: true }));
    }
    await sleep(2500);

    // 3. Arşiv No'ya tıkla — sol paneldeki sonuçta TC'yi içeren tıklanabilir elementi bul
    let patientClicked = false;

    // Yöntem A: TC numarasını içeren herhangi bir tıklanabilir element
    const allEls = document.querySelectorAll("a, span, div, td, button, badge, .badge");
    for (const el of allEls) {
      const t = (el.innerText || el.textContent || "").trim();
      // Arşiv no badge'i veya TC içeren küçük element
      if (t.length > 0 && t.length < 30) {
        // Arşiv numarası olabilir (sadece rakam, 5-10 hane)
        const parent = el.parentElement;
        const parentText = parent ? (parent.innerText || "").trim() : "";
        if (parentText.includes(tc)) {
          // Bu TC'nin satırındaki tıklanabilir badge/link
          const onclick = el.getAttribute("onclick") || el.style?.cursor;
          if (onclick || el.tagName === "A" || el.classList?.contains("badge") || el.style?.cursor === "pointer") {
            el.click();
            console.log(`  Arşiv No tıklandı: "${t}"`);
            patientClicked = true;
            await sleep(2500);
            break;
          }
        }
      }
    }

    // Yöntem B: TC'yi içeren satırdaki herhangi bir yere tıkla
    if (!patientClicked) {
      for (const el of allEls) {
        const t = (el.innerText || "").trim();
        if (t.includes(tc) && el.tagName !== "INPUT" && t.length < 200) {
          el.click();
          console.log(`  TC satırına tıklandı: "${t.slice(0, 60)}"`);
          patientClicked = true;
          await sleep(2500);
          break;
        }
      }
    }

    // Yöntem C: Checkbox varsa tıkla
    if (!patientClicked) {
      const cbs = document.querySelectorAll("input[type='checkbox']");
      for (const cb of cbs) {
        const row = cb.closest("tr, div, li");
        if (row && (row.innerText || "").includes(tc)) {
          cb.click();
          await sleep(500);
          // Sonra satıra da tıkla
          row.click();
          console.log(`  Checkbox + satır tıklandı`);
          patientClicked = true;
          await sleep(2500);
          break;
        }
      }
    }

    if (!patientClicked) {
      console.warn(`  Hasta seçilemedi: ${tc}`);
      return { tc, name: patientName, status: "SECILEMEDI", rapor: "" };
    }

    // 4. RAD sekmesine tıkla
    let radClicked = false;
    const tabEls = document.querySelectorAll("a, span, div, td, button, li, [role='tab']");
    for (const el of tabEls) {
      const t = (el.innerText || el.title || "").trim().toUpperCase();
      if (t === "RAD" || t === "RAD." || t === "RADYOLOJİ") {
        el.click();
        console.log("  RAD sekmesi tıklandı");
        radClicked = true;
        await sleep(2000);
        break;
      }
    }

    // Tooltip ile bul
    if (!radClicked) {
      const titled = document.querySelectorAll("[title], [data-original-title]");
      for (const el of titled) {
        const title = (el.title || el.getAttribute("data-original-title") || "").toLowerCase();
        if (title.includes("rad") || title.includes("radyoloji")) {
          el.click();
          console.log("  RAD (title) tıklandı");
          radClicked = true;
          await sleep(2000);
          break;
        }
      }
    }

    if (!radClicked) {
      console.warn("  RAD sekmesi bulunamadı");
    }

    // 5. Sayfadaki BT ile ilgili metinleri çek
    await sleep(1000);
    const pageText = document.body.innerText;
    const lines = pageText.split("\n").map(l => l.trim()).filter(l => l.length > 5);
    
    // BT/Kranial/Tomografi içeren satırları bul
    const btLines = lines.filter(l => {
      const lower = l.toLowerCase();
      return (lower.includes("bt ") || lower.includes(" bt") || lower.includes("tomografi") || 
              lower.includes("kranial") || lower.includes("beyin bt") || lower.includes("cranial")) &&
             !lower.includes("antibiy") && !lower.includes("nabız");
    });

    // Nisan 2026 ile ilgili satırları da çek
    const aprilLines = lines.filter(l => {
      return l.includes("04.2026") || l.includes("04/2026") || l.includes("2026-04");
    });

    // Rapor metni olabilecek uzun metinleri çek
    const reportTexts = [];
    const textAreas = document.querySelectorAll("textarea, [contenteditable='true']");
    textAreas.forEach(ta => {
      const v = (ta.value || ta.innerText || "").trim();
      if (v.length > 20) reportTexts.push(v);
    });

    // Tablo satırlarından rapor bilgisi
    const tableRows = [];
    document.querySelectorAll("table tr").forEach(tr => {
      const cells = Array.from(tr.querySelectorAll("td")).map(c => c.innerText.trim());
      if (cells.length >= 2 && cells.some(c => c.length > 0)) {
        const rowText = cells.join(" | ");
        const lower = rowText.toLowerCase();
        if (lower.includes("bt") || lower.includes("tomografi") || lower.includes("kranial") || lower.includes("04.2026")) {
          tableRows.push(rowText);
        }
      }
    });

    const rapor = [
      ...btLines.map(l => "[BT] " + l),
      ...aprilLines.map(l => "[NİSAN] " + l),
      ...reportTexts.map(t => "[RAPOR] " + t),
      ...tableRows.map(t => "[TABLO] " + t)
    ].join("\n");

    if (rapor) {
      console.log(`  ${btLines.length} BT satırı, ${aprilLines.length} Nisan satırı, ${tableRows.length} tablo satırı bulundu`);
    } else {
      console.log("  Veri bulunamadı");
    }

    return { tc, name: patientName, status: rapor ? "BULUNDU" : "BOS", rapor };
  }

  // ========== ANA FONKSİYON ==========
  async function start(startFrom, count) {
    if (RUNNING) { console.warn("Zaten çalışıyor!"); return; }
    RUNNING = true;

    // TC listesi yüklü değilse yükle
    if (TC_LIST.length === 0) {
      await loadTCList();
    }

    if (TC_LIST.length === 0) {
      console.error("Hasta listesi boş! CSV yüklenemedi.");
      RUNNING = false;
      return;
    }

    const from = startFrom || 0;
    const to = count ? Math.min(from + count, TC_LIST.length) : TC_LIST.length;
    const subset = TC_LIST.slice(from, to);

    console.log(`\n========================================`);
    console.log(`BAŞLIYOR: ${subset.length} hasta (${from+1} - ${to}/${TC_LIST.length})`);
    console.log(`========================================`);

    for (let i = 0; i < subset.length; i++) {
      if (!RUNNING) { console.log("DURDURULDU!"); break; }
      
      const result = await processPatient(subset[i].tc, subset[i].name, from + i, TC_LIST.length);
      ALL_RESULTS.push(result);

      // Her 50 hastada ara kayıt
      if ((i + 1) % 50 === 0) {
        downloadResults(`bt_raporlari_arakayit_${from+1}-${from+i+1}`);
        console.log(`\n=== ARA KAYIT: ${i+1}/${subset.length} tamamlandı ===\n`);
      }
    }

    // Final CSV indir
    downloadResults(`bt_raporlari_final_${from+1}-${to}`);
    
    const bulundu = ALL_RESULTS.filter(r => r.status === "BULUNDU").length;
    const bos = ALL_RESULTS.filter(r => r.status === "BOS").length;
    const hata = ALL_RESULTS.filter(r => r.status === "SECILEMEDI" || r.status === "INPUT_YOK").length;

    console.log(`\n========================================`);
    console.log(`TAMAMLANDI: ${ALL_RESULTS.length} hasta`);
    console.log(`  Rapor bulunan: ${bulundu}`);
    console.log(`  Boş: ${bos}`);
    console.log(`  Hata: ${hata}`);
    console.log(`========================================`);

    RUNNING = false;
    return ALL_RESULTS;
  }

  function stop() {
    RUNNING = false;
    console.log("Durdurma sinyali gönderildi. Mevcut hasta bittikten sonra duracak.");
  }

  function downloadResults(filename) {
    if (ALL_RESULTS.length === 0) { console.warn("İndirilecek veri yok!"); return; }

    let csv = "TC,HastaAdi,Durum,Rapor\n";
    ALL_RESULTS.forEach(r => {
      csv += `${r.tc},"${(r.name || "").replace(/"/g, '""')}",${r.status},"${(r.rapor || "").replace(/"/g, '""').replace(/\n/g, " | ")}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (filename || "bt_raporlari") + "_" + new Date().toISOString().slice(0,10) + ".csv";
    a.click();
    console.log(`CSV indirildi: ${ALL_RESULTS.length} kayıt`);
  }

  function reset() {
    ALL_RESULTS = [];
    console.log("Sonuçlar sıfırlandı.");
  }

  window.HG = {
    start: start,
    stop: stop,
    download: downloadResults,
    reset: reset,
    setList: function(list) { 
      TC_LIST = list.map(tc => ({ tc, name: "" })); 
      console.log(`${TC_LIST.length} TC yüklendi`); 
    },
    loadCSV: loadTCList,
    test1: function(tc) { return processPatient(tc, "", 0, 1); },
    results: function() { return ALL_RESULTS; },
    status: function() {
      console.log(`Çalışıyor: ${RUNNING}`);
      console.log(`Toplam TC: ${TC_LIST.length}`);
      console.log(`İşlenen: ${ALL_RESULTS.length}`);
      console.log(`Bulunan: ${ALL_RESULTS.filter(r => r.status === "BULUNDU").length}`);
    }
  };

  console.log("\n=== KOMUTLAR ===");
  console.log("HG.start()           — 917 hastanın TAMAMINI çek (tam otomatik)");
  console.log("HG.start(0, 10)      — İlk 10 hastayı çek (test için)");
  console.log("HG.start(100, 50)    — 101-150 arası hastaları çek");
  console.log("HG.stop()            — Çalışmayı durdur");
  console.log("HG.status()          — İlerleme durumu");
  console.log("HG.download()        — Mevcut sonuçları CSV indir");
  console.log("HG.reset()           — Sonuçları sıfırla");
  console.log("HG.test1('TC')       — Tek hasta test");
  console.log("");
  console.log("ÖNCELİKLE TEST: HG.start(0, 5)");
})();
