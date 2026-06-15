const fs = require('fs');
const { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, PageBreak } = require('docx');

const scored = JSON.parse(fs.readFileSync('scripts/sinerji_dump/refined_v5.json'));
const TOP_FULL = 50;

const para = (text, opts = {}) => new Paragraph({ children: [new TextRun({ text: String(text || ''), ...opts })], ...opts });
const head = (text, lvl) => new Paragraph({ heading: lvl, children: [new TextRun({ text, bold: true })] });

const children = [];

// Cover
children.push(new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TOMEC v5 — 1382 Yargı Kararı Veri Tabanı', bold: true, size: 32 })] }));
children.push(para(''));
children.push(para('Travma–Obstetrik Mediko-legal Causality (TOMEC) Skoru için Sinerji Mevzuat İçtihat Taraması', { italics: true, size: 24 }));
children.push(para(''));
children.push(para(`Hazırlayan: Replit Asistan • Dr. Nurcan Denli Bayır için • Tarih: ${new Date().toLocaleDateString('tr-TR')}`, { size: 20 }));
children.push(para(''));
children.push(head('Veri Tabanı Özeti', HeadingLevel.HEADING_1));

const byType = {}, bySrc = {};
scored.forEach(r => { byType[r.tipadi] = (byType[r.tipadi] || 0) + 1; bySrc[r.kaynak_arama] = (bySrc[r.kaynak_arama] || 0) + 1; });

children.push(para('• Toplam alakalı karar: ' + scored.length, { size: 22 }));
children.push(para('• Kaynak: Sinerji Mevzuat içtihat veritabanı (mevzuat.sinerjias.com.tr)', { size: 22 }));
children.push(para('• Arama stratejisi: "gebe+travma (783) + gebe+illiyet (1468) + hamile+düşük (1194) + cenin+ölüm (76) — birleştirilmiş 3501 karar üzerinden TOMEC v5 sıkı filtre', { size: 22 }));
children.push(para('• Filtre kriteri: Hem gebelik hem travma terimi geçen, ek olarak illiyet/TCK 87-88/cenin kaybı/obstetrik komplikasyon sinyalleri içeren kararlar', { size: 22 }));
children.push(para('', { size: 20 }));
children.push(para('Mahkeme Tipine Göre Dağılım:', { bold: true, size: 22 }));
Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([k, v]) =>
  children.push(para('  • ' + k + ': ' + v + ' karar', { size: 22 })));
children.push(para('', { size: 20 }));
children.push(para('Arama Kaynağına Göre Dağılım:', { bold: true, size: 22 }));
Object.entries(bySrc).forEach(([k, v]) => children.push(para('  • ' + k + ': ' + v + ' karar', { size: 22 })));
children.push(new Paragraph({ children: [new PageBreak()] }));

// Section A: TOP 50 with full text
children.push(head('A. EN ALAKALI 50 KARAR — TAM METİN', HeadingLevel.HEADING_1));
children.push(para('TOMEC v5 skor sırasına göre. Her kararda: kimlik, skor, tetiklenen sinyaller ve TAM metin.', { italics: true }));
children.push(para(''));

scored.slice(0, TOP_FULL).forEach((r, i) => {
  children.push(head(`${i + 1}. ${r.tipadi} — Esas: ${r.esasno || '?'} ${r.esasyil ? '/' + r.esasyil : ''} • Karar: ${r.kararno || '?'} • Tarih: ${r.karartarihi || '?'}`, HeadingLevel.HEADING_2));
  children.push(para('TOMEC v5 Skor: ' + r.score + ' • Sinyaller: ' + (r.signals || []).join(' | '), { italics: true, size: 20 }));
  if (r.daire) children.push(para('Daire: ' + r.daire, { size: 20 }));
  children.push(para('Kaynak Arama: ' + r.kaynak_arama, { size: 20 }));
  if (r.konu) { children.push(para('Konu: ' + r.konu, { bold: true, size: 22 })); }
  children.push(para(''));
  children.push(para('TAM METİN:', { bold: true, size: 22 }));
  // Split full text into paragraphs of ~2000 chars to keep docx happy
  const txt = r.full_metin || '';
  for (let s = 0; s < txt.length; s += 2500) {
    children.push(para(txt.slice(s, s + 2500), { size: 20 }));
  }
  children.push(para(''));
  children.push(para('— — —', { alignment: AlignmentType.CENTER }));
  children.push(para(''));
});

children.push(new Paragraph({ children: [new PageBreak()] }));

// Section B: Remaining 1332 as summary
children.push(head(`B. KALAN ${scored.length - TOP_FULL} KARAR — ÖZET LİSTESİ`, HeadingLevel.HEADING_1));
children.push(para('Skor sırasına göre. Tam metin için CSV ve refined_v5.json dosyalarına bakınız.', { italics: true }));
children.push(para(''));

scored.slice(TOP_FULL).forEach((r, i) => {
  const idx = TOP_FULL + i + 1;
  children.push(para(
    `${idx}. [${r.tipadi}] Esas: ${r.esasno || '?'}/${r.esasyil || '?'} • Karar: ${r.kararno || '?'} • ${r.karartarihi || ''} | Skor: ${r.score} | ${(r.signals || []).join(', ')}`,
    { size: 18 }
  ));
  if (r.konu) children.push(para('   Konu: ' + (r.konu || '').slice(0, 250), { italics: true, size: 18 }));
  children.push(para('   Özet: ' + (r.full_metin || '').slice(0, 400), { size: 18 }));
  children.push(para(''));
});

const doc = new Document({ sections: [{ children }] });
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('client/public/TOMEC_v5_2284_Karar_Top50_TamMetin.docx', buf);
  console.log('DOCX written:', Math.round(buf.length / 1024), 'KB');
});
