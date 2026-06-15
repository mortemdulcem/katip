/**
 * PACS BT Görüntü + Teleradyoloji Rapor Çekme Scripti
 * =====================================================
 * 
 * KULLANIM:
 * 1. pacs.besk.local/ImageServer/Pages/Studies/Default.aspx sayfasına gidin
 * 2. Tarih aralığını ve Modalite=CT seçin
 * 3. Bu scripti tarayıcı konsoluna yapıştırın
 * 4. PACS.araVeKaydet("TC_NUMARASI") ile tek hasta işleyin
 *    VEYA
 *    PACS.topluIsle() ile CSV'deki tüm hastaları sırayla işleyin
 * 
 * ADIMLAR (her hasta için):
 * a) PACS'ta TC ile arama
 * b) Hasta adına tıklayarak DICOM viewer açma
 * c) BT görüntüsünü canvas'tan yakalama (base64)
 * d) Zincir ikonuna basarak teleradyoloji açma
 * e) "Raporu Görüntüle" ile rapor metnini çekme
 * f) Tümünü API'ye gönderme
 */

const PACS = {
  API_URL: "https://3497a6be-5b71-4e20-a4cb-1d8575ba7ba9-00-26e1ut5qddpjk.picard.replit.dev",
  hastalar: [],
  islemLog: [],
  durum: "bosta",

  // CSV'den hasta listesini yükle
  csvYukle: function() {
    return fetch(this.API_URL + "/brain_ct_patients.csv")
      .then(r => r.text())
      .then(text => {
        const lines = text.trim().split("\n");
        this.hastalar = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const cols = line.split(',""=""');
          if (cols.length < 6) continue;
          const clean = s => s.replace(/^["=]+/g, "").replace(/["=]+$/g, "").replace(/^=""/, "").replace(/"*$/, "").trim();
          const tc = clean(cols[0]);
          const fullName = clean(cols[1]);
          const parts = fullName.split("^");
          const soyad = parts[0] || "";
          const ad = parts.slice(1).join(" ") || "";
          const dogum = clean(cols[2]);
          const cinsiyet = clean(cols[3]);
          const calisma = clean(cols[4]);
          const ornek = clean(cols[5]);
          if (tc.length >= 5) {
            this.hastalar.push({ tc, ad, soyad, fullName, dogum, cinsiyet, calisma, ornek: parseInt(ornek) || 0 });
          }
        }
        console.log(`✅ ${this.hastalar.length} hasta yüklendi`);
        return this.hastalar;
      });
  },

  // ==================================================
  // YÖNTEM 1: Yarı-Otomatik (Önerilen)
  // Her hasta için adım adım
  // ==================================================

  // Mevcut PACS sayfasında TC ile arama yap
  tcAra: function(tc) {
    const tcInput = document.querySelector('input[name*="PatientId"], input[id*="PatientId"], input[placeholder*="Hasta Numarası"]') 
      || document.querySelectorAll('input[type="text"]')[1];
    if (!tcInput) {
      console.error("❌ TC input alanı bulunamadı! Manuel olarak TC girin.");
      return false;
    }
    
    // Önceki değerleri temizle
    const nameInput = document.querySelectorAll('input[type="text"]')[0];
    if (nameInput) { nameInput.value = ""; nameInput.dispatchEvent(new Event('change')); }
    
    tcInput.value = tc;
    tcInput.dispatchEvent(new Event('change'));
    tcInput.dispatchEvent(new Event('input'));
    
    // Ara butonuna bas
    setTimeout(() => {
      const araBtn = Array.from(document.querySelectorAll('a, button, input[type="button"]'))
        .find(el => el.textContent?.trim() === "Ara" || el.value === "Ara");
      if (araBtn) {
        araBtn.click();
        console.log(`🔍 TC ${tc} aranıyor...`);
      } else {
        console.error("❌ 'Ara' butonu bulunamadı!");
      }
    }, 300);
    return true;
  },

  // DICOM viewer'daki BT görüntüsünü yakala
  goruntuyuYakala: function() {
    return new Promise((resolve) => {
      // DICOM viewer'daki canvas elementlerini bul
      const canvases = document.querySelectorAll('canvas');
      if (canvases.length === 0) {
        console.error("❌ Canvas bulunamadı! DICOM viewer açık mı?");
        resolve(null);
        return;
      }
      
      // En büyük canvas'ı seç (genellikle ana görüntü)
      let bestCanvas = null;
      let maxArea = 0;
      canvases.forEach(c => {
        const area = c.width * c.height;
        if (area > maxArea) { maxArea = area; bestCanvas = c; }
      });
      
      if (bestCanvas) {
        try {
          const dataUrl = bestCanvas.toDataURL('image/png');
          console.log(`📸 Görüntü yakalandı (${bestCanvas.width}x${bestCanvas.height})`);
          resolve(dataUrl);
        } catch (e) {
          console.error("❌ Canvas erişim hatası (CORS):", e.message);
          console.log("💡 Alternatif: Ekran görüntüsü alıp yükleyebilirsiniz");
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  },

  // Tüm canvas görüntülerini tek bir composite olarak yakala
  tumGoruntuleriyakala: function() {
    return new Promise((resolve) => {
      const canvases = document.querySelectorAll('canvas');
      if (canvases.length === 0) { resolve(null); return; }

      // Büyük kanvas oluştur ve tüm görüntüleri yan yana koy
      const padding = 10;
      let totalW = 0, maxH = 0;
      const validCanvases = [];
      canvases.forEach(c => {
        if (c.width > 50 && c.height > 50) {
          validCanvases.push(c);
          totalW += c.width + padding;
          maxH = Math.max(maxH, c.height);
        }
      });

      if (validCanvases.length === 0) { resolve(null); return; }

      const composite = document.createElement('canvas');
      composite.width = totalW;
      composite.height = maxH;
      const ctx = composite.getContext('2d');
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, totalW, maxH);

      let x = 0;
      validCanvases.forEach(c => {
        try {
          ctx.drawImage(c, x, 0);
        } catch(e) {}
        x += c.width + padding;
      });

      try {
        const dataUrl = composite.toDataURL('image/jpeg', 0.85);
        console.log(`📸 ${validCanvases.length} görüntü birleştirildi (${totalW}x${maxH})`);
        resolve(dataUrl);
      } catch(e) {
        console.error("❌ Composite hatası:", e);
        resolve(null);
      }
    });
  },

  // =============================================
  // VIDEO KAYIT - BT kesitlerini video olarak kaydet
  // =============================================
  
  _recorder: null,
  _recordedChunks: [],
  _isRecording: false,

  videoKayitBaslat: function(panelIndex) {
    panelIndex = panelIndex || 2;
    const canvases = document.querySelectorAll('canvas');
    const validCanvases = Array.from(canvases).filter(c => c.width > 100 && c.height > 100);
    
    if (validCanvases.length === 0) {
      console.error("❌ Canvas bulunamadı! DICOM viewer açık mı?");
      return;
    }

    const targetCanvas = validCanvases[panelIndex] || validCanvases[validCanvases.length - 1];
    console.log(`🎬 Hedef canvas: ${targetCanvas.width}x${targetCanvas.height} (panel ${panelIndex + 1}/${validCanvases.length})`);

    try {
      const stream = targetCanvas.captureStream(15);
      this._recordedChunks = [];
      this._recorder = new MediaRecorder(stream, { 
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000
      });
      
      this._recorder.ondataavailable = (e) => {
        if (e.data.size > 0) this._recordedChunks.push(e.data);
      };

      this._recorder.onstop = () => {
        const blob = new Blob(this._recordedChunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          this._lastVideoBase64 = reader.result;
          this._lastVideoBlob = blob;
          const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
          console.log(`✅ Video kaydı tamamlandı! (${sizeMB} MB)`);
          console.log("💾 İndirmek için: PACS.videoIndir()");
          console.log("📤 API'ye göndermek için: PACS.videoKaydet('TC_NO')");
        };
        reader.readAsDataURL(blob);
        this._isRecording = false;
      };

      this._recorder.start(100);
      this._isRecording = true;
      console.log("🔴 VIDEO KAYIT BAŞLADI!");
      console.log("➡️ Şimdi kaydırma çubuğunu yavaşça aşağı çekin");
      console.log("➡️ Tüm kesitleri geçtikten sonra: PACS.videoKayitDurdur()");
      console.log("➡️ VEYA otomatik kaydırma için: PACS.otomatikKaydir()");
    } catch(e) {
      console.error("❌ Video kayıt başlatılamadı:", e.message);
      console.log("💡 Tarayıcı MediaRecorder API desteklemiyor olabilir");
    }
  },

  videoKayitDurdur: function() {
    if (!this._recorder || !this._isRecording) {
      console.error("❌ Aktif kayıt yok!");
      return;
    }
    this._recorder.stop();
    console.log("⏹️ Kayıt durduruluyor... İşleniyor...");
  },

  otomatikKaydir: function(hiz, panelIndex) {
    hiz = hiz || 80;
    panelIndex = panelIndex || 2;
    
    const canvases = document.querySelectorAll('canvas');
    const validCanvases = Array.from(canvases).filter(c => c.width > 100 && c.height > 100);
    const targetCanvas = validCanvases[panelIndex] || validCanvases[validCanvases.length - 1];
    
    if (!targetCanvas) {
      console.error("❌ Canvas bulunamadı!");
      return;
    }

    const goruntuText = document.body.innerText.match(/Görüntü\s*#\s*(\d+)\s*\/\s*(\d+)/i);
    let totalSlices = 155;
    let currentSlice = 1;
    if (goruntuText) {
      currentSlice = parseInt(goruntuText[1]);
      totalSlices = parseInt(goruntuText[2]);
      console.log(`📊 Kesit: ${currentSlice}/${totalSlices}`);
    }
    
    const scrollable = targetCanvas.closest('[class*="viewport"]') 
      || targetCanvas.closest('[class*="viewer"]')
      || targetCanvas.parentElement;

    console.log(`🔄 Otomatik kaydırma başlıyor... (${totalSlices} kesit, hız: ${hiz}ms/kesit)`);
    
    let scrollCount = 0;
    const maxScrolls = totalSlices + 10;
    
    const scrollInterval = setInterval(() => {
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 1,
        deltaMode: 0,
        bubbles: true,
        cancelable: true
      });
      targetCanvas.dispatchEvent(wheelEvent);

      const mouseWheel = new WheelEvent('mousewheel', {
        deltaY: 1,
        detail: 1,
        bubbles: true
      });
      targetCanvas.dispatchEvent(mouseWheel);

      scrollCount++;
      if (scrollCount % 20 === 0) {
        console.log(`📊 İlerleme: ${scrollCount}/${totalSlices} kesit`);
      }
      
      if (scrollCount >= maxScrolls) {
        clearInterval(scrollInterval);
        console.log("✅ Tüm kesitler kaydırıldı!");
        if (this._isRecording) {
          setTimeout(() => {
            this.videoKayitDurdur();
          }, 500);
        }
      }
    }, hiz);
    
    this._scrollInterval = scrollInterval;
  },

  otomatikKaydirDurdur: function() {
    if (this._scrollInterval) {
      clearInterval(this._scrollInterval);
      this._scrollInterval = null;
      console.log("⏹️ Otomatik kaydırma durduruldu");
    }
  },

  videoKaydetVeKaydir: function(panelIndex, hiz) {
    panelIndex = panelIndex || 2;
    hiz = hiz || 80;
    
    this.videoKayitBaslat(panelIndex);
    
    setTimeout(() => {
      this.otomatikKaydir(hiz, panelIndex);
    }, 500);
  },

  videoIndir: function(dosyaAdi) {
    if (!this._lastVideoBlob) {
      console.error("❌ İndirilecek video yok! Önce kayıt yapın.");
      return;
    }
    dosyaAdi = dosyaAdi || `bt_video_${this._currentTc || 'hasta'}_${Date.now()}.webm`;
    const url = URL.createObjectURL(this._lastVideoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = dosyaAdi;
    a.click();
    URL.revokeObjectURL(url);
    console.log(`💾 Video indirildi: ${dosyaAdi}`);
  },

  videoKaydet: async function(tc) {
    if (!this._lastVideoBase64) {
      console.error("❌ Kaydedilecek video yok!");
      return;
    }
    
    tc = tc || this._currentTc;
    const hasta = this.hastalar.find(h => h.tc === tc);
    if (!hasta) {
      console.error("❌ TC bulunamadı! Önce PACS.csvYukle() çalıştırın.");
      return;
    }

    const sizeMB = (this._lastVideoBase64.length / (1024 * 1024)).toFixed(2);
    console.log(`📤 Video gönderiliyor... (${sizeMB} MB)`);

    const data = {
      patientTc: hasta.tc,
      patientName: `${hasta.ad} ${hasta.soyad}`,
      birthDate: hasta.dogum,
      gender: hasta.cinsiyet,
      studyDate: hasta.calisma,
      sampleCount: hasta.ornek,
      ctVideoData: this._lastVideoBase64,
      status: "video_captured"
    };

    const result = await this.apiGonder(data);
    if (result) {
      console.log(`🎉 Video kaydedildi: ${hasta.ad} ${hasta.soyad}`);
    }
  },

  // Mevcut sayfadaki aksiyel BT kesitini yakala (3. panel - en önemli kesit)
  aksiyalKesitYakala: function(panelIndex) {
    panelIndex = panelIndex || 2; // default 3. panel (index 2)
    const canvases = document.querySelectorAll('canvas');
    const validCanvases = Array.from(canvases).filter(c => c.width > 100 && c.height > 100);
    
    if (validCanvases.length === 0) {
      console.error("❌ Canvas bulunamadı!");
      return null;
    }

    const target = validCanvases[panelIndex] || validCanvases[validCanvases.length - 1];
    try {
      const dataUrl = target.toDataURL('image/png');
      console.log(`📸 Panel ${panelIndex + 1} yakalandı (${target.width}x${target.height})`);
      return dataUrl;
    } catch(e) {
      console.error("❌ Canvas erişim hatası:", e.message);
      return null;
    }
  },

  // Teleradyoloji sayfasından rapor çek
  raporuCek: function() {
    // teleradyoloji.saglik.gov.tr sayfasında çalıştırılmalı
    const result = {
      reportText: "",
      reportDate: "",
      icdCode: "",
      sutCode: "",
      findings: "",
      conclusion: "",
      technique: ""
    };

    // "Raporu Görüntüle" modal/popup açıldıysa
    const allText = document.body.innerText;
    
    // Sut Kodu
    const sutMatch = allText.match(/Sut Kodu[:\s]*([^\n]+)/i);
    if (sutMatch) result.sutCode = sutMatch[1].trim();
    
    // ICD Kodu
    const icdMatch = allText.match(/ICD Kodu[:\s]*([^\n]+)/i);
    if (icdMatch) result.icdCode = icdMatch[1].trim();
    
    // Rapor Tarihi
    const raporTarihMatch = allText.match(/Rapor Tarihi[:\s]*([^\n]+)/i);
    if (raporTarihMatch) result.reportDate = raporTarihMatch[1].trim();
    
    // Bulgular bölümü
    const bulgularMatch = allText.match(/Bulgular\s*\n([\s\S]*?)(?=Sonuç ve Öneriler|Sonuç|$)/i);
    if (bulgularMatch) result.findings = bulgularMatch[1].trim();
    
    // Sonuç bölümü
    const sonucMatch = allText.match(/Sonuç ve Öneriler\s*\n([\s\S]*?)(?=\n\n|$)/i) 
      || allText.match(/Sonuç\s*\n([\s\S]*?)(?=\n\n|$)/i);
    if (sonucMatch) result.conclusion = sonucMatch[1].trim();
    
    // Teknik bölümü
    const teknikMatch = allText.match(/Teknik\s*\n([\s\S]*?)(?=Karşılaştırma|Bulgular|$)/i);
    if (teknikMatch) result.technique = teknikMatch[1].trim();
    
    // Tam rapor metni
    result.reportText = allText;

    console.log("📋 Rapor çekildi:");
    console.log("  Sut Kodu:", result.sutCode);
    console.log("  ICD:", result.icdCode);
    console.log("  Rapor Tarihi:", result.reportDate);
    console.log("  Bulgular:", result.findings.substring(0, 100) + "...");
    console.log("  Sonuç:", result.conclusion.substring(0, 100) + "...");
    
    return result;
  },

  // Rapor modal/iframe'inden rapor çek
  raporModalCek: function() {
    // Modal veya iframe içindeki raporu bul
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const text = doc.body.innerText;
        if (text.includes("Bulgular") || text.includes("Sonuç")) {
          return this._parseRaporText(text);
        }
      } catch(e) {
        console.log("⚠️ iframe erişim hatası (cross-origin)");
      }
    }
    
    // iframe yoksa mevcut sayfadan dene
    return this.raporuCek();
  },

  _parseRaporText: function(text) {
    const result = {
      reportText: text,
      reportDate: "",
      icdCode: "",
      sutCode: "",
      findings: "",
      conclusion: "",
      technique: ""
    };
    
    const sutMatch = text.match(/Sut Kodu[:\s]*([^\n]+)/i);
    if (sutMatch) result.sutCode = sutMatch[1].trim();
    
    const icdMatch = text.match(/ICD Kodu[:\s]*([^\n]+)/i);
    if (icdMatch) result.icdCode = icdMatch[1].trim();
    
    const raporTarihMatch = text.match(/Rapor Tarihi[:\s]*([^\n]+)/i);
    if (raporTarihMatch) result.reportDate = raporTarihMatch[1].trim();
    
    const bulgularMatch = text.match(/Bulgular\s*\n([\s\S]*?)(?=Sonuç ve Öneriler|Sonuç|$)/i);
    if (bulgularMatch) result.findings = bulgularMatch[1].trim();
    
    const sonucMatch = text.match(/Sonuç ve Öneriler\s*\n([\s\S]*?)(?=\n\n|$)/i)
      || text.match(/Sonuç\s*\n([\s\S]*?)(?=\n\n|$)/i);
    if (sonucMatch) result.conclusion = sonucMatch[1].trim();
    
    const teknikMatch = text.match(/Teknik\s*\n([\s\S]*?)(?=Karşılaştırma|Bulgular|$)/i);
    if (teknikMatch) result.technique = teknikMatch[1].trim();
    
    return result;
  },

  // Veriyi API'ye gönder
  apiGonder: async function(data) {
    try {
      const response = await fetch(this.API_URL + "/api/brain-ct-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const err = await response.text();
        console.error("❌ API hatası:", response.status, err);
        return false;
      }
      
      const result = await response.json();
      console.log(`✅ Kaydedildi: ${data.patientName} (TC: ${data.patientTc})`);
      this.islemLog.push({ tc: data.patientTc, name: data.patientName, status: "success", time: new Date().toLocaleTimeString() });
      return result;
    } catch(e) {
      console.error("❌ Gönderim hatası:", e.message);
      this.islemLog.push({ tc: data.patientTc, name: data.patientName, status: "error", error: e.message, time: new Date().toLocaleTimeString() });
      return false;
    }
  },

  // ==================================================
  // ANA KULLANIM FONKSİYONLARI
  // ==================================================

  /**
   * ADIM 1: PACS'ta hasta ara
   * Kullanım: PACS.adim1_ara("53023564042")
   */
  adim1_ara: function(tc) {
    this._currentTc = tc;
    const hasta = this.hastalar.find(h => h.tc === tc);
    if (hasta) {
      this._currentHasta = hasta;
      console.log(`👤 ${hasta.ad} ${hasta.soyad} (${hasta.cinsiyet}, Doğum: ${hasta.dogum})`);
    }
    this.tcAra(tc);
    console.log("➡️ Sonuç gelince hasta adına 3 kez tıklayın → DICOM viewer açılacak");
    console.log("➡️ Sonra PACS.adim2_goruntu() çalıştırın");
  },

  /**
   * ADIM 2: DICOM viewer'dan BT VİDEOSU kaydet
   * Kullanım: PACS.adim2_video()
   * Veya: PACS.adim2_video(2, 80)  → panel 3, 80ms hız
   * (DICOM viewer açık olmalı)
   */
  adim2_video: async function(panelIndex, hiz) {
    console.log("🎬 BT video kaydı başlatılıyor...");
    console.log("   Kayıt başlayacak ve kesitler otomatik kaydırılacak");
    
    this.videoKaydetVeKaydir(panelIndex, hiz);
    
    console.log("➡️ Video bittikten sonra otomatik kaydedilecek");
    console.log("➡️ Sonra zincir 🔗 ikonuna tıklayın → teleradyoloji açılacak");
    console.log("➡️ 'Raporu Görüntüle' tıklayın → rapor açılınca PACS.adim3_rapor() çalıştırın");
  },

  /**
   * ADIM 2 ALT: Sadece görüntü yakala (video istemezseniz)
   */
  adim2_goruntu: async function() {
    console.log("📸 BT görüntüsü yakalanıyor...");
    const composite = await this.tumGoruntuleriyakala();
    if (composite) {
      this._currentImage = composite;
      console.log("✅ Görüntü yakalandı ve hafızada!");
    } else {
      const single = this.aksiyalKesitYakala(2);
      if (single) {
        this._currentImage = single;
        console.log("✅ Tek panel görüntü yakalandı!");
      } else {
        this._currentImage = null;
        console.warn("⚠️ Görüntü yakalanamadı.");
      }
    }
    console.log("➡️ Şimdi zincir 🔗 ikonuna tıklayın → teleradyoloji açılacak");
  },

  /**
   * ADIM 3: Raporu çek ve kaydet
   * Kullanım: PACS.adim3_rapor()
   * (Teleradyoloji rapor sayfası açık olmalı)
   */
  adim3_rapor: async function() {
    console.log("📋 Rapor çekiliyor...");
    const rapor = this.raporuCek();
    this._currentRapor = rapor;
    
    const hasta = this._currentHasta;
    if (!hasta) {
      console.error("❌ Hasta bilgisi yok! Önce adim1_ara() çalıştırın.");
      return;
    }

    const data = {
      patientTc: hasta.tc,
      patientName: `${hasta.ad} ${hasta.soyad}`,
      birthDate: hasta.dogum,
      gender: hasta.cinsiyet,
      studyDate: hasta.calisma,
      sampleCount: hasta.ornek,
      findings: rapor.findings || "",
      conclusion: rapor.conclusion || "",
      technique: rapor.technique || "",
      ctImageData: this._currentImage || "",
      ctVideoData: this._lastVideoBase64 || "",
      reportText: rapor.reportText || "",
      reportDate: rapor.reportDate || "",
      icdCode: rapor.icdCode || "",
      sutCode: rapor.sutCode || "",
      status: rapor.findings ? "reported" : "pending"
    };

    const result = await this.apiGonder(data);
    if (result) {
      console.log("🎉 Hasta dosyası kaydedildi!");
      console.log(`   Görüntü: ${this._currentImage ? "VAR" : "YOK"}`);
      console.log(`   Rapor: ${rapor.findings ? "VAR" : "YOK"}`);
      console.log(`   ICD: ${rapor.icdCode || "-"}`);
    }
    
    // Temizle
    this._currentImage = null;
    this._currentRapor = null;
    this._currentHasta = null;
    this._currentTc = null;
  },

  /**
   * HIZLI: Sadece rapor kaydet (görüntü olmadan)
   * Teleradyoloji rapor sayfasında çalıştırın
   */
  sadeceRaporKaydet: async function(tc) {
    const hasta = this.hastalar.find(h => h.tc === tc);
    if (!hasta) {
      console.error("❌ TC bulunamadı! Önce PACS.csvYukle() çalıştırın.");
      return;
    }

    const rapor = this.raporuCek();
    const data = {
      patientTc: hasta.tc,
      patientName: `${hasta.ad} ${hasta.soyad}`,
      birthDate: hasta.dogum,
      gender: hasta.cinsiyet,
      studyDate: hasta.calisma,
      sampleCount: hasta.ornek,
      findings: rapor.findings || "",
      conclusion: rapor.conclusion || "",
      technique: rapor.technique || "",
      reportText: rapor.reportText || "",
      reportDate: rapor.reportDate || "",
      icdCode: rapor.icdCode || "",
      sutCode: rapor.sutCode || "",
      status: rapor.findings ? "reported" : "pending"
    };

    await this.apiGonder(data);
  },

  /**
   * HIZLI: Sadece görüntü kaydet
   * DICOM viewer'da çalıştırın
   */
  sadeceGoruntu: async function(tc) {
    const hasta = this.hastalar.find(h => h.tc === tc);
    if (!hasta) {
      console.error("❌ TC bulunamadı!");
      return;
    }

    const img = await this.tumGoruntuleriyakala() || this.aksiyalKesitYakala(2);
    if (!img) {
      console.error("❌ Görüntü yakalanamadı!");
      return;
    }

    const data = {
      patientTc: hasta.tc,
      patientName: `${hasta.ad} ${hasta.soyad}`,
      birthDate: hasta.dogum,
      gender: hasta.cinsiyet,
      studyDate: hasta.calisma,
      sampleCount: hasta.ornek,
      ctImageData: img,
      status: "image_only"
    };

    await this.apiGonder(data);
  },

  /**
   * Manuel ekran görüntüsü yükle (file input ile)
   */
  ekranGoruntusuYukle: function(tc) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        const hasta = this.hastalar.find(h => h.tc === tc);
        if (!hasta) {
          console.error("❌ TC bulunamadı!");
          return;
        }
        
        const data = {
          patientTc: hasta.tc,
          patientName: `${hasta.ad} ${hasta.soyad}`,
          birthDate: hasta.dogum,
          gender: hasta.cinsiyet,
          studyDate: hasta.calisma,
          sampleCount: hasta.ornek,
          ctImageData: base64,
          status: "image_only"
        };
        
        await this.apiGonder(data);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  },

  // İşlem logunu göster
  logGoster: function() {
    console.table(this.islemLog);
    const basarili = this.islemLog.filter(l => l.status === "success").length;
    const hatali = this.islemLog.filter(l => l.status === "error").length;
    console.log(`📊 Toplam: ${this.islemLog.length} | Başarılı: ${basarili} | Hatalı: ${hatali}`);
  },

  // Yardım
  yardim: function() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║     PACS BT Video + Görüntü + Rapor Çekme Scripti          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  📋 BAŞLANGIÇ:                                               ║
║  PACS.csvYukle()             → Hasta listesini yükle         ║
║                                                              ║
║  🔄 ADIM ADIM (her hasta için):                              ║
║  ──────────────────────────────────────────────────────────   ║
║  [PACS sayfasında]                                           ║
║  PACS.adim1_ara("TC")        → TC ile ara                    ║
║                              → Hasta adına 3x tıkla          ║
║                                                              ║
║  [DICOM viewer'da]                                           ║
║  PACS.adim2_video()          → 🎬 BT VİDEO kaydet           ║
║     (otomatik kaydırır + video kaydeder)                     ║
║  PACS.adim2_goruntu()        → 📸 Tek görüntü yakala         ║
║                              → Zincir 🔗 ikonuna tıkla       ║
║                                                              ║
║  [Teleradyoloji'de]                                          ║
║  → "Raporu Görüntüle" tıkla                                  ║
║  PACS.adim3_rapor()          → Raporu çek + tümünü kaydet    ║
║                                                              ║
║  🎬 VIDEO KOMUTLARI:                                         ║
║  ──────────────────────────────────────────────────────────   ║
║  PACS.videoKayitBaslat(2)    → Manuel kayıt başlat           ║
║  PACS.otomatikKaydir(80)     → Kesitleri otomatik kaydır     ║
║  PACS.videoKayitDurdur()     → Kaydı durdur                  ║
║  PACS.videoKaydetVeKaydir()  → Hepsi tek komutla             ║
║  PACS.videoIndir()           → Videoyu .webm indir           ║
║  PACS.videoKaydet("TC")      → Videoyu DB'ye kaydet          ║
║                                                              ║
║  ⚡ HIZLI KOMUTLAR:                                          ║
║  ──────────────────────────────────────────────────────────   ║
║  PACS.sadeceRaporKaydet("TC")  → Sadece rapor                ║
║  PACS.sadeceGoruntu("TC")     → Sadece görüntü               ║
║                                                              ║
║  📊 DURUM:                                                   ║
║  PACS.logGoster()            → İşlem logunu göster            ║
║  PACS.hastalar               → Tüm hasta listesi              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
  },

  // Başlat
  init: async function() {
    console.log("🏥 PACS BT + Rapor Scripti başlatılıyor...");
    await this.csvYukle();
    this.yardim();
  }
};

// Otomatik başlat
PACS.init();
