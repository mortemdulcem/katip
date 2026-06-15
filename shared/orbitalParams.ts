// =============================================================================
// Orbital Morfometri — Ölçüm Motoru (tekrarlanabilir, uydurmasız)
// Tüm parametreler (OV/hacim hariç) yerleştirilen anatomik noktalardan
// (landmark) deterministik geometri ile hesaplanır. STL birimi = mm (Slicer).
// =============================================================================

export type Vec3 = [number, number, number];

export type Side = "right" | "left";

// --- Temel vektör geometrisi -------------------------------------------------

export function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
export function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
export function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}
export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
export function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
export function norm(a: Vec3): number {
  return Math.sqrt(dot(a, a));
}
export function dist(a: Vec3, b: Vec3): number {
  return norm(sub(a, b));
}
export function normalize(a: Vec3): Vec3 {
  const n = norm(a);
  return n === 0 ? [0, 0, 0] : [a[0] / n, a[1] / n, a[2] / n];
}
export function centroid(pts: Vec3[]): Vec3 {
  const s = pts.reduce<Vec3>((acc, p) => add(acc, p), [0, 0, 0]);
  return scale(s, 1 / pts.length);
}

// Üç nokta arasında orta noktadaki açı (derece). vertex'te a-vertex-b açısı.
// Dejenere durumda (üst üste nokta) NaN döner -> computeSide bunu null yapar.
export function angleAt(vertex: Vec3, a: Vec3, b: Vec3): number {
  const uRaw = sub(a, vertex);
  const vRaw = sub(b, vertex);
  if (norm(uRaw) < 1e-9 || norm(vRaw) < 1e-9) return NaN;
  let c = dot(normalize(uRaw), normalize(vRaw));
  c = Math.max(-1, Math.min(1, c));
  return (Math.acos(c) * 180) / Math.PI;
}

// Sıralı nokta dizisinin (poligon) çevre uzunluğu. closed=true ise kapatır.
export function polylineLength(pts: Vec3[], closed = true): number {
  if (pts.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) total += dist(pts[i], pts[i + 1]);
  if (closed) total += dist(pts[pts.length - 1], pts[0]);
  return total;
}

// Newell metodu ile (yaklaşık düzlemsel) poligon normali.
export function newellNormal(pts: Vec3[]): Vec3 {
  let n: Vec3 = [0, 0, 0];
  for (let i = 0; i < pts.length; i++) {
    const c = pts[i];
    const next = pts[(i + 1) % pts.length];
    n[0] += (c[1] - next[1]) * (c[2] + next[2]);
    n[1] += (c[2] - next[2]) * (c[0] + next[0]);
    n[2] += (c[0] - next[0]) * (c[1] + next[1]);
  }
  return n;
}

// 3B düzlemsel poligon alanı (Newell alan vektörünün büyüklüğü / 2).
export function polygonArea(pts: Vec3[]): number {
  if (pts.length < 3) return 0;
  return norm(newellNormal(pts)) / 2;
}

// İki düzlem arasındaki açı (normalleri arası), derece. [0,90].
export function planeAngle(n1: Vec3, n2: Vec3): number {
  const a = normalize(n1);
  const b = normalize(n2);
  let c = Math.abs(dot(a, b));
  c = Math.max(-1, Math.min(1, c));
  return (Math.acos(c) * 180) / Math.PI;
}

// Düzleme izdüşüm için ortonormal taban (u,v) üret.
function planeBasis(n: Vec3): { u: Vec3; v: Vec3 } {
  const nn = normalize(n);
  // n'e dik bir vektör seç
  const seed: Vec3 = Math.abs(nn[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const u = normalize(cross(nn, seed));
  const v = normalize(cross(nn, u));
  return { u, v };
}

// Maksimal ve minimal kaliper çapı. Her ikisi de AYNI 2B projeksiyon
// uzayında (en iyi-uyum düzlemi) hesaplanır -> metrik tutarlılığı.
// max = en büyük 2B ikili mesafe; min = döner kaliper minimum genişliği (0.25°).
export function calipers(pts: Vec3[]): { max: number; min: number } {
  if (pts.length < 2) return { max: 0, min: 0 };
  const c = centroid(pts);
  const n = newellNormal(pts);
  // Dejenere/kolineer düzlem: projeksiyon güvenilmez -> 3B ikili mesafeden max ver.
  if (norm(n) < 1e-9) {
    let mx = 0;
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) {
        const d = dist(pts[i], pts[j]);
        if (d > mx) mx = d;
      }
    return { max: mx, min: 0 };
  }
  const { u, v } = planeBasis(n);
  const pts2d = pts.map((p) => {
    const r = sub(p, c);
    return [dot(r, u), dot(r, v)] as [number, number];
  });
  // max çap = aynı 2B uzayda en büyük ikili mesafe
  let max = 0;
  for (let i = 0; i < pts2d.length; i++)
    for (let j = i + 1; j < pts2d.length; j++) {
      const dx = pts2d[i][0] - pts2d[j][0];
      const dy = pts2d[i][1] - pts2d[j][1];
      const d = Math.hypot(dx, dy);
      if (d > max) max = d;
    }
  // min genişlik = döner kaliper (0.25° çözünürlük)
  let min = Infinity;
  const STEPS = 720;
  for (let s = 0; s < STEPS; s++) {
    const ang = (Math.PI * s) / STEPS;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    let lo = Infinity;
    let hi = -Infinity;
    for (const [x, y] of pts2d) {
      const proj = x * dx + y * dy;
      if (proj < lo) lo = proj;
      if (proj > hi) hi = proj;
    }
    const width = hi - lo;
    if (width < min) min = width;
  }
  return { max, min: min === Infinity ? 0 : min };
}

// --- Landmark şeması ---------------------------------------------------------

export interface LandmarkDef {
  id: string;
  label: string;
  group: string;
  hint: string;
}

// Her orbita (sağ ve sol ayrı) için yerleştirilecek tekil noktalar.
export const ORBIT_LANDMARKS: LandmarkDef[] = [
  { id: "ec", label: "Ektokonkion (lateral kenar)", group: "Temel", hint: "Lateral orbital kenarın yatay eksenle kesiştiği nokta" },
  { id: "mf", label: "Maksillofrontale (medial kenar)", group: "Temel", hint: "Medial orbital kenarda frontomaksiller sütur noktası" },
  { id: "sor", label: "Supraorbital orta (üst kenar)", group: "Temel", hint: "Üst orbital kenarın orta noktası" },
  { id: "ior", label: "İnfraorbital orta (alt kenar)", group: "Temel", hint: "Alt orbital kenarın orta noktası" },
  { id: "apex", label: "Orbital apeks", group: "Temel", hint: "Orbitanın en derin noktası / optik kanal girişi" },
  { id: "d", label: "Dakriyon", group: "Mesafe", hint: "Medial nokta (interorbital mesafe için)" },
  { id: "sot_o", label: "Supraorbital kalınlık — dış", group: "Kalınlık", hint: "Supraorbital kenarlık ortası, dış yüzey" },
  { id: "sot_i", label: "Supraorbital kalınlık — iç", group: "Kalınlık", hint: "Supraorbital kenarlık ortası, iç yüzey" },
  { id: "sow_m", label: "Supraorbital genişlik — medial", group: "Kalınlık", hint: "Supraorbital bölge medial uç" },
  { id: "sow_l", label: "Supraorbital genişlik — lateral", group: "Kalınlık", hint: "Supraorbital bölge lateral uç" },
  { id: "sort_o", label: "Superior kenar kalınlık — dış", group: "Kalınlık", hint: "Üst kenar ortası, dış yüzey" },
  { id: "sort_i", label: "Superior kenar kalınlık — iç", group: "Kalınlık", hint: "Üst kenar ortası, iç yüzey" },
  { id: "lort_o", label: "Lateral kenar kalınlık — dış", group: "Kalınlık", hint: "Dış kenar ortası, dış yüzey" },
  { id: "lort_i", label: "Lateral kenar kalınlık — iç", group: "Kalınlık", hint: "Dış kenar ortası, iç yüzey" },
  { id: "iort_o", label: "İnferior kenar kalınlık — dış", group: "Kalınlık", hint: "Alt kenar ortası, dış yüzey" },
  { id: "iort_i", label: "İnferior kenar kalınlık — iç", group: "Kalınlık", hint: "Alt kenar ortası, iç yüzey" },
  { id: "mort_o", label: "Medial kenar kalınlık — dış", group: "Kalınlık", hint: "İç kenar ortası, dış yüzey" },
  { id: "mort_i", label: "Medial kenar kalınlık — iç", group: "Kalınlık", hint: "İç kenar ortası, iç yüzey" },
];

// Değişken uzunluklu sıralı nokta izleri (poligon).
export const ORBIT_TRACES = [
  { id: "rim", label: "Orbital kenar izi (çevre/çap)", min: 8, hint: "Orbital açıklığın kenarı boyunca sırayla en az 8 nokta" },
  { id: "floor", label: "Orbital taban izi (alan/eğim)", min: 5, hint: "Orbital tabanın sınırı boyunca sırayla en az 5 nokta" },
];

// --- Parametre tanımları -----------------------------------------------------

export type ParamMode = "auto" | "manual";

export interface ParamDef {
  abbr: string;
  label: string;
  unit: string;
  mode: ParamMode; // auto = landmark'tan hesaplanır, manual = Slicer'dan girilir
  bilateral?: boolean; // tek değer (sağ/sol yok), ör. IOD
}

export const ORBITAL_PARAMS: ParamDef[] = [
  { abbr: "OW", label: "Orbital Genişlik", unit: "mm", mode: "auto" },
  { abbr: "OH", label: "Orbital Yükseklik", unit: "mm", mode: "auto" },
  { abbr: "OD", label: "Orbital Derinlik", unit: "mm", mode: "auto" },
  { abbr: "OI", label: "Orbital İndeks", unit: "%", mode: "auto" },
  { abbr: "OV", label: "Orbital Hacim", unit: "mm³", mode: "manual" },
  { abbr: "OP", label: "Orbital Çevre", unit: "mm", mode: "auto" },
  { abbr: "MOD", label: "Maksimal Orbital Çap", unit: "mm", mode: "auto" },
  { abbr: "mOD", label: "Minimal Orbital Çap", unit: "mm", mode: "auto" },
  { abbr: "OA", label: "Orbital Açı", unit: "°", mode: "auto" },
  { abbr: "IOD", label: "İnterorbital Mesafe", unit: "mm", mode: "auto", bilateral: true },
  { abbr: "SOT", label: "Supraorbital Kenarlık Kalınlığı", unit: "mm", mode: "auto" },
  { abbr: "SOW", label: "Supraorbital Genişlik", unit: "mm", mode: "auto" },
  { abbr: "SORT", label: "Superior Orbital Kenar Kalınlığı", unit: "mm", mode: "auto" },
  { abbr: "LORT", label: "Lateral Orbital Kenar Kalınlığı", unit: "mm", mode: "auto" },
  { abbr: "IORT", label: "İnferior Orbital Kenar Kalınlığı", unit: "mm", mode: "auto" },
  { abbr: "MORT", label: "Medial Orbital Kenar Kalınlığı", unit: "mm", mode: "auto" },
  { abbr: "OFA", label: "Orbital Taban Alanı", unit: "mm²", mode: "auto" },
  { abbr: "OFI", label: "Orbital Taban Eğimi", unit: "°", mode: "auto" },
];

// --- Hesaplama ---------------------------------------------------------------

export type LandmarkSet = Record<string, Vec3 | undefined>;
export interface SideData {
  landmarks: LandmarkSet;
  rim?: Vec3[];
  floor?: Vec3[];
}

function need(lm: LandmarkSet, ...ids: string[]): boolean {
  return ids.every((id) => Array.isArray(lm[id]));
}

// Tek bir orbita için otomatik parametreler. Eksik landmark -> null.
export function computeSide(data: SideData): Record<string, number | null> {
  const lm = data.landmarks || {};
  const rim = data.rim || [];
  const floor = data.floor || [];
  const out: Record<string, number | null> = {};

  out.OW = need(lm, "ec", "mf") ? dist(lm.ec!, lm.mf!) : null;
  out.OH = need(lm, "sor", "ior") ? dist(lm.sor!, lm.ior!) : null;
  out.OD =
    need(lm, "apex", "ec", "mf", "sor", "ior")
      ? dist(lm.apex!, centroid([lm.ec!, lm.mf!, lm.sor!, lm.ior!]))
      : null;
  out.OI = out.OW && out.OH ? (out.OH / out.OW) * 100 : null;
  out.OP = rim.length >= 3 ? polylineLength(rim, true) : null;
  if (rim.length >= 2) {
    const cal = calipers(rim);
    out.MOD = cal.max;
    out.mOD = cal.min;
  } else {
    out.MOD = null;
    out.mOD = null;
  }
  out.OA = need(lm, "apex", "ec", "mf") ? angleAt(lm.apex!, lm.ec!, lm.mf!) : null;
  out.SOT = need(lm, "sot_o", "sot_i") ? dist(lm.sot_o!, lm.sot_i!) : null;
  out.SOW = need(lm, "sow_m", "sow_l") ? dist(lm.sow_m!, lm.sow_l!) : null;
  out.SORT = need(lm, "sort_o", "sort_i") ? dist(lm.sort_o!, lm.sort_i!) : null;
  out.LORT = need(lm, "lort_o", "lort_i") ? dist(lm.lort_o!, lm.lort_i!) : null;
  out.IORT = need(lm, "iort_o", "iort_i") ? dist(lm.iort_o!, lm.iort_i!) : null;
  out.MORT = need(lm, "mort_o", "mort_i") ? dist(lm.mort_o!, lm.mort_i!) : null;
  out.OFA = floor.length >= 3 ? polygonArea(floor) : null;
  // OFI: taban düzlemi ile orbital açıklık (rim) düzlemi arası açı.
  // Rim'e göre tanımlandığı için STL'in dünya yönelimliğinden BAĞIMSIZ -> olgular karşılaştırılabilir.
  if (floor.length >= 3 && rim.length >= 3) {
    const nf = newellNormal(floor);
    const nr = newellNormal(rim);
    out.OFI = norm(nf) > 1e-9 && norm(nr) > 1e-9 ? planeAngle(nf, nr) : null;
  } else {
    out.OFI = null;
  }

  // NaN / Infinity -> null (dejenere geometri sessizce yanlış sayı üretmesin)
  for (const k of Object.keys(out)) {
    const val = out[k];
    if (val != null && !isFinite(val)) out[k] = null;
  }

  return out;
}

// İnterorbital mesafe — iki orbitanın dakriyon noktaları arası.
export function computeIOD(right: SideData, left: SideData): number | null {
  const r = right.landmarks?.d;
  const l = left.landmarks?.d;
  return Array.isArray(r) && Array.isArray(l) ? dist(r, l) : null;
}

// Asimetri: işaretli fark (R-L) ve yüzde asimetri |R-L|/ort *100.
export function asymmetry(
  r: number | null,
  l: number | null
): { diff: number | null; pct: number | null } {
  if (r == null || l == null) return { diff: null, pct: null };
  const diff = r - l;
  const mean = (r + l) / 2;
  const pct = mean === 0 ? null : (Math.abs(diff) / mean) * 100;
  return { diff, pct };
}

export function roundNum(v: number | null, digits = 2): number | null {
  if (v == null || !isFinite(v)) return null;
  const f = Math.pow(10, digits);
  return Math.round(v * f) / f;
}
