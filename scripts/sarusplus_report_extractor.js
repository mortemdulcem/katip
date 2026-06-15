/*
  SARUSPLUS RAPOR ÇEKME SCRİPTİ
  ==============================
  
  KULLANIM:
  1. SARUSPLUS'ta bir hastanın sayfasını açın
  2. F12 > Console > allow pasting > Enter
  3. Bu scripti yapıştırın > Enter
  
  İki mod var:
  A) Tek hasta: Açık olan hastanın raporunu çeker
  B) Toplu: Tüm hastaları tek tek açıp raporlarını çeker (yarı otomatik)
*/

(function() {
  console.log("=== SARUSPLUS RAPOR ÇEKME v2 ===");

  function getAllFrameDocuments() {
    const docs = [document];
    function collectFrames(doc) {
      try {
        const frames = doc.querySelectorAll("iframe, frame");
        frames.forEach(f => {
          try {
            const fd = f.contentDocument || f.contentWindow.document;
            if (fd) {
              docs.push(fd);
              collectFrames(fd);
            }
          } catch(e) {}
        });
      } catch(e) {}
    }
    collectFrames(document);
    return docs;
  }

  function findTextInAllFrames(selectors) {
    const docs = getAllFrameDocuments();
    const results = [];
    docs.forEach((doc, docIdx) => {
      selectors.forEach(sel => {
        try {
          const els = doc.querySelectorAll(sel);
          els.forEach(el => {
            const text = (el.value || el.innerText || el.textContent || "").trim();
            if (text && text.length > 5) {
              results.push({
                source: `frame${docIdx}`,
                selector: sel,
                tag: el.tagName,
                id: el.id,
                className: el.className?.toString?.()?.slice(0, 50) || "",
                text: text.slice(0, 2000)
              });
            }
          });
        } catch(e) {}
      });
    });
    return results;
  }

  function findReportContent() {
    const reportSelectors = [
      "textarea",
      "[contenteditable='true']",
      "[class*='rapor']", "[class*='Rapor']", "[class*='report']", "[class*='Report']",
      "[class*='sonuc']", "[class*='Sonuc']", "[class*='result']",
      "[class*='bulgu']", "[class*='Bulgu']", "[class*='finding']",
      "[class*='doktor']", "[class*='Doktor']", "[class*='doctor']",
      "[class*='note']", "[class*='Note']", "[class*='not']",
      "[class*='editor']", "[class*='Editor']",
      "[class*='text']", "[class*='Text']",
      "[id*='rapor']", "[id*='Rapor']", "[id*='report']",
      "[id*='sonuc']", "[id*='Sonuc']",
      "[id*='bulgu']", "[id*='Bulgu']",
      "[id*='doktor']", "[id*='doctor']",
      "[id*='not']", "[id*='note']",
      ".ql-editor",
      ".fr-element",
      ".tox-edit-area",
      "[role='textbox']",
      "div[contenteditable]",
      "pre", "code",
    ];
    return findTextInAllFrames(reportSelectors);
  }

  function findPatientInfo() {
    const patientSelectors = [
      "[class*='hasta']", "[class*='Hasta']", "[class*='patient']",
      "[class*='kimlik']", "[class*='Kimlik']", "[class*='tc']",
      "[class*='ad']", "[class*='Ad']", "[class*='name']",
      "[id*='hasta']", "[id*='patient']",
      "[id*='tc']", "[id*='kimlik']",
      "[id*='ad']", "[id*='name']",
    ];
    return findTextInAllFrames(patientSelectors);
  }

  function extractAllTextAreas() {
    const docs = getAllFrameDocuments();
    const areas = [];
    docs.forEach((doc, i) => {
      const tas = doc.querySelectorAll("textarea, [contenteditable='true'], input[type='text']");
      tas.forEach(ta => {
        const val = (ta.value || ta.innerText || ta.textContent || "").trim();
        if (val && val.length > 3) {
          areas.push({
            frame: i,
            tag: ta.tagName,
            id: ta.id,
            name: ta.name || "",
            placeholder: ta.placeholder || "",
            text: val.slice(0, 3000)
          });
        }
      });
    });
    return areas;
  }

  function dumpAllVisibleText() {
    const docs = getAllFrameDocuments();
    const texts = [];
    docs.forEach((doc, i) => {
      const walker = doc.createTreeWalker(doc.body || doc.documentElement, NodeFilter.SHOW_TEXT);
      let node;
      while (node = walker.nextNode()) {
        const t = node.textContent.trim();
        if (t.length > 10 && t.length < 5000 && !/^\s*$/.test(t)) {
          const parent = node.parentElement;
          const tag = parent ? parent.tagName : "?";
          const id = parent ? (parent.id || parent.className?.toString?.()?.slice(0,30) || "") : "";
          texts.push({ frame: i, tag, id, text: t });
        }
      }
    });
    return texts;
  }

  const reportContent = findReportContent();
  const patientInfo = findPatientInfo();
  const textAreas = extractAllTextAreas();

  console.log("\n--- RAPOR İÇERİĞİ ---");
  console.log(`${reportContent.length} rapor elementi bulundu:`);
  reportContent.forEach((r, i) => {
    console.log(`\n[Rapor ${i}] frame:${r.source} tag:${r.tag} id:${r.id}`);
    console.log(r.text);
  });

  console.log("\n--- HASTA BİLGİSİ ---");
  console.log(`${patientInfo.length} hasta elementi bulundu:`);
  patientInfo.forEach((p, i) => {
    console.log(`[Hasta ${i}] ${p.tag}#${p.id} → ${p.text.slice(0,100)}`);
  });

  console.log("\n--- TEXTAREA / INPUT ALANLARI ---");
  console.log(`${textAreas.length} alan bulundu:`);
  textAreas.forEach((ta, i) => {
    console.log(`[Alan ${i}] ${ta.tag} id:${ta.id} name:${ta.name} → ${ta.text.slice(0,200)}`);
  });

  console.log("\n--- TÜM FRAME SAYISI ---");
  console.log(`${getAllFrameDocuments().length} frame/document bulundu`);

  // Eğer hiçbir şey bulunamadıysa, tüm görünür metni dök
  if (reportContent.length === 0 && textAreas.length === 0) {
    console.log("\n--- TÜM GÖRÜNÜR METİNLER (rapor bulunamadı, tüm metin dökülüyor) ---");
    const allText = dumpAllVisibleText();
    allText.forEach((t, i) => {
      console.log(`[${i}] frame:${t.frame} <${t.tag}> ${t.id} → ${t.text.slice(0,300)}`);
    });
  }

  // CSV olarak kaydet
  function downloadResults() {
    let csv = "Tip,Frame,Tag,ID,Metin\n";
    reportContent.forEach(r => {
      csv += `Rapor,${r.source},${r.tag},${r.id},"${r.text.replace(/"/g, '""')}"\n`;
    });
    textAreas.forEach(ta => {
      csv += `TextArea,frame${ta.frame},${ta.tag},${ta.id},"${ta.text.replace(/"/g, '""')}"\n`;
    });
    patientInfo.forEach(p => {
      csv += `Hasta,${p.source},${p.tag},${p.id},"${p.text.replace(/"/g, '""').slice(0,500)}"\n`;
    });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rapor_icerigi_" + new Date().toISOString().slice(0,10) + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    console.log("CSV indirildi!");
  }

  downloadResults();

  window.RAPOR = {
    extract: findReportContent,
    patient: findPatientInfo,
    textAreas: extractAllTextAreas,
    allText: dumpAllVisibleText,
    download: downloadResults,
  };

  console.log("\n=== TAMAMLANDI ===");
  console.log("Tekrar çekmek için: RAPOR.extract()");
  console.log("Tüm metinleri görmek için: RAPOR.allText()");
  console.log("CSV indirmek için: RAPOR.download()");
})();
