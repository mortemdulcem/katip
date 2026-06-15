const fs=require('fs'), JSZip=require('jszip');

function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function makePara(text, bullet=true){
  const bu=bullet?'<a:buChar char="&#x25AA;"/>':'<a:buNone/>';
  const ind=bullet?' indent="-228600" marL="228600"':'';
  return `<a:p><a:pPr algn="l"${ind}><a:lnSpc><a:spcPts val="1300"/></a:lnSpc>${bu}</a:pPr><a:r><a:rPr lang="tr-TR" sz="800" dirty="0"><a:solidFill><a:srgbClr val="2C3E50"/></a:solidFill></a:rPr><a:t>${esc(text)}</a:t></a:r></a:p>`;
}

// Replace the p:txBody section of a shape's XML
function setTxBody(spXml, innerContent){
  // Match <p:txBody>...</p:txBody> (note: p: not a: namespace)
  return spXml.replace(/<p:txBody>[\s\S]*?<\/p:txBody>/, '<p:txBody>' + innerContent + '</p:txBody>');
}

function makeBodyTx(paras){
  return '<a:bodyPr wrap="square" lIns="114300" tIns="91440" rIns="114300" bIns="91440" rtlCol="0" anchor="t"><a:spAutoFit/></a:bodyPr><a:lstStyle/>' + paras;
}

function setTitle(spXml, text){
  const inner=makeBodyTx(`<a:p><a:pPr algn="l"><a:lnSpc><a:spcPts val="1300"/></a:lnSpc><a:buNone/></a:pPr><a:r><a:rPr lang="tr-TR" dirty="0"/><a:t>${esc(text)}</a:t></a:r></a:p>`);
  return setTxBody(spXml, inner);
}

function setHeader(spXml, text){
  const inner=makeBodyTx(`<a:p><a:pPr algn="l"><a:lnSpc><a:spcPts val="1300"/></a:lnSpc><a:buNone/></a:pPr><a:r><a:rPr lang="tr-TR" b="1" dirty="0"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:rPr><a:t>${esc(text)}</a:t></a:r></a:p>`);
  return setTxBody(spXml, inner);
}

function setBody(spXml, lines){
  const paras=lines.map(l=>makePara(l.text, l.bullet!==false)).join('');
  return setTxBody(spXml, makeBodyTx(paras));
}

function clearShape(spXml){
  const inner=makeBodyTx(`<a:p><a:pPr><a:buNone/></a:pPr><a:endParaRPr lang="tr-TR" dirty="0"/></a:p>`);
  return setTxBody(spXml, inner);
}

const newSlidesData=[
  {insertAfter:5, title:'Terminoloji Notları: Eşdeğer Kavramlar',
   h1:'Abrazyon Halkası = Kontüzyon Halkası',
   c1:[{text:'Abrasion Ring (Abrazyon Halkası) olarak da bilinir'},{text:'Merminin deriye sürtünmesiyle oluşan sıyrık halkası'},{text:'Silinmekle kaybolmaz — derinin fiziksel kaybıdır'},{text:'= Kontüzyon Halkası / Vurma İzi Halkası'}],
   h2:'Bullet Wipe = Silinti Şeridi Halkası',
   c2:[{text:'Mermi yüzeyindeki yağ-kir-is kalıntısının deriye silinmesi'},{text:'Yıkanarak temizlenebilir (abrazyon halkasından farkı)'},{text:'= Silinti Şeridi Halkası'}],
   h3:'Muzzle Imprint / Stippling',
   c3:[{text:'Namlu İzi (Muzzle Imprint) = Stampa İzi'},{text:'Barut Dövmesi (Stippling) = Tatuaj'},{text:'Klinik pratikteki Türkçe terimler esas alınmalıdır'}]},
  {insertAfter:43, title:"Bitişik Atış: Hoffman'ın Maden Boşluğu Belirtisi",
   h1:'Tanım',
   c1:[{text:'Saçlı deri gibi cildin doğrudan kemik üstünde olduğu bölgelerde görülür'},{text:'Silah ateşlendiğinde mermi ciltte delik açar'},{text:'Alev, gaz, is ve barut taneleri bu delikten içeri girer'},{text:'Gazın etkisiyle cilt dışarı kabarır — maden boşluğu görünümü'}],
   h2:'Makroskobik Bulgular',
   c2:[{text:'Alev bölgeyi yakar, is siyaha boyar'},{text:'Koyu renkli yanık biçiminde lezyon oluşur'},{text:'Yıldızvari (stellate) yırtığa dönüşür'},{text:'Yalnızca bitişik atışlarda oluşur'}],
   h3:'Tanısal Önemi',
   c3:[{text:'Karın/göğüs bölgesinde (kemik altı yok) stellate yırtık oluşmaz'},{text:"Scalp yaralanmasındaki tipik 'patlamış' giriş yarasını açıklar"},{text:"Kaynak: Knight's Forensic Pathology"}]},
  {insertAfter:66, title:'Yakın Atış Mesafesi: Silah Türüne Göre Sınırlar',
   h1:'Kısa Namlulu Silahlar (Tabancalar)',
   c1:[{text:'Bitişik Atış: 0 – 3 cm'},{text:'Yakın Atış: 3 – 30 (45) cm'},{text:'→ Tatuaj (barut dövmesi) görülür'},{text:'Uzak Atış: > 45 cm → Tatuaj görülmez'}],
   h2:'Uzun Namlulu Silahlar (Av Tüfekleri)',
   c2:[{text:'Bitişik Atış: 0 – 3 cm'},{text:'Yakın Atış: 3 – 75 (100) cm'},{text:'→ Tatuaj görülür'},{text:'Uzak Atış: > 100 cm → Tatuaj görülmez'}],
   h3:'Önemli Not',
   c3:[{text:'Kesin mesafe tayini için deneysel atış testi yapılmalıdır'},{text:'Uzak atışta giriş deliği kesici-delici alet yarası ile karışabilir'}]},
  {insertAfter:155, title:'Patlamaya Bağlı Yaralar: Yaralanma Mekanizmaları',
   h1:'Birincil Mekanizmalar',
   c1:[{text:'a) Basınç parçalanması: Patlama noktasına çok yakın → vücut parçalanması'},{text:'b) Şarapnel: Patlayıcıdan yayılan metal parçaların çarpması'},{text:'c) Isı: Flaş yanığı (2000°C+ gaz) veya alev yanığı (giysi)'},{text:'d) Şok dalgası: Ses hızında konsantrik daireler halinde yayılır'}],
   h2:'İkincil Mekanizmalar',
   c2:[{text:'e) Enkaz altında kalma: Yıkılan bina parçaları altında ezilme'},{text:'f) Sekonder çarpmalar: Etrafa uçuşan çevre eşyaları'},{text:'g) Gaz-duman zehirlenmesi: Patlama gazlarıyla intoksikasyon'}],
   h3:'Şok Dalgası Etkileri',
   c3:[{text:'Kulak zarı yırtılması (en hassas organ)'},{text:'Akciğer ve GİS barotravması'},{text:'Kişiyi savrulma → ikincil künt travma'}]},
  {insertAfter:156, title:'Patlamaya Bağlı Yaralar: Medikolegal Değerlendirme',
   h1:'Vücut Parçalanması ve Kimlik',
   c1:[{text:'Araştırma alanı 100+ metreyi aşabilir'},{text:'DNA tiplemesi kimlik tespitinde altın standarttır'},{text:'El amputasyonu → bombayı elinde tutuyordu'},{text:'Alt bacak parçalanması → bombanın yanında duruyordu'}],
   h2:'Yanıklar',
   c2:[{text:'Flaş yanığı: 2000°C+ gaz → homojen, geniş alanlı'},{text:'Alev yanığı: Giysi tutuşmasından klasik yanık'},{text:"Giysi 'güneş yanığı gölgesi' etkisi: Örtülen alan korunur"}],
   h3:'Otopsi Protokolü',
   c3:[{text:'Otopsi öncesi tüm vücudun BT görüntülemesi zorunludur'},{text:"Bomba parçaları yapımcıyı tanımlayan 'imza' niteliği taşır"},{text:'Hayatta kalıp sonradan ölenlerde ölüm mekanizması ayrıca belirlenmeli'}]},
];

async function main(){
  const buf=fs.readFileSync('/tmp/clean_base.pptx');
  const zip=await JSZip.loadAsync(buf);
  
  // Get slide158 as template
  const templateXml=await zip.file('ppt/slides/slide158.xml').async('string');
  const templateRels=await zip.file('ppt/slides/_rels/slide158.xml.rels').async('string');
  
  // Extract individual sp elements using non-greedy match
  // We need to do this carefully - find all sp elements in spTree
  const spTreeMatch=templateXml.match(/<p:spTree>([\s\S]*?)<\/p:spTree>/);
  if(!spTreeMatch) throw new Error('No spTree found in template');
  const spTreeContent=spTreeMatch[1];
  
  // Extract sp elements one by one
  const templateSps=[];
  const spRegex=/<p:sp>([\s\S]*?)<\/p:sp>/g;
  let sm;
  while((sm=spRegex.exec(spTreeContent))!==null){
    templateSps.push(sm[0]); // full match including <p:sp> and </p:sp>
  }
  console.log('Template slide158 has', templateSps.length, 'shapes');
  // Verify txBody detection
  const tb0=(templateSps[0].match(/<p:txBody>/g)||[]).length;
  console.log('sp1 has p:txBody:', tb0);
  
  // Get presentation data
  let presXml=await zip.file('ppt/presentation.xml').async('string');
  let presRelsXml=await zip.file('ppt/_rels/presentation.xml.rels').async('string');
  let contentTypesXml=await zip.file('[Content_Types].xml').async('string');
  
  // Parse sldIdLst
  const sldIdLst=presXml.match(/<p:sldIdLst>([\s\S]*?)<\/p:sldIdLst>/)[1];
  const sldIdEntries=[...sldIdLst.matchAll(/<p:sldId id="(\d+)" r:id="(rId\d+)"\/>/g)].map(m=>({id:parseInt(m[1]),rid:m[2]}));
  
  // Get rId->slideNum mapping
  const rIdToSlide={};
  [...presRelsXml.matchAll(/Id="(rId\d+)"[^>]+Target="slides\/slide(\d+)\.xml"/g)].forEach(m=>{rIdToSlide[m[1]]=parseInt(m[2]);});
  
  // Build ordered array (position 0 = first slide)
  const orderedSlides=sldIdEntries.map(e=>({slideNum:rIdToSlide[e.rid],rid:e.rid}));
  
  // Count existing slide files to get next slideNum
  const existingSlides=Object.keys(zip.files).filter(f=>f.match(/^ppt\/slides\/slide\d+\.xml$/)).length;
  let nextSlideNum=existingSlides+1; // e.g. 169
  
  // Get max rId number
  const allRidNums=[...presRelsXml.matchAll(/Id="rId(\d+)"/g)].map(m=>parseInt(m[1]));
  let nextRidNum=Math.max(...allRidNums)+1;
  
  // Process insertions from END to start (so positions don't shift)
  const sortedNew=[...newSlidesData].sort((a,b)=>b.insertAfter-a.insertAfter);
  const newSlideInfos=[];
  
  for(const ns of sortedNew){
    const slideNum=nextSlideNum++;
    const rid=`rId${nextRidNum++}`;
    
    // Clone and modify sp elements
    let sps=[...templateSps];
    
    // Verify that setTxBody works on sp[0]
    const testResult=setTitle(sps[0], 'TEST');
    if(!testResult.includes('<p:txBody>')) console.warn('WARNING: setTitle may have failed!');
    
    // Apply text replacements:
    // sp[0] = title, sp[1] = page number (clear), sp[2] = decoration (keep)
    // sp[3] = header1, sp[4] = body1, sp[5] = decoration (keep)
    // sp[6] = header2, sp[7] = body2, sp[8] = decoration (keep)
    // sp[9] = header3, sp[10] = body3
    sps[0]=setTitle(sps[0], ns.title);
    sps[1]=clearShape(sps[1]);   // clear page number
    // sp[2] keep (background decoration)
    sps[3]=setHeader(sps[3], ns.h1);
    sps[4]=setBody(sps[4], ns.c1);
    // sp[5] keep (background)
    sps[6]=setHeader(sps[6], ns.h2);
    sps[7]=setBody(sps[7], ns.c2);
    // sp[8] keep (background)
    sps[9]=setHeader(sps[9], ns.h3);
    sps[10]=setBody(sps[10], ns.c3);
    
    // Build new spTree content: preserve grpSpPr and nvGrpSpPr
    const preSpContent=spTreeContent.match(/^([\s\S]*?)<p:sp>/)?.[1]||'';
    const newSpTreeContent=preSpContent+sps.join('');
    
    // Build new slide XML by replacing spTree content
    let newXml=templateXml.replace(/<p:spTree>[\s\S]*?<\/p:spTree>/,
      `<p:spTree>${newSpTreeContent}</p:spTree>`);
    
    // Update slide cSld name
    newXml=newXml.replace(/(<p:cSld name=")[^"]*(")/,`$1Slide ${slideNum}$2`);
    
    // Write new slide
    zip.file(`ppt/slides/slide${slideNum}.xml`, newXml);
    
    // Rels for new slide: copy template rels (points to slide158's images which still exist)
    zip.file(`ppt/slides/_rels/slide${slideNum}.xml.rels`, templateRels);
    
    // Add to presRels
    presRelsXml=presRelsXml.replace('</Relationships>',
      `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${slideNum}.xml"/>\n</Relationships>`);
    
    // Add to ContentTypes
    contentTypesXml=contentTypesXml.replace('</Types>',
      `<Override PartName="/ppt/slides/slide${slideNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>\n</Types>`);
    
    // Insert into ordered slides list
    orderedSlides.splice(ns.insertAfter, 0, {slideNum, rid});
    
    newSlideInfos.push({slideNum, title:ns.title.substring(0,40), pos:ns.insertAfter+1});
    console.log(`Created slide${slideNum} at position ${ns.insertAfter+1}: "${ns.title.substring(0,50)}"`);
  }
  
  // REMOVE PAGE NUMBERS from ALL slides including originals
  const allSlideFiles=Object.keys(zip.files).filter(f=>f.match(/^ppt\/slides\/slide\d+\.xml$/));
  let pnRemoved=0;
  for(const sf of allSlideFiles){
    let xml=await zip.file(sf).async('string');
    // Match the entire sp element containing only a page number text
    const before=xml;
    // Strategy: find <p:sp> blocks that contain "Sayfa X / Y" or "Slayt X / Y"
    xml=xml.replace(/<p:sp>(?:(?!<p:sp>)[\s\S])*?<a:t>(?:Sayfa|Slayt)\s+\d+\s*\/\s*\d+<\/a:t>(?:(?!<p:sp>)[\s\S])*?<\/p:sp>/g,'');
    if(xml!==before){zip.file(sf,xml); pnRemoved++;}
  }
  console.log(`Page numbers removed from ${pnRemoved} slides`);
  
  // REASSIGN ALL sldIds to safe values (start from 256, increment by 1)
  // This fixes the INT32_MAX overflow issue
  let nextSafeId=256;
  const newSldIdLst='<p:sldIdLst>'+orderedSlides.map(s=>`<p:sldId id="${nextSafeId++}" r:id="${s.rid}"/>`).join('')+'</p:sldIdLst>';
  presXml=presXml.replace(/<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/, newSldIdLst);
  
  // Verify max sldId
  const maxId=nextSafeId-1;
  console.log(`sldId range: 256 to ${maxId} (INT32_MAX: 2147483647) — safe: ${maxId<2147483647}`);
  
  zip.file('ppt/presentation.xml', presXml);
  zip.file('ppt/_rels/presentation.xml.rels', presRelsXml);
  zip.file('[Content_Types].xml', contentTypesXml);
  
  // Final validation
  const rids=[...presRelsXml.matchAll(/Id="(rId\d+)"/g)].map(m=>m[1]);
  console.log(`rId count: ${rids.length}, unique: ${new Set(rids).size}`);
  console.log(`Total slides in order: ${orderedSlides.length}`);
  
  // Check a new slide for txBody presence
  const testSlide=await zip.file(`ppt/slides/slide${nextSlideNum-1}.xml`).async('string');
  console.log(`Last new slide txBody count: ${(testSlide.match(/<p:txBody>/g)||[]).length}`);
  console.log(`Last new slide sp count: ${(testSlide.match(/<p:sp>/g)||[]).length}`);
  
  const outBuf=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE',compressionOptions:{level:6}});
  fs.writeFileSync('client/public/sunum_final.pptx', outBuf);
  console.log(`\nDone! Size: ${(outBuf.length/1024/1024).toFixed(2)} MB`);
}

main().catch(e=>{console.error('FATAL:',e.message,'\n',e.stack);process.exit(1);});
