/*
  SARUSPLUS — BEYİN BT RAPOR TOPLAMA SCRİPTİ
  =============================================
  
  KULLANIM:
  1. SARUSPLUS açık olsun (hasta takip ekranı)
  2. F12 > Console > "allow pasting" yazıp Enter
  3. Bu scripti yapıştırıp Enter
  4. Script otomatik çalışır
  
  İŞ AKIŞI:
  - CSV'deki her hasta için ARŞİV alanına TC yazar
  - Arama yapar
  - Geçmiş sekmesine tıklar
  - BT raporlarını çeker
  - Sonunda tüm raporları CSV olarak indirir
*/

(function() {
  "use strict";
  console.log("=== BEYİN BT RAPOR TOPLAMA v3 ===");

  // ====== YARDIMCI FONKSİYONLAR ======

  function getAllDocs() {
    const docs = [document];
    function dig(doc) {
      try {
        const frames = doc.querySelectorAll("iframe, frame");
        frames.forEach(f => {
          try {
            const d = f.contentDocument || f.contentWindow.document;
            if (d) { docs.push(d); dig(d); }
          } catch(e) {}
        });
      } catch(e) {}
    }
    dig(document);
    return docs;
  }

  function findElementByText(text, tag) {
    const docs = getAllDocs();
    for (const doc of docs) {
      const els = doc.querySelectorAll(tag || "*");
      for (const el of els) {
        if (el.innerText && el.innerText.trim().includes(text)) return el;
        if (el.textContent && el.textContent.trim().includes(text)) return el;
        if (el.value && el.value.includes(text)) return el;
      }
    }
    return null;
  }

  function findInputNear(labelText) {
    const docs = getAllDocs();
    for (const doc of docs) {
      const labels = doc.querySelectorAll("label, span, td, div");
      for (const lbl of labels) {
        const t = (lbl.innerText || lbl.textContent || "").trim();
        if (t.includes(labelText)) {
          let input = lbl.querySelector("input, textarea");
          if (input) return input;
          let next = lbl.nextElementSibling;
          while (next) {
            input = next.querySelector ? next.querySelector("input, textarea") : null;
            if (input) return input;
            if (next.tagName === "INPUT" || next.tagName === "TEXTAREA") return next;
            next = next.nextElementSibling;
          }
          const parent = lbl.parentElement;
          if (parent) {
            input = parent.querySelector("input, textarea");
            if (input) return input;
          }
        }
      }

      const allInputs = doc.querySelectorAll("input[type='text'], input:not([type])");
      for (const inp of allInputs) {
        if (inp.id && inp.id.toLowerCase().includes("arsiv")) return inp;
        if (inp.name && inp.name.toLowerCase().includes("arsiv")) return inp;
        if (inp.placeholder && inp.placeholder.toLowerCase().includes("arşiv")) return inp;
      }
    }
    return null;
  }

  function findClickable(text) {
    const docs = getAllDocs();
    for (const doc of docs) {
      const els = doc.querySelectorAll("a, button, span, div, td, li, [onclick], [class*='tab'], [role='tab'], [class*='Tab']");
      for (const el of els) {
        const t = (el.innerText || el.textContent || "").trim();
        if (t === text || t.startsWith(text)) return el;
      }
    }
    return null;
  }

  function findSearchButton() {
    const docs = getAllDocs();
    for (const doc of docs) {
      const btns = doc.querySelectorAll("button, input[type='button'], input[type='submit'], a, img[onclick], [onclick]");
      for (const btn of btns) {
        const t = (btn.title || btn.alt || btn.value || btn.innerText || "").toLowerCase();
        if (t.includes("ara") || t.includes("search") || t.includes("bul") || t.includes("sorgula")) return btn;
        if (btn.className && (btn.className.includes("search") || btn.className.includes("Search"))) return btn;
      }
      const searchIcons = doc.querySelectorAll("img[src*='search'], img[src*='ara'], img[src*='magnif']");
      if (searchIcons.length > 0) return searchIcons[0];
    }
    return null;
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function setInputValue(input, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, "value"
    ).set;
    nativeInputValueSetter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
  }

  function extractVisibleReportText() {
    const docs = getAllDocs();
    const reports = [];

    for (const doc of docs) {
      const textareas = doc.querySelectorAll("textarea");
      textareas.forEach(ta => {
        const val = (ta.value || ta.innerText || "").trim();
        if (val.length > 10) reports.push({ type: "textarea", id: ta.id, text: val });
      });

      const editables = doc.querySelectorAll("[contenteditable='true']");
      editables.forEach(el => {
        const val = (el.innerText || el.textContent || "").trim();
        if (val.length > 10) reports.push({ type: "editable", id: el.id, text: val });
      });

      const reportDivs = doc.querySelectorAll(
        "[class*='rapor'], [class*='Rapor'], [class*='report'], [class*='sonuc'], [class*='Sonuc'], " +
        "[class*='bulgu'], [class*='Bulgu'], [id*='rapor'], [id*='sonuc'], [id*='bulgu']"
      );
      reportDivs.forEach(el => {
        const val = (el.innerText || el.textContent || "").trim();
        if (val.length > 20) reports.push({ type: "div", id: el.id || el.className?.toString?.()?.slice(0,30), text: val });
      });
    }

    return reports;
  }

  // ====== ANA FONKSİYONLAR ======

  // Adım 1: ARŞİV alanını bul ve DOM yapısını göster
  function scout() {
    console.log("\n--- DOM KEŞFİ ---");
    const docs = getAllDocs();
    console.log(`Toplam ${docs.length} frame/document bulundu`);

    const arsivInput = findInputNear("ARŞİV");
    console.log("ARŞİV input:", arsivInput ? `BULUNDU (id:${arsivInput.id}, name:${arsivInput.name})` : "BULUNAMADI");

    const gecmisTab = findClickable("Geçmiş");
    console.log("Geçmiş tab:", gecmisTab ? `BULUNDU (${gecmisTab.tagName}#${gecmisTab.id})` : "BULUNAMADI");

    const searchBtn = findSearchButton();
    console.log("Arama butonu:", searchBtn ? `BULUNDU (${searchBtn.tagName})` : "BULUNAMADI");

    // Tüm input alanlarını listele
    console.log("\n--- TÜM INPUT ALANLARI ---");
    docs.forEach((doc, i) => {
      const inputs = doc.querySelectorAll("input, textarea");
      inputs.forEach(inp => {
        const val = (inp.value || "").slice(0, 50);
        if (inp.type !== "hidden") {
          console.log(`[frame${i}] <${inp.tagName}> id:${inp.id} name:${inp.name} type:${inp.type} placeholder:"${inp.placeholder}" value:"${val}"`);
        }
      });
    });

    // Tüm tıklanabilir sekmeleri listele
    console.log("\n--- SEKMELER / TABLAR ---");
    docs.forEach((doc, i) => {
      const tabs = doc.querySelectorAll("[class*='tab'], [class*='Tab'], [role='tab'], li > a, .nav-link");
      tabs.forEach(tab => {
        const t = (tab.innerText || tab.textContent || "").trim().slice(0, 40);
        if (t) console.log(`[frame${i}] ${tab.tagName}#${tab.id} .${tab.className?.toString?.()?.slice(0,30)} → "${t}"`);
      });
    });

    return { arsivInput, gecmisTab, searchBtn };
  }

  // Adım 2: Tek hasta için rapor çek
  async function fetchReport(tc) {
    console.log(`\n--- HASTA: ${tc} ---`);

    const arsivInput = findInputNear("ARŞİV");
    if (!arsivInput) {
      console.error("ARŞİV input bulunamadı! scout() çalıştırıp sonucu paylaşın.");
      return null;
    }

    arsivInput.focus();
    arsivInput.value = "";
    setInputValue(arsivInput, tc);
    console.log("TC yazıldı:", tc);

    await sleep(500);

    const searchBtn = findSearchButton();
    if (searchBtn) {
      searchBtn.click();
      console.log("Arama butonu tıklandı");
    } else {
      arsivInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 13, bubbles: true }));
      arsivInput.dispatchEvent(new KeyboardEvent("keypress", { key: "Enter", keyCode: 13, bubbles: true }));
      arsivInput.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", keyCode: 13, bubbles: true }));
      console.log("Enter gönderildi");
    }

    await sleep(2000);

    const gecmisTab = findClickable("Geçmiş");
    if (gecmisTab) {
      gecmisTab.click();
      console.log("Geçmiş sekmesi tıklandı");
      await sleep(2000);
    } else {
      console.warn("Geçmiş sekmesi bulunamadı");
    }

    const reports = extractVisibleReportText();
    console.log(`${reports.length} rapor elementi bulundu`);
    reports.forEach((r, i) => {
      console.log(`[${i}] ${r.type} → ${r.text.slice(0, 200)}...`);
    });

    return reports;
  }

  // Adım 3: Toplu rapor çekme
  async function batchFetch(tcList) {
    const allResults = [];
    console.log(`\n=== TOPLU ÇEKME: ${tcList.length} hasta ===`);

    for (let i = 0; i < tcList.length; i++) {
      console.log(`\n[${i+1}/${tcList.length}] ${tcList[i]}`);
      const reports = await fetchReport(tcList[i]);
      allResults.push({
        tc: tcList[i],
        reports: reports || [],
        reportText: reports && reports.length > 0 ? reports.map(r => r.text).join("\n---\n") : "RAPOR BULUNAMADI"
      });
      await sleep(1500);
    }

    // CSV indir
    let csv = "TC,RaporSayisi,RaporMetni\n";
    allResults.forEach(r => {
      csv += `${r.tc},${r.reports.length},"${r.reportText.replace(/"/g, '""').replace(/\n/g, " | ")}"\n`;
    });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "beyin_bt_raporlari_" + new Date().toISOString().slice(0,10) + ".csv";
    a.click();
    URL.revokeObjectURL(url);

    console.log(`\n=== TAMAMLANDI: ${allResults.length} hasta, ${allResults.filter(r => r.reports.length > 0).length} rapor bulundu ===`);
    return allResults;
  }

  // KEŞİF yap
  const { arsivInput, gecmisTab, searchBtn } = scout();

  // Global erişim
  window.BT = {
    scout: scout,
    fetchReport: fetchReport,
    batchFetch: batchFetch,
    extractReports: extractVisibleReportText,

    // Tek TC ile test
    test: function(tc) { return fetchReport(tc); },

    // İlk 5 hasta ile test
    test5: function(tcList) { return batchFetch(tcList.slice(0, 5)); },

    // CSV'deki tüm TC'ler (dışarıdan yüklenecek)
    runAll: function(tcList) { return batchFetch(tcList); },
  };

  console.log("\n=== KOMUTLAR ===");
  console.log("BT.scout()                          — DOM yapısını tekrar keşfet");
  console.log("BT.test('20977677746')               — Tek hasta test et");
  console.log("BT.test5(['tc1','tc2','tc3','tc4','tc5']) — 5 hasta test");
  console.log("BT.extractReports()                  — Ekrandaki raporları çek");
  console.log("BT.runAll(['tc1','tc2',...])           — Toplu çalıştır + CSV indir");
  console.log("");
  console.log("ÖNCELİKLE: Konsoldaki 'TÜM INPUT ALANLARI' kısmını buraya paylaşın");
  console.log("ki ARŞİV alanını doğru bulabileyim.");
})();
