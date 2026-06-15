#!/usr/bin/env node
/*
 * orbital_export.cjs
 * ------------------------------------------------------------------
 * orbital_cases tablosundaki kaydedilmiş olguları anonim, düz (wide)
 * bir CSV'ye aktarır. Ölçümler web aracındaki TS motorunda (shared/
 * orbitalParams.ts) hesaplanıp measurements JSON'una yazıldığı için
 * burada YENİDEN HESAPLAMA YAPILMAZ — tek doğruluk kaynağı korunur.
 *
 * Çıktı:
 *   scripts/data/orbital_dataset.csv   (analiz girdisi)
 *   scripts/data/orbital_dataset.meta.json  (SHA-256 + n + zaman)
 *
 * Reproducibility: CSV'nin SHA-256 özeti meta dosyasına ve konsola
 * yazılır; istatistik betiği bu özeti raporuna işler.
 *
 * Çalıştırma:  node scripts/orbital_export.cjs
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const pg = require("pg");

// measurements.right içindeki parametreler için tercih edilen sütun sırası.
const AUTO_ORDER = [
  "OW", "OH", "OD", "OI", "OP", "MOD", "mOD", "OA",
  "SOT", "SOW", "SORT", "LORT", "IORT", "MORT", "OFA", "OFI",
];
const MANUAL_ORDER = ["OV"]; // elle girilen (hacim)

function num(v) {
  return v == null || Number.isNaN(v) ? "" : String(v);
}
function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL tanımlı değil.");
    process.exit(1);
  }
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const userId = process.env.ORBITAL_USER_ID;
  const sql = "SELECT code, sex, age, measurements, manual_values FROM orbital_cases"
    + (userId ? " WHERE user_id = $1" : "") + " ORDER BY code";
  const { rows } = await pool.query(sql, userId ? [userId] : []);
  await pool.end();

  // Hangi auto/manual anahtarların gerçekte var olduğunu keşfet.
  const autoKeys = new Set();
  const manualKeys = new Set();
  const parsed = rows.map((r) => {
    let meas = {};
    let manual = {};
    try { meas = r.measurements ? JSON.parse(r.measurements) : {}; } catch {}
    try { manual = r.manual_values ? JSON.parse(r.manual_values) : {}; } catch {}
    Object.keys(meas.right || {}).forEach((k) => autoKeys.add(k));
    Object.keys(meas.left || {}).forEach((k) => autoKeys.add(k));
    Object.keys(manual || {}).forEach((k) => manualKeys.add(k));
    return { r, meas, manual };
  });

  const orderedAuto = [
    ...AUTO_ORDER.filter((k) => autoKeys.has(k)),
    ...[...autoKeys].filter((k) => !AUTO_ORDER.includes(k)).sort(),
  ];
  const orderedManual = [
    ...MANUAL_ORDER.filter((k) => manualKeys.has(k)),
    ...[...manualKeys].filter((k) => !MANUAL_ORDER.includes(k)).sort(),
  ];

  const header = ["code", "sex", "age", "coordinateSystem"];
  for (const k of orderedAuto) header.push(`${k}_R`, `${k}_L`);
  for (const k of orderedManual) header.push(`${k}_R`, `${k}_L`);
  header.push("IOD");

  const lines = [header.map(csvCell).join(",")];
  for (const { r, meas, manual } of parsed) {
    const right = meas.right || {};
    const left = meas.left || {};
    const row = [r.code, r.sex || "", r.age ?? "", meas.coordinateSystem || ""];
    for (const k of orderedAuto) row.push(num(right[k]), num(left[k]));
    for (const k of orderedManual) {
      const m = manual[k] || {};
      row.push(num(m.right), num(m.left));
    }
    row.push(num(meas.iod));
    lines.push(row.map(csvCell).join(","));
  }

  // Çıktı yolu: route per-request izole bir dosya verir (ORBITAL_OUT_CSV);
  // CLI'da varsayılan scripts/data/orbital_dataset.csv kullanılır.
  const csvPath = process.env.ORBITAL_OUT_CSV
    ? path.resolve(process.env.ORBITAL_OUT_CSV)
    : path.join(__dirname, "data", "orbital_dataset.csv");
  const dir = path.dirname(csvPath);
  fs.mkdirSync(dir, { recursive: true });
  const csv = lines.join("\n") + "\n";
  fs.writeFileSync(csvPath, csv, "utf8");

  const sha = crypto.createHash("sha256").update(csv).digest("hex");
  const meta = {
    generatedAt: new Date().toISOString(),
    n: rows.length,
    columns: header,
    sha256: sha,
    note: "Ölçümler shared/orbitalParams.ts motorundan; bu betik yeniden hesaplamaz.",
  };
  fs.writeFileSync(path.join(dir, "orbital_dataset.meta.json"), JSON.stringify(meta, null, 2));

  console.log(`Aktarıldı: ${rows.length} olgu -> ${path.relative(process.cwd(), csvPath)}`);
  console.log(`Sütunlar: ${header.length} | SHA-256: ${sha}`);
  if (rows.length === 0) {
    console.log("UYARI: tabloda olgu yok. Önce web aracıyla olgu kaydedin.");
  }
}

main().catch((e) => {
  console.error("Export hatası:", e.message);
  process.exit(1);
});
