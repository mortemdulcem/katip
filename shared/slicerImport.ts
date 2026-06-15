// 3D Slicer markup dosyalarını (.mrk.json ve .fcsv) okuyup orbital
// landmark/iz yapısına dönüştürür. Zero-hallucination: yalnızca dosyada
// gerçekten bulunan koordinatlar kullanılır; eşleşmeyen noktalar açıkça raporlanır.

import { ORBIT_LANDMARKS, ORBIT_TRACES, type Vec3, type SideData } from "./orbitalParams";

export type SideHint = "right" | "left" | "auto";

export interface ParsedPoint {
  name: string;
  pos: Vec3;
}
export interface ParsedCurve {
  name: string;
  points: Vec3[];
}
export interface ParsedMarkups {
  coordinateSystem: string; // "RAS" | "LPS" | "unknown"
  points: ParsedPoint[];
  curves: ParsedCurve[];
}

// --- Düşük seviyeli dosya çözümleyiciler ------------------------------------

// Koordinat sistemini normalize et: eski fcsv sayısal kodları (0=RAS, 1=LPS,
// 2=IJK) ile yeni metin değerlerini tek biçime indir.
function normCoord(v: string): string {
  const u = v.trim().toUpperCase();
  if (u === "0") return "RAS";
  if (u === "1") return "LPS";
  if (u === "2") return "IJK";
  if (u === "RAS" || u === "LPS" || u === "IJK") return u;
  return "unknown";
}

export function parseMrkJson(text: string): ParsedMarkups {
  const data = JSON.parse(text);
  const points: ParsedPoint[] = [];
  const curves: ParsedCurve[] = [];
  let coord = "unknown";
  const markups: any[] = Array.isArray(data?.markups) ? data.markups : [];
  for (const m of markups) {
    if (m?.coordinateSystem != null) coord = normCoord(String(m.coordinateSystem));
    const cps: any[] = Array.isArray(m?.controlPoints) ? m.controlPoints : [];
    const type = String(m?.type || "").toLowerCase();
    const isCurve = type.includes("curve");
    if (isCurve) {
      const pts: Vec3[] = cps
        .filter((cp) => Array.isArray(cp?.position) && cp.position.length >= 3)
        .map((cp) => [cp.position[0], cp.position[1], cp.position[2]] as Vec3);
      const name = String(m?.name || m?.label || "curve");
      if (pts.length) curves.push({ name, points: pts });
    } else {
      for (const cp of cps) {
        if (!Array.isArray(cp?.position) || cp.position.length < 3) continue;
        points.push({
          name: String(cp?.label ?? cp?.id ?? ""),
          pos: [cp.position[0], cp.position[1], cp.position[2]],
        });
      }
    }
  }
  return { coordinateSystem: coord, points, curves };
}

export function parseFcsv(text: string): ParsedMarkups {
  const lines = text.split(/\r?\n/);
  const points: ParsedPoint[] = [];
  let coord = "unknown";
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      const mm = line.match(/coordinatesystem\s*=\s*(\w+)/i);
      if (mm) coord = normCoord(mm[1]);
      continue;
    }
    // id,x,y,z,ow,ox,oy,oz,vis,sel,lock,label,desc,associatedNodeID
    const c = line.split(",");
    if (c.length < 4) continue;
    const x = parseFloat(c[1]);
    const y = parseFloat(c[2]);
    const z = parseFloat(c[3]);
    if (![x, y, z].every((v) => Number.isFinite(v))) continue;
    const label = (c[11] ?? c[0] ?? "").trim();
    points.push({ name: label, pos: [x, y, z] });
  }
  return { coordinateSystem: coord, points, curves: [] };
}

export function parseSlicerFile(filename: string, text: string): ParsedMarkups {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".json")) return parseMrkJson(text);
  if (lower.endsWith(".fcsv")) return parseFcsv(text);
  // uzantı belirsiz -> içeriğe bak
  const t = text.trimStart();
  if (t.startsWith("{")) return parseMrkJson(text);
  return parseFcsv(text);
}

// --- Etiket normalizasyonu ve yan tespiti -----------------------------------

// Yalnızca çok-karakterli, kesin yan belirteçleri (tek harfli "r"/"l" ayrı ele
// alınır — çünkü id'lerimizde "_l" lateral eki var, ör. "sow_l").
const STRONG_R = ["right", "rt", "sag", "dexter", "dext"];
const STRONG_L = ["left", "lt", "sol", "sinister"];

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .trim();
}

// İsmi ayraçlardan (boşluk/_/-/.) parçala -> token'lar.
function tokenize(name: string): string[] {
  return norm(name).split(/[^a-z0-9]+/).filter(Boolean);
}

const LANDMARK_IDS = ORBIT_LANDMARKS.map((d) => d.id);
const TRACE_IDS = ORBIT_TRACES.map((t) => t.id);

// nid (alt çizgisiz id) -> gerçek id sözlüğü. Ör. "sowl" -> "sow_l".
const NID_TO_ID: Record<string, string> = {};
for (const id of LANDMARK_IDS) NID_TO_ID[id.replace(/_/g, "")] = id;

// Token listesinden kesin yan belirteçlerini ayıkla.
function strongSide(tokens: string[]): "right" | "left" | null {
  for (const t of tokens) {
    if (STRONG_R.includes(t)) return "right";
    if (STRONG_L.includes(t)) return "left";
  }
  return null;
}

// Bir nokta adını landmark id'sine + yana çöz.
// Önce kesin yan belirteçlerini at; kalan token'ları birleştir ve doğrudan
// id eşle. Eşleşmezse, sondaki tek harf "r"/"l"yi yan kabul edip tekrar dene
// (yalnızca geri kalan gerçek bir id ise) — böylece "sow_l" (lateral) bozulmaz.
function resolvePoint(name: string): { id: string | null; side: "right" | "left" | null } {
  const toks = tokenize(name);
  let side = strongSide(toks);
  const rest = toks.filter((t) => !STRONG_R.includes(t) && !STRONG_L.includes(t));
  const direct = rest.join("");
  if (NID_TO_ID[direct]) return { id: NID_TO_ID[direct], side };
  if (rest.length) {
    const last = rest[rest.length - 1];
    if (last === "r" || last === "l") {
      const cand = rest.slice(0, -1).join("");
      if (NID_TO_ID[cand]) {
        return { id: NID_TO_ID[cand], side: side ?? (last === "r" ? "right" : "left") };
      }
    }
  }
  return { id: null, side };
}

// İz (curve) adını rim/floor + yana çöz.
function resolveCurve(name: string): { trace: "rim" | "floor" | null; side: "right" | "left" | null } {
  const toks = tokenize(name);
  let side = strongSide(toks);
  if (!side && toks.length) {
    const last = toks[toks.length - 1];
    if (last === "r") side = "right";
    else if (last === "l") side = "left";
  }
  const joined = toks.join("");
  let trace: "rim" | "floor" | null = null;
  if (/rim|kenar|aperture|aciklik/.test(joined)) trace = "rim";
  else if (/floor|taban|zemin/.test(joined)) trace = "floor";
  return { trace, side };
}

export function detectSide(name: string): "right" | "left" | null {
  return resolvePoint(name).side ?? resolveCurve(name).side;
}

// --- Yüksek seviye eşleme ----------------------------------------------------

export type ImportKind = "point" | "curve";
export interface ImportMappingItem {
  source: string; // dosyadaki isim
  kind: ImportKind;
  target: string; // landmark id / "rim" / "floor" / "" (atanmadı)
  side: "right" | "left";
  pos?: Vec3; // tekil landmark için
  count?: number; // iz için nokta sayısı
  curveIndex?: number; // iz için parsed.curves içindeki kararlı indeks
  auto: boolean; // otomatik eşleşti mi
}

export interface ImportResult {
  coordinateSystem: string;
  items: ImportMappingItem[];
}

// Çözümlenmiş markup'ları, kullanıcı incelemesine hazır eşleme listesine dönüştür.
// Eşleşmeyenler de target:"" ile döner (kullanıcı elle atayabilsin).
export function buildImportResult(parsed: ParsedMarkups, hint: SideHint): ImportResult {
  const items: ImportMappingItem[] = [];
  const fallback: "right" | "left" = hint === "left" ? "left" : "right";

  for (const p of parsed.points) {
    const { id, side: dSide } = resolvePoint(p.name);
    const side = hint === "auto" ? dSide ?? fallback : hint;
    items.push({
      source: p.name || "(isimsiz)",
      kind: "point",
      target: id ?? "",
      side,
      pos: p.pos,
      auto: !!id,
    });
  }
  for (let ci = 0; ci < parsed.curves.length; ci++) {
    const c = parsed.curves[ci];
    const { trace, side: dSide } = resolveCurve(c.name);
    const side = hint === "auto" ? dSide ?? fallback : hint;
    items.push({
      source: c.name,
      kind: "curve",
      target: trace ?? "",
      side,
      count: c.points.length,
      curveIndex: ci,
      auto: !!trace,
    });
  }
  return { coordinateSystem: parsed.coordinateSystem, items };
}

// Onaylanmış eşlemeyi SideData'ya uygula (mevcut taraflara birleştirir).
export function applyMapping(
  parsed: ParsedMarkups,
  mapping: ImportMappingItem[],
  current: { right: SideData; left: SideData },
): { right: SideData; left: SideData } {
  const clone = (s: SideData): SideData => ({
    landmarks: { ...s.landmarks },
    rim: [...(s.rim || [])],
    floor: [...(s.floor || [])],
  });
  const next = { right: clone(current.right), left: clone(current.left) };

  for (const item of mapping) {
    if (!item.target) continue;
    const dest = next[item.side];
    if (LANDMARK_IDS.includes(item.target)) {
      if (item.pos) dest.landmarks[item.target] = item.pos;
    } else if (TRACE_IDS.includes(item.target as any)) {
      const curve = item.curveIndex != null
        ? parsed.curves[item.curveIndex]
        : parsed.curves.find((c) => c.name === item.source);
      if (curve) dest[item.target as "rim" | "floor"] = curve.points.slice();
    }
  }
  return next;
}

// Slicer'da kullanılacak isim sözlüğü (kullanıcıya rehber).
export function namingGuide(): { id: string; label: string }[] {
  return ORBIT_LANDMARKS.map((d) => ({ id: d.id, label: d.label }));
}
