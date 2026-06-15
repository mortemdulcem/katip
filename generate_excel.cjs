const ExcelJS = require('exceljs');
const path = require('path');

async function generate() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Lens Thickness');

  const kadin = new Set([
    'ada','akan','alkım','atike nur','aysun','aygül','ayşe','ayşe simay','ayşenur eser','ayça',
    'berfin','berfu','betül sena','burcu','büşra',
    'çağla','çiğdem',
    'defne','derya','dilan fulya','dilanur','dilek','döne','dürdane',
    'ece','ecem nur','edanur','elif','elif nazmiye','esma','esra','esranur','ezgi',
    'fatime','fatma','fatmagül','fidan',
    'gizem nur','gülbahar','gülruhan','gülser yağmur','gülseren','gülsüm','gülçin','gülşen',
    'handan','hansiye','hatice','hicran','hilal','hilal betül','hüma sühan',
    'ilknur sinem','irem nur',
    'kamile','kevser','kevser hilal','kübra',
    'melodi','merve ada','meşhure',
    'nazlı','necla','nerman',
    'özge','özgül',
    'rabia','rahime','rukiye',
    'seda','sedef nur','seher','selin','semra','seray','seyran','simin gözen','sinem','sümeyye','sündüz',
    'şebnem','şeyma','şirin sinejan','şükran',
    'tuba',
    'zahide','zehra','zeliha','zeynep','zeynep ecem','zeynep hande','zeynep mediha',
  ]);
  const erkek = new Set([
    'abdulkadir','abdülkadir','ahmet','ahmet erdinç','ahmet ilhan','ali','alihan','alpkan','arslan',
    'asım burak','atakan','avbir','aydın','aytunç',
    'bekir','berk','berkay samet',
    'celil','çelebi',
    'dinçer','doğukan',
    'emre','engin','erdem','eren',
    'hasan','hüseyin',
    'ibrahim','ismail',
    'kemal','kürşat',
    'mahmut','mehmet','mehmet enes','mehmet lütfi','mehmet raşit','memet eren','merdan','miraç',
    'muhammed baran','muhammet eyüp','muharrem','muhsin','murat','musa','mustafa','mustafa can','mustafa gökhun',
    'oğuzhan','oktay','ömer faruk','özkan',
    'ramazan',
    'said enes','salih','samet','sedat','selim','selçuk','süleyman',
    'şahin','şükrü',
    'tayfun','temel refhan','tuncay',
    'umur','uğur',
    'yakup','yunus emre',
    'zafer','zan',
  ]);
  function getCinsiyet(ad) {
    const lower = ad.toLowerCase();
    if (kadin.has(lower)) return 'K';
    if (erkek.has(lower)) return 'E';
    const ilkKelime = lower.split(' ')[0];
    if (kadin.has(ilkKelime)) return 'K';
    if (erkek.has(ilkKelime)) return 'E';
    return '?';
  }

  const headerRow = ws.addRow(['Soyad', 'Ad', 'Cinsiyet', 'Doğum Yılı', 'Muayene Tarihi', 'Saat', 'Yaş', 'OD LT (mm)', 'OS LT (mm)', 'Not']);
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: 'center' };
  ws.getColumn(1).width = 20;
  ws.getColumn(2).width = 20;
  ws.getColumn(3).width = 12;
  ws.getColumn(4).width = 12;
  ws.getColumn(5).width = 16;
  ws.getColumn(6).width = 8;
  ws.getColumn(7).width = 8;
  ws.getColumn(8).width = 12;
  ws.getColumn(9).width = 12;
  ws.getColumn(10).width = 30;

  const patients = [
    // ===== DATA1 (14 patients) =====
    ['erdoğan','seyran',1986,'02.Mar.2025','10:37',4.16,4.19,''],
    ['gönen','gülçin',1990,'02.Mar.2025','10:33',4.30,4.34,''],
    ['gündoğdu','seda',1989,'02.Mar.2025','10:34',4.08,4.06,''],
    ['bozkurt','dilek',1982,'02.Mar.2025','10:38',4.39,4.42,''],
    ['çulfa','mustafa',1990,'02.Mar.2025','10:31',4.24,4.25,''],
    ['uras','necla',1988,'02.Mar.2025','13:32',4.23,4.23,''],
    ['öztürk','rahime',1982,'02.Mar.2025','13:34',3.85,3.78,''],
    ['sevinç','rukiye',1984,'02.Mar.2025','13:36',3.91,null,'OS: ---'],
    ['çakır','muhammed baran',2005,'03.Mar.2025','10:57',3.63,3.63,''],
    ['şahbazoğlu','mustafa gökhun',1982,'03.Mar.2025','11:07',3.92,4.00,''],
    ['özçelik','hüma sühan',1984,'03.Mar.2025','10:32',3.96,3.96,''],
    ['şahin','ahmet',1982,'06.Mar.2025','11:49',3.67,3.75,''],
    ['şahin','tuba',1987,'06.Mar.2025','11:48',3.86,3.84,''],
    ['özen','şahin',1984,'03.Mar.2025','11:06',4.21,4.25,''],

    // ===== DATA2 (42 patients) =====
    ['ergen','meşhure',1981,'22.May.2025','11:37',4.28,4.30,''],
    ['demirtaş','fidan',1981,'26.Mar.2025','08:39',null,4.02,'OD: ---'],
    ['şahin','hasan',1982,'16.Tem.2025','08:38',4.19,4.23,''],
    ['gültekin','semra',1982,'05.Ağu.2025','09:42',4.21,4.15,''],
    ['zeybek','gülseren',1982,'07.Ağu.2025','13:25',4.13,3.88,''],
    ['asal','temel refhan',1983,'29.Nis.2025','15:48',4.45,4.52,''],
    ['özdemir','ibrahim',1985,'06.Eki.2025','13:58',3.71,3.69,''],
    ['tamir','sinem',1985,'06.Eki.2025','14:55',4.14,4.21,''],
    ['muhammed fehmi','dinçer',2001,'04.Tem.2025','09:46',3.69,3.66,''],
    ['kayalı','sedat',2001,'13.Eki.2025','13:55',4.06,4.11,''],
    ['atilla','alpkan',2001,'02.Eki.2025','14:57',3.53,null,'OS: ---'],
    ['koçyiğit','döne',2001,'07.Ağu.2025','09:42',3.52,3.41,''],
    ['can','kübra',2001,'19.Şub.2025','14:00',4.05,3.99,''],
    ['gül','esranur',2001,'09.Tem.2025','10:53',3.61,3.55,''],
    ['özdemir','derya',2001,'07.Ağu.2025','11:21',3.78,3.80,''],
    ['köksal','hatice',2002,'04.Tem.2025','13:49',4.12,3.82,''],
    ['kıral','berfin',2002,'09.Tem.2025','09:11',3.29,3.27,''],
    ['durmuşoğlu','hasan',2002,'04.Tem.2025','13:39',3.92,null,'OS: ---'],
    ['duymaz','ahmet ilhan',2003,'23.Nis.2025','11:21',3.75,3.77,''],
    ['özkaya','özkan',2003,'06.Eki.2025','13:51',3.83,3.23,''],
    ['bilge','ecem nur',2003,'13.Eki.2025','14:20',3.64,3.68,''],
    ['pala','fatmagül',2003,'13.Eki.2025','14:44',3.74,null,'OS: ---'],
    ['özdemir','zeynep mediha',2003,'02.Eki.2025','15:00',3.55,null,'OS: ---'],
    ['ateş','esma',2003,'11.Nis.2025','10:38',3.82,3.94,''],
    ['yıldırım','ada',2005,'04.Tem.2025','14:22',3.74,3.74,''],
    ['başdemir','defne',2005,'25.Haz.2025','12:17',3.15,3.14,''],
    ['ünal','zeynep',2005,'15.Eyl.2025','11:57',3.99,3.24,''],
    ['kaya','betül sena',2005,'15.Eyl.2025','14:24',3.39,3.25,''],
    ['çoşkun','ramazan',2005,'26.Tem.2025','17:09',3.44,3.45,''],
    ['dana','samet',2005,'14.May.2025','14:07',3.39,3.35,''],
    ['öz','mustafa can',2005,'05.Ağu.2025','10:01',3.50,3.48,''],
    ['aygündüz','berkay samet',2005,'04.Tem.2025','09:26',3.88,3.86,''],
    ['aydoğdu','dilanur',2004,'13.Eki.2025','14:13',3.40,3.45,''],
    ['sarı','berfu',2004,'05.Ağu.2025','09:58',3.39,3.24,''],
    ['madenoğlu','hilal betül',2004,'22.May.2025','15:33',3.24,3.28,''],
    ['gözüdok','nazlı',2003,'28.May.2025','12:18',3.85,3.88,''],
    ['harlı','gülser yağmur',2003,'04.Mar.2025','11:34',3.92,3.66,''],
    ['çoşkun','tuncay',1992,'04.Tem.2025','09:53',4.43,4.45,''],
    ['çay','mustafa',1992,'18.Ağu.2025','15:23',3.71,3.89,''],
    ['öteleş','murat',1992,'16.Nis.2025','11:00',4.20,4.18,''],
    ['elbiyioğlu','zeynep',1992,'04.Mar.2025','11:41',3.45,3.38,''],
    ['müşereci','hilal',1992,'04.Tem.2025','10:12',3.58,3.57,''],

    // ===== DATA3 (43 unique patients, img-025 duplicate skipped) =====
    ['şengül','burcu',1992,'05.Ağu.2025','09:44',4.00,4.07,''],
    ['akkaya','sümeyye',1993,'09.Tem.2025','10:49',null,3.83,'OD: ---'],
    ['güngör','dürdane',1993,'04.Mar.2025','09:54',3.43,3.53,''],
    ['seyrek','seher',1993,'07.Ağu.2025','11:23',null,4.09,'OD: ---'],
    ['akmaz','uğur',1993,'07.Ağu.2025','11:26',3.85,3.88,''],
    ['şirayder','şirin sinejan',1993,'06.Eki.2025','14:49',3.96,3.95,''],
    ['altındal','abdulkadir',1994,'14.Mar.2025','11:53',3.77,3.72,''],
    ['akkuş','elif',1994,'14.Eki.2025','14:45',3.75,3.68,''],
    ['aslan akçer','kamile',1995,'02.Eki.2025','14:54',3.64,3.44,''],
    ['gürcan','elif nazmiye',1995,'18.Mar.2025','09:39',3.82,3.83,''],
    ['kulu','erdem',1995,'14.Eki.2025','14:56',3.49,3.49,''],
    ['çabuk','bekir',1995,'11.Ağu.2025','10:40',3.55,3.60,''],
    ['mercan','akan',1980,'17.Haz.2025','09:03',null,4.54,'OD: ---'],
    ['esengül','arslan',1980,'04.Tem.2025','13:59',4.36,4.38,''],
    ['çınar yüksel','esra',1980,'07.Ağu.2025','11:24',4.43,3.95,''],
    ['asghar','ali',1980,'14.Mar.2025','09:40',4.51,4.49,''],
    ['kandemir','kemal',1980,'23.May.2025','10:38',4.29,4.21,''],
    ['bayrak','muharrem',1980,'08.Tem.2025','14:36',3.89,4.14,''],
    ['salmanlı','çelebi',1996,'07.Eki.2025','11:00',3.63,3.65,''],
    ['akıncı','elif',1997,'29.May.2025','09:59',3.69,3.67,''],
    ['gökçe','kevser hilal',1997,'04.Tem.2025','14:13',3.27,3.27,''],
    ['özkaya','büşra',1997,'22.May.2025','15:45',4.03,4.07,''],
    ['büyükaşık','melodi',1997,'11.Ağu.2025','10:43',3.80,3.77,''],
    ['kaplan','atike nur',1997,'11.Ağu.2025','15:07',3.65,3.66,''],
    ['kayacı','selin',1997,'14.Şub.2025','10:42',3.53,3.36,''],
    ['yetkin','edanur',1997,'30.Eyl.2025','08:13',3.91,3.76,''],
    ['cucuboğa','ömer faruk',1997,'06.Eki.2025','14:31',3.95,3.66,''],
    ['gündüz','asım burak',1997,'24.May.2025','13:36',3.98,null,'OS: Aphakic'],
    ['gündüz','asım burak',1997,'14.Mar.2025','15:18',3.96,3.95,''],
    ['demirci','şükrü',1997,'28.May.2025','14:27',3.90,3.91,''],
    ['eriş','zeynep ecem',1990,'04.Tem.2025','09:42',3.97,4.01,''],
    ['temirci','ismail',1990,'30.Nis.2025','09:25',3.84,3.87,''],
    ['akyüz','emre',1990,'26.Ağu.2025','11:22',4.13,4.17,''],
    ['pattabanoğlu','burcu',1989,'07.Ağu.2025','11:29',4.42,4.45,''],
    ['akın','atakan',1988,'25.Mar.2025','12:05',4.05,3.91,''],
    ['anık','musa',1988,'07.May.2025','11:32',3.89,4.16,''],
    ['burçak','mustafa',1988,'12.May.2025','15:22',4.26,4.16,''],
    ['çelik','hüseyin',1988,'21.Tem.2025','11:47',3.95,3.93,''],
    ['doğan','selim',1988,'16.Tem.2025','11:26',4.20,4.21,''],
    ['dönmez','oğuzhan',1988,'25.Eyl.2025','13:35',4.04,3.89,''],
    ['ince','zeynep',1988,'18.Nis.2025','11:59',3.88,3.84,''],
    ['karaeli','fatime',1988,'18.Haz.2025','09:38',3.95,3.68,''],
    ['taşdelen','zeliha',1988,'07.Ağu.2025','11:12',4.13,4.21,''],

    // ===== DATA4 (45 patients) =====
    ['çapkur','gülsüm',1988,'27.Şub.2025','10:23',3.52,3.78,''],
    ['çilek','mehmet',1987,'04.Tem.2025','14:11',4.32,4.27,''],
    ['kalınsazlıoğlu','fatma',1987,'06.Eki.2025','14:53',4.00,3.75,''],
    ['öztürk sarışık','özge',1987,'04.Tem.2025','14:02',4.00,3.98,''],
    ['toy','handan',1987,'07.Ağu.2025','11:58',3.90,3.98,''],
    ['memiş','mehmet enes',1986,'09.Tem.2025','10:29',4.39,4.41,''],
    ['şahin','emre',1986,'06.Ağu.2025','10:06',4.13,3.93,''],
    ['baysan','ayşenur eser',1986,'11.Ağu.2025','15:47',3.69,3.60,''],
    ['ceran','salih',1991,'07.May.2025','15:52',null,3.85,'OD: Aphakic'],
    ['görücü','umur',1991,'26.May.2025','15:08',3.53,3.57,''],
    ['karaaslan','süleyman',1991,'02.Tem.2025','13:37',3.78,3.74,''],
    ['küçük','engin',1992,'09.Tem.2025','10:55',3.40,3.30,''],
    ['iynem','çağla',1999,'14.Mar.2025','14:16',3.73,3.71,''],
    ['büyük','hicran',1999,'07.Ağu.2025','11:19',3.69,3.62,''],
    ['karatlı','sedef nur',1999,'11.Ağu.2025','15:08',3.72,3.71,''],
    ['akkaş','seda',1999,'14.Eki.2025','14:46',3.35,3.33,''],
    ['arış','ayşe simay',1999,'05.Ağu.2025','09:56',3.63,3.63,''],
    ['şenel','fatma',1999,'28.May.2025','15:25',4.25,4.21,''],
    ['ceylan','sündüz',1999,'20.Mar.2025','10:50',3.39,3.57,''],
    ['sahutoğlu','merdan',1999,'17.Şub.2025','13:31',3.44,3.46,''],
    ['coşar','zehra',1998,'28.May.2025','12:08',3.64,3.64,''],
    ['tanış','özgül',1998,'14.Mar.2025','15:25',3.67,3.66,''],
    ['ömerbeyoğlu','zeynep',1998,'08.May.2025','16:23',3.76,3.73,''],
    ['kaya','zeynep hande',1998,'13.May.2025','12:00',3.90,3.83,''],
    ['erdemir','aygül',1998,'08.May.2025','16:20',3.89,3.92,''],
    ['çınar','gülruhan',1998,'21.Ağu.2025','13:29',3.57,3.56,''],
    ['küçük','kevser',1998,'11.Ağu.2025','15:10',3.28,3.27,''],
    ['gül','şeyma',1998,'11.Ağu.2025','10:39',3.71,3.69,''],
    ['tosun','tayfun',1998,'04.Tem.2025','09:51',3.51,3.59,''],
    ['onaral','berk',1998,'14.Mar.2025','14:19',3.44,3.41,''],
    ['kan','mustafa',1998,'07.Ağu.2025','13:28',3.89,3.70,''],
    ['akman','mehmet lütfi',1998,'08.May.2025','16:34',3.49,3.47,''],
    ['fidan','yunus emre',1998,'05.Ağu.2025','09:48',3.58,3.60,''],
    ['şahan','fatma',1996,'05.Ağu.2025','09:54',3.58,3.61,''],
    ['doğan','gülbahar',1996,'11.Ağu.2025','15:11',3.90,3.83,''],
    ['gülcü','zahide',1996,'07.Ağu.2025','11:20',3.50,3.30,''],
    ['balaban','merve ada',1996,'07.Ağu.2025','11:27',3.62,3.61,''],
    ['öz','dilan fulya',1996,'05.Ağu.2025','10:03',3.74,3.71,''],
    ['kaya','miraç',1996,'05.Ağu.2025','09:59',3.65,3.50,''],
    ['özen','aysun',1984,'26.Eyl.2024','15:42',null,4.25,'OD: ---'],
    ['bayar','seray',1991,'26.Eyl.2024','15:47',null,3.73,'OD: ---'],
    ['kul','emre',1991,'26.Eyl.2024','16:01',null,4.22,'OD: ---'],
    ['güney','ahmet',1992,'26.Eyl.2024','15:36',null,3.73,'OD: ---'],
    ['akrep','aytunç',1994,'26.Eyl.2024','15:57',null,3.48,'OD: ---'],
    ['cevrioğlu','muhsin',1995,'26.Eyl.2024','15:58',null,3.52,'OD: ---'],

    // ===== DATA5 (38 unique patients, img-014 is duplicate of img-011) =====
    ['merve gül','avbir',2000,'04.Tem.2025','09:49',3.36,3.37,''],
    ['kassap','nerman',2000,'18.Eyl.2025','13:46',3.95,3.93,''],
    ['tutuk','elif',2000,'02.Eki.2025','14:51',3.61,3.45,''],
    ['keleş','irem nur',2000,'06.Eki.2025','14:07',3.49,null,'OS: ---'],
    ['baboca','fatma',2000,'08.May.2025','14:29',null,3.69,'OD: ---'],
    ['biçer','gizem nur',2000,'22.May.2025','12:05',3.49,3.22,''],
    ['çılman','ece',2000,'25.Nis.2025','07:48',null,3.57,'OD: Pseudophakic silicone oil filled'],
    ['yılmaz','ayşe',2000,'22.May.2025','10:52',3.33,3.30,''],
    ['gül','memet eren',2000,'26.Mar.2025','11:05',3.68,3.70,'OS: silicone oil filled'],
    ['demir','eren',2000,'25.Nis.2025','10:52',3.78,3.80,''],
    ['uslu','doğukan',2000,'09.Tem.2025','10:51',3.66,3.37,''],
    ['gümüş','mahmut',2000,'07.Ağu.2025','11:56',4.05,4.17,''],
    ['başer','kemal',2000,'06.Eki.2025','13:49',3.52,3.48,''],
    ['çelik','emre',2000,'21.Ağu.2025','13:25',3.61,3.27,''],
    ['akman','mustafa',2000,'07.Ağu.2025','11:13',3.94,3.79,''],
    ['kuşcu','abdülkadir',2000,'03.Eki.2024','16:04',null,3.41,'OD: ---'],
    ['yılmaz','muhammet eyüp',1998,'30.Eyl.2024','16:48',3.58,3.51,''],
    ['özcan','hüseyin',1998,'30.Eyl.2024','16:45',3.56,3.53,''],
    ['paksoy','said enes',1998,'03.Eki.2024','16:13',3.80,3.73,''],
    ['eyyam','alkım',1996,'26.Eyl.2024','15:55',null,3.86,'OD: ---'],
    ['güzel','ilknur sinem',2001,'26.Eyl.2024','15:53',null,3.60,'OD: ---'],
    ['eren burakhan','zan',2002,'03.Eki.2024','14:17',null,3.32,'OD: ---'],
    ['mercan','aydın',1981,'05.Şub.2026','11:09',4.35,4.34,''],
    ['yalçın','oktay',1982,'16.Şub.2026','10:03',4.01,3.92,''],
    ['ünlü','hasan',1983,'11.Şub.2026','11:50',4.49,4.45,''],
    ['yeşilören','simin gözen',1984,'16.Şub.2026','10:42',4.52,4.57,''],
    ['yılmaz','ahmet erdinç',1985,'18.Şub.2026','09:57',3.90,3.81,''],
    ['sarı','hansiye',1985,'25.Şub.2026','13:55',4.24,4.22,''],
    ['toperi','şükrü',1991,'04.Şub.2026','09:55',4.23,4.21,''],
    ['başaran','şeyma',1994,'19.Şub.2026','13:48',3.84,3.83,''],
    ['karaca','celil',1990,'16.Şub.2026','11:47',4.19,4.19,''],
    ['oran bolat','ayça',1989,'18.Şub.2026','11:36',4.25,4.26,''],
    ['duman','rabia',1999,'04.Şub.2026','15:37',3.71,3.71,''],
    ['altun','ezgi',1998,'09.Şub.2026','15:00',3.79,3.72,''],
    ['görmüş','mehmet raşit',1996,'18.Şub.2026','15:27',3.88,2.96,''],
    ['ulus','kürşat',2004,'23.Şub.2026','13:40',3.43,3.45,''],
    ['ay','zafer',2002,'12.Şub.2026','11:35',3.37,3.32,''],
    ['göle','alihan',2001,'16.Şub.2026','11:49',3.48,3.56,''],

    // ===== DATA6 (9 patients) =====
    ['güdücü','zeliha',1999,'13.Kas.2025','11:50',4.12,4.11,''],
    ['gündoğan','şükran',1992,'13.Kas.2025','11:48',4.10,3.58,''],
    ['arman','selçuk',1984,'13.Kas.2025','11:07',4.09,4.05,''],
    ['kutsal','gülşen',1981,'21.Kas.2025','13:28',3.72,3.79,''],
    ['yıldırım','yakup',2003,'21.Kas.2025','14:08',3.55,3.55,''],
    ['özen','aysun',1984,'11.Mar.2026','10:32',4.27,4.33,''],
    ['çelik','şebnem',1980,'11.Mar.2026','10:33',4.42,4.38,''],
    ['bayar','seray',1991,'11.Mar.2026','10:29',3.81,3.75,''],
    ['ünal','çiğdem',1992,'11.Mar.2026','10:30',3.78,3.77,''],
  ];

  function parseDate(dateStr) {
    const months = {
      'Oca': 0, 'Şub': 1, 'Mar': 2, 'Nis': 3, 'May': 4, 'Haz': 5,
      'Tem': 6, 'Ağu': 7, 'Eyl': 8, 'Eki': 9, 'Kas': 10, 'Ara': 11
    };
    const parts = dateStr.split('.');
    const day = parseInt(parts[0]);
    const month = months[parts[1]];
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  }

  patients.sort((a, b) => {
    const dateA = parseDate(a[3]);
    const dateB = parseDate(b[3]);
    if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
    return a[4].localeCompare(b[4]);
  });

  for (const p of patients) {
    const examYear = parseInt(p[3].split('.')[2]);
    const birthYear = p[2];
    const age = examYear - birthYear;
    const cinsiyet = getCinsiyet(p[1]);
    const row = ws.addRow([
      p[0],
      p[1],
      cinsiyet,
      p[2],
      p[3],
      p[4],
      age,
      p[5] !== null ? p[5] : '---',
      p[6] !== null ? p[6] : '---',
      p[7]
    ]);
    row.alignment = { horizontal: 'center' };
    row.getCell(1).alignment = { horizontal: 'left' };
    row.getCell(2).alignment = { horizontal: 'left' };
    row.getCell(10).alignment = { horizontal: 'left' };
  }

  const outPath = path.join(__dirname, 'client', 'public', 'LENSTAR_LensThickness.xlsx');
  await wb.xlsx.writeFile(outPath);
  console.log(`Excel written to ${outPath} with ${patients.length} patients`);
}

generate().catch(console.error);
