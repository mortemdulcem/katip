/*
  PACS BEYİN BT — BASİT VERSİYON v6
  ====================================
  
  SİZ elle sayfa sayfa gezin, her sayfada:
    PACS.ekle()
  yazın. Script o sayfadaki beyin BT'leri toplar.
  
  Bitince:
    PACS.indir()
  yazın. Tüm toplananlar CSV olarak iner.
  
  KULLANIM:
  1. PACS'ta CT + Nisan araması yapın (250 sonuç)
  2. F12 > Console > bu scripti yapıştırın
  3. Sayfa 1'deyken: PACS.ekle()
  4. Elle sayfa 2'ye geçin: PACS.ekle()
  5. Elle sayfa 3'e geçin: PACS.ekle()
  6. ... 10. sayfaya kadar devam
  7. PACS.indir()
*/

(function() {
  "use strict";
  
  var ALL_CT = [];
  var BRAIN_CT = [];
  var pagesDone = [];

  var BRAIN_WORDS = ["beyin", "brain", "kranial", "cranial", "head", "kafa", "serebr", "cerebr"];
  
  function isBrain(text) {
    var low = (text || "").toLowerCase();
    for (var i = 0; i < BRAIN_WORDS.length; i++) {
      if (low.indexOf(BRAIN_WORDS[i]) >= 0) return true;
    }
    return false;
  }

  function readTable() {
    var rows = [];
    var tables = document.querySelectorAll("table");
    
    for (var t = 0; t < tables.length; t++) {
      var tbl = tables[t];
      var trs = tbl.querySelectorAll("tr");
      if (trs.length < 3) continue;
      
      var ths = trs[0].querySelectorAll("th");
      if (ths.length < 4) continue;
      
      var headers = [];
      for (var h = 0; h < ths.length; h++) headers.push(ths[h].innerText.trim());
      
      var hasHasta = false;
      for (var k = 0; k < headers.length; k++) {
        var hh = headers[k];
        if (hh.indexOf("Hasta") >= 0 || hh.indexOf("Modal") >= 0 || hh.indexOf("A") >= 0) { hasHasta = true; break; }
      }
      if (!hasHasta) continue;

      for (var r = 1; r < trs.length; r++) {
        var cells = trs[r].querySelectorAll("td");
        if (cells.length < 4) continue;
        var row = {};
        for (var c = 0; c < cells.length && c < headers.length; c++) {
          row[headers[c]] = cells[c].innerText.trim();
        }
        var ad = row["Hasta Ad\u0131"] || row["Hasta Adı"] || row[headers[0]] || "";
        if (ad.length > 1) rows.push(row);
      }
      
      if (rows.length > 0) break;
    }
    return rows;
  }

  function ekle() {
    var rows = readTable();
    if (rows.length === 0) {
      console.error("Tabloda veri bulunamadı!");
      console.log("Sayfa yüklendi mi? Sonuçlar göründü mü?");
      return;
    }

    var sayfa = "?";
    var inputs = document.querySelectorAll("input[type='text']");
    for (var i = 0; i < inputs.length; i++) {
      var v = inputs[i].value.trim();
      if (v.match(/^\d+$/) && parseInt(v) >= 1 && parseInt(v) <= 50) {
        sayfa = v;
        break;
      }
    }

    if (pagesDone.indexOf(sayfa) >= 0) {
      console.warn("Sayfa " + sayfa + " zaten eklenmişti! Tekrar eklenmiyor.");
      console.log("Durum: " + ALL_CT.length + " CT, " + BRAIN_CT.length + " beyin BT");
      return;
    }

    var newBrain = 0;
    for (var r = 0; r < rows.length; r++) {
      ALL_CT.push(rows[r]);
      var desc = "";
      var keys = Object.keys(rows[r]);
      for (var k = 0; k < keys.length; k++) {
        if (keys[k].toLowerCase().indexOf("a") >= 0 && keys[k].toLowerCase().indexOf("klama") >= 0) {
          desc = rows[r][keys[k]];
          break;
        }
      }
      if (!desc) {
        for (var k2 = 0; k2 < keys.length; k2++) {
          if (keys[k2].indexOf("Açıklama") >= 0 || keys[k2].indexOf("klama") >= 0 || keys[k2].indexOf("Description") >= 0) {
            desc = rows[r][keys[k2]];
            break;
          }
        }
      }
      if (!desc) desc = JSON.stringify(rows[r]);
      
      if (isBrain(desc)) {
        BRAIN_CT.push(rows[r]);
        newBrain++;
      }
    }

    pagesDone.push(sayfa);

    console.log("");
    console.log("✓ Sayfa " + sayfa + " eklendi!");
    console.log("  Bu sayfada: " + rows.length + " CT, " + newBrain + " beyin BT");
    console.log("  TOPLAM: " + ALL_CT.length + " CT, " + BRAIN_CT.length + " beyin BT");
    console.log("  Eklenen sayfalar: " + pagesDone.join(", "));
    console.log("");

    if (BRAIN_CT.length > 0) {
      var last = BRAIN_CT[BRAIN_CT.length - 1];
      var lastAd = last["Hasta Ad\u0131"] || last["Hasta Adı"] || last[Object.keys(last)[0]] || "";
      console.log("  Son eklenen beyin BT: " + lastAd);
    }

    console.log("");
    console.log("→ Sonraki sayfaya geçip tekrar PACS.ekle() yazın");
    console.log("→ Tüm sayfalar bittiyse PACS.indir() yazın");
  }

  function indir() {
    if (BRAIN_CT.length === 0) {
      console.error("Henüz beyin BT verisi yok! Önce PACS.ekle() ile sayfa ekleyin.");
      return;
    }
    downloadCSV(BRAIN_CT, "pacs_beyin_bt_" + BRAIN_CT.length + "_hasta");
    console.log("\n✓ " + BRAIN_CT.length + " beyin BT hastası CSV olarak indirildi!");
  }

  function indirHepsi() {
    if (ALL_CT.length === 0) {
      console.error("Henüz veri yok!");
      return;
    }
    downloadCSV(ALL_CT, "pacs_tum_ct_" + ALL_CT.length);
    console.log("\n✓ " + ALL_CT.length + " CT hastası CSV olarak indirildi!");
  }

  function downloadCSV(data, filename) {
    var headers = Object.keys(data[0]);
    var csv = headers.join(",") + "\n";
    for (var i = 0; i < data.length; i++) {
      var vals = [];
      for (var h = 0; h < headers.length; h++) {
        var v = (data[i][headers[h]] || "").toString().replace(/"/g, '""').replace(/\n/g, " ");
        vals.push('"' + v + '"');
      }
      csv += vals.join(",") + "\n";
    }
    var blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (filename || "pacs") + "_" + new Date().toISOString().slice(0,10) + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log("→ " + a.download);
  }

  function durum() {
    console.log("\n=== DURUM ===");
    console.log("Toplam CT: " + ALL_CT.length);
    console.log("Beyin BT:  " + BRAIN_CT.length);
    console.log("Sayfalar:  " + (pagesDone.length > 0 ? pagesDone.join(", ") : "henüz yok"));
    if (BRAIN_CT.length > 0) {
      console.log("\nSon 5 beyin BT:");
      var start = Math.max(0, BRAIN_CT.length - 5);
      for (var i = start; i < BRAIN_CT.length; i++) {
        var ad = BRAIN_CT[i]["Hasta Ad\u0131"] || BRAIN_CT[i]["Hasta Adı"] || BRAIN_CT[i][Object.keys(BRAIN_CT[i])[0]] || "";
        var desc = "";
        var keys = Object.keys(BRAIN_CT[i]);
        for (var k = 0; k < keys.length; k++) {
          if (keys[k].indexOf("klama") >= 0) { desc = BRAIN_CT[i][keys[k]]; break; }
        }
        console.log("  " + ad + " — " + desc);
      }
    }
    console.log("=============\n");
  }

  window.PACS = {
    ekle: ekle,
    indir: indir,
    indirHepsi: indirHepsi,
    durum: durum,
    sifirla: function() { ALL_CT = []; BRAIN_CT = []; pagesDone = []; console.log("Sıfırlandı."); },
  };

  console.log("");
  console.log("╔═══════════════════════════════════════════╗");
  console.log("║     PACS BEYİN BT — BASİT VERSİYON       ║");
  console.log("╠═══════════════════════════════════════════╣");
  console.log("║                                           ║");
  console.log("║  Her sayfada bir kez yazın:                ║");
  console.log("║                                           ║");
  console.log("║    PACS.ekle()                             ║");
  console.log("║                                           ║");
  console.log("║  Sonra elle sonraki sayfaya geçin.         ║");
  console.log("║  Tekrar PACS.ekle() yazın.                 ║");
  console.log("║  10 sayfa bitince:                         ║");
  console.log("║                                           ║");
  console.log("║    PACS.indir()     → beyin BT CSV         ║");
  console.log("║    PACS.indirHepsi()→ tüm CT CSV           ║");
  console.log("║    PACS.durum()     → ilerleme              ║");
  console.log("║                                           ║");
  console.log("╚═══════════════════════════════════════════╝");
  console.log("");
})();
