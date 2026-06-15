import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Upload, RotateCcw, Eraser, Save, Trash2, Box, Ruler, ScanEye,
  Plus, FileSpreadsheet, FileInput, CheckCircle2, Circle, AlertTriangle,
} from "lucide-react";
import {
  ORBIT_LANDMARKS, ORBIT_TRACES, ORBITAL_PARAMS,
  computeSide, computeIOD, asymmetry, roundNum,
  type Vec3, type SideData,
} from "@shared/orbitalParams";
import {
  parseSlicerFile, buildImportResult, applyMapping,
  type ParsedMarkups, type ImportMappingItem,
} from "@shared/slicerImport";

type Side = "right" | "left";
type SidesState = { right: SideData; left: SideData };
type ManualValues = Record<string, { right?: number; left?: number }>;

const emptySides = (): SidesState => ({
  right: { landmarks: {}, rim: [], floor: [] },
  left: { landmarks: {}, rim: [], floor: [] },
});

interface PendingFile {
  name: string;
  parsed: ParsedMarkups;
  items: ImportMappingItem[];
}

const GROUP_COLOR: Record<string, number> = {
  Temel: 0x22c55e,
  Mesafe: 0x3b82f6,
  Kalınlık: 0xf59e0b,
};

// İçe aktarma hedef seçenekleri (Select için)
const TARGET_OPTIONS: { value: string; label: string }[] = [
  { value: "__none__", label: "— (atama yok)" },
  ...ORBIT_LANDMARKS.map((d) => ({ value: d.id, label: `${d.id} · ${d.label}` })),
  ...ORBIT_TRACES.map((t) => ({ value: t.id, label: `${t.id} · ${t.label}` })),
];

export default function OrbitalMorphometry() {
  const { toast } = useToast();
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const controlsRef = useRef<OrbitControls>();
  const meshRef = useRef<THREE.Mesh>();
  const markersRef = useRef<THREE.Group>();
  const radiusRef = useRef(1);

  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelName, setModelName] = useState("");
  const [side, setSide] = useState<Side>("right");
  const [sides, setSides] = useState<SidesState>(emptySides());

  // içe aktarma durumu
  const [sideHint, setSideHint] = useState<"auto" | "right" | "left">("auto");
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [coordSys, setCoordSys] = useState<string>("");

  const [code, setCode] = useState("");
  const [sex, setSex] = useState("");
  const [age, setAge] = useState("");
  const [notes, setNotes] = useState("");
  const [manual, setManual] = useState<ManualValues>({ OV: {} });
  const [currentId, setCurrentId] = useState<number | null>(null);

  // ---- Three.js sahne kurulumu (salt-okunur önizleme) ----
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45, mount.clientWidth / mount.clientHeight, 0.1, 5000,
    );
    camera.position.set(0, 0, 200);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dir1.position.set(1, 1, 1);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.5);
    dir2.position.set(-1, -1, -1);
    scene.add(dir2);

    const markers = new THREE.Group();
    scene.add(markers);
    markersRef.current = markers;

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  // ---- STL yükleme (opsiyonel görselleştirme) ----
  const loadStl = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const loader = new STLLoader();
        const geom = loader.parse(reader.result as ArrayBuffer);
        // NOT: geometri taşınmaz/merkeze alınmaz -> Slicer landmark dünya
        // koordinatlarıyla birebir hizalı kalsın diye.
        geom.computeVertexNormals();
        geom.computeBoundingSphere();
        const sphere = geom.boundingSphere;
        const r = sphere?.radius || 100;
        radiusRef.current = r;
        const center = sphere?.center || new THREE.Vector3();

        const scene = sceneRef.current!;
        if (meshRef.current) {
          scene.remove(meshRef.current);
          meshRef.current.geometry.dispose();
        }
        const mat = new THREE.MeshPhongMaterial({
          color: 0xd9c7a3, specular: 0x222222, shininess: 25,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geom, mat);
        scene.add(mesh);
        meshRef.current = mesh;

        const cam = cameraRef.current!;
        cam.position.set(center.x, center.y, center.z + r * 3);
        cam.near = r / 100;
        cam.far = r * 100;
        cam.updateProjectionMatrix();
        controlsRef.current!.target.set(center.x, center.y, center.z);
        controlsRef.current!.update();

        setModelName(file.name);
        setModelLoaded(true);
        toast({ title: "Model yüklendi", description: file.name });
      } catch (err: any) {
        toast({ title: "STL okunamadı", description: err.message, variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  }, [toast]);

  // ---- işaretçileri çiz (içe aktarılan noktalar) ----
  useEffect(() => {
    const markers = markersRef.current;
    if (!markers) return;
    while (markers.children.length) {
      const c = markers.children.pop()!;
      (c as any).geometry?.dispose?.();
      (c as any).material?.dispose?.();
    }
    const base = modelLoaded ? radiusRef.current * 0.012 : 1.2;
    const sd = sides[side];

    for (const def of ORBIT_LANDMARKS) {
      const pos = sd.landmarks[def.id];
      if (!Array.isArray(pos)) continue;
      const color = GROUP_COLOR[def.group] || 0xffffff;
      const sph = new THREE.Mesh(
        new THREE.SphereGeometry(base, 16, 16),
        new THREE.MeshBasicMaterial({ color }),
      );
      sph.position.set(pos[0], pos[1], pos[2]);
      markers.add(sph);
    }

    const drawTrace = (pts: Vec3[] | undefined, color: number) => {
      if (!pts || pts.length === 0) return;
      for (const pt of pts) {
        const sph = new THREE.Mesh(
          new THREE.SphereGeometry(base * 0.8, 12, 12),
          new THREE.MeshBasicMaterial({ color }),
        );
        sph.position.set(pt[0], pt[1], pt[2]);
        markers.add(sph);
      }
      if (pts.length >= 2) {
        const closed = [...pts, pts[0]];
        const g = new THREE.BufferGeometry().setFromPoints(
          closed.map((q) => new THREE.Vector3(q[0], q[1], q[2])),
        );
        markers.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color })));
      }
    };
    drawTrace(sd.rim, 0x06b6d4);
    drawTrace(sd.floor, 0xec4899);
  }, [sides, side, modelLoaded]);

  // ---- hesaplamalar ----
  const measRight = useMemo(() => computeSide(sides.right), [sides.right]);
  const measLeft = useMemo(() => computeSide(sides.left), [sides.left]);
  const iod = useMemo(() => computeIOD(sides.right, sides.left), [sides]);

  // ---- içe aktarma ----
  const handleFiles = useCallback(async (files: FileList) => {
    const added: PendingFile[] = [];
    let coord = "";
    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        const parsed = parseSlicerFile(file.name, text);
        if (parsed.points.length === 0 && parsed.curves.length === 0) {
          toast({ title: "Boş/okunamayan dosya", description: file.name, variant: "destructive" });
          continue;
        }
        if (parsed.coordinateSystem !== "unknown") coord = parsed.coordinateSystem;
        const res = buildImportResult(parsed, sideHint);
        added.push({ name: file.name, parsed, items: res.items });
      } catch (err: any) {
        toast({ title: "Dosya okunamadı", description: `${file.name}: ${err.message}`, variant: "destructive" });
      }
    }
    if (added.length) {
      setPending((prev) => [...prev, ...added]);
      if (coord) {
        if (coordSys && coordSys !== "unknown" && coord !== "unknown" && coord !== coordSys) {
          toast({
            title: "Koordinat sistemi uyuşmazlığı",
            description: `Bu olguda ${coordSys} + ${coord} karışık — sağ/sol farklı sistemdeyse IOD hatalı çıkar. Tüm dosyaları aynı sistemde dışa aktarın.`,
            variant: "destructive",
          });
        }
        setCoordSys(coord);
      }
      const total = added.reduce((n, f) => n + f.items.length, 0);
      const auto = added.reduce((n, f) => n + f.items.filter((i) => i.auto).length, 0);
      toast({ title: "Dosya çözümlendi", description: `${total} öğe (${auto} otomatik eşleşti) — inceleyip uygulayın` });
    }
  }, [sideHint, coordSys, toast]);

  const updateItem = (fi: number, ii: number, patch: Partial<ImportMappingItem>) => {
    setPending((prev) => {
      const next = prev.map((f, i) =>
        i !== fi ? f : { ...f, items: f.items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) },
      );
      return next;
    });
  };

  const applyPending = () => {
    let acc = sides;
    for (const f of pending) acc = applyMapping(f.parsed, f.items, acc);
    setSides(acc);
    const applied = pending.reduce((n, f) => n + f.items.filter((i) => i.target).length, 0);
    setPending([]);
    toast({ title: "Uygulandı", description: `${applied} öğe sağ/sol orbitalara işlendi` });
  };

  const totalPendingItems = pending.reduce((n, f) => n + f.items.length, 0);

  const clearSide = () => {
    setSides((prev) => ({ ...prev, [side]: { landmarks: {}, rim: [], floor: [] } }));
  };

  // ---- kaydet ----
  const buildPayload = () => ({
    code: code.trim(),
    sex: sex || null,
    age: age ? parseInt(age) : null,
    modelFileName: modelName || null,
    landmarks: JSON.stringify(sides),
    measurements: JSON.stringify({ right: measRight, left: measLeft, iod, coordinateSystem: coordSys || null }),
    manualValues: JSON.stringify(manual),
    notes: notes || null,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!code.trim()) throw new Error("Olgu kodu gerekli (ör. K001)");
      const payload = buildPayload();
      if (currentId) {
        return apiRequest("PATCH", `/api/orbital-cases/${currentId}`, payload);
      }
      return apiRequest("POST", "/api/orbital-cases", payload);
    },
    onSuccess: async (res: any) => {
      const row = await res.json();
      setCurrentId(row.id);
      queryClient.invalidateQueries({ queryKey: ["/api/orbital-cases"] });
      toast({ title: "Olgu kaydedildi", description: row.code });
    },
    onError: (e: any) => toast({ title: "Kaydedilemedi", description: e.message, variant: "destructive" }),
  });

  const { data: cases } = useQuery<any[]>({ queryKey: ["/api/orbital-cases"] });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/orbital-cases/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orbital-cases"] });
      toast({ title: "Olgu silindi" });
    },
  });

  const [stats, setStats] = useState<any>(null);
  const statsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/orbital-cases/stats", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      setStats(data);
      toast({ title: "İstatistik üretildi", description: `${data.nTotal ?? 0} olgu işlendi` });
    },
    onError: (e: any) => toast({ title: "İstatistik hatası", description: e.message, variant: "destructive" }),
  });

  const loadCase = (row: any) => {
    setCurrentId(row.id);
    setCode(row.code || "");
    setSex(row.sex || "");
    setAge(row.age != null ? String(row.age) : "");
    setNotes(row.notes || "");
    try { setSides(row.landmarks ? JSON.parse(row.landmarks) : emptySides()); } catch { setSides(emptySides()); }
    try { setManual(row.manualValues ? JSON.parse(row.manualValues) : { OV: {} }); } catch { setManual({ OV: {} }); }
    toast({ title: "Olgu yüklendi", description: `${row.code} — ölçümler koordinatlardan yeniden hesaplandı` });
  };

  const newCase = () => {
    setCurrentId(null);
    setCode(""); setSex(""); setAge(""); setNotes("");
    setSides(emptySides());
    setManual({ OV: {} });
    setPending([]);
  };

  // ---- CSV export ----
  const exportCsv = () => {
    const header = ["Parametre", "Kısaltma", "Birim", "Sağ", "Sol", "Asimetri (%)", "Kaynak"];
    const rows: string[][] = [];
    for (const p of ORBITAL_PARAMS) {
      if (p.bilateral) {
        rows.push([p.label, p.abbr, p.unit, fmt(iod), "", "", "otomatik"]);
        continue;
      }
      if (p.mode === "manual") {
        const r = manual[p.abbr]?.right ?? null;
        const l = manual[p.abbr]?.left ?? null;
        const a = asymmetry(r, l).pct;
        rows.push([p.label, p.abbr, p.unit, fmt(r), fmt(l), fmt(a), "elle (Slicer)"]);
        continue;
      }
      const r = measRight[p.abbr];
      const l = measLeft[p.abbr];
      const a = asymmetry(r, l).pct;
      rows.push([p.label, p.abbr, p.unit, fmt(r), fmt(l), fmt(a), "otomatik"]);
    }
    const meta = `# Olgu: ${code || "-"}; Cinsiyet: ${sex || "-"}; Yaş: ${age || "-"}; Koordinat: ${coordSys || "-"}\n`;
    const csv = "\uFEFF" + meta +
      [header, ...rows].map((r) => r.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orbital_${code || "olgu"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  function fmt(v: number | null | undefined): string {
    const r = roundNum(v ?? null, 2);
    return r == null ? "" : String(r);
  }

  const placedCount = ORBIT_LANDMARKS.filter((d) => Array.isArray(sides[side].landmarks[d.id])).length;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="w-64 flex-shrink-0 hidden lg:block">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                <ScanEye className="w-6 h-6 text-primary" /> Orbital Morfometri Aracı
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Slicer&apos;da işaretlenmiş landmark dosyalarını (.mrk.json / .fcsv) içe aktarın — 17 parametre
                kesin koordinatlardan otomatik hesaplanır (OV hacim hariç).
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={newCase} data-testid="button-new-case">
                <Plus className="w-4 h-4 mr-1" /> Yeni Olgu
              </Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-case">
                <Save className="w-4 h-4 mr-1" /> {currentId ? "Güncelle" : "Kaydet"}
              </Button>
              <Button variant="secondary" onClick={exportCsv} data-testid="button-export-csv">
                <FileSpreadsheet className="w-4 h-4 mr-1" /> CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Sol/orta: içe aktarma + görselleştirme + ölçümler */}
            <div className="xl:col-span-2 space-y-3">
              {/* İçe aktarma */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileInput className="w-4 h-4" /> Slicer Dosyası İçe Aktar
                    {coordSys && <Badge variant="secondary">{coordSys}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-end gap-2 flex-wrap">
                    <div>
                      <Label className="text-xs">Yan (dosyadan algılanamazsa)</Label>
                      <Select value={sideHint} onValueChange={(v) => setSideHint(v as any)}>
                        <SelectTrigger className="w-36" data-testid="select-side-hint"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Otomatik (isimden)</SelectItem>
                          <SelectItem value="right">Sağ</SelectItem>
                          <SelectItem value="left">Sol</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <label>
                      <input type="file" accept=".json,.fcsv,.mrk.json" multiple className="hidden"
                        onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
                        data-testid="input-slicer" />
                      <Button asChild variant="default" size="sm">
                        <span><Upload className="w-4 h-4 mr-1" /> Dosya Seç (.mrk.json / .fcsv)</span>
                      </Button>
                    </label>
                  </div>

                  {totalPendingItems > 0 && (
                    <div className="border border-border/60 rounded-md p-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">İçe aktarma önizleme ({totalPendingItems} öğe)</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setPending([])} data-testid="button-cancel-import">İptal</Button>
                          <Button size="sm" onClick={applyPending} data-testid="button-apply-import">
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Uygula
                          </Button>
                        </div>
                      </div>
                      <ScrollArea className="max-h-[220px]">
                        <div className="space-y-2 pr-2">
                          {pending.map((f, fi) => (
                            <div key={fi}>
                              <p className="text-xs text-muted-foreground mb-1">{f.name}</p>
                              <div className="space-y-1">
                                {f.items.map((it, ii) => (
                                  <div key={ii} className="flex items-center gap-2 text-xs">
                                    {it.auto ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                      : <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                                    <span className="w-28 truncate" title={it.source}>{it.source}</span>
                                    <span className="text-muted-foreground">
                                      {it.kind === "curve" ? `eğri·${it.count}` : "nokta"}
                                    </span>
                                    <Select value={it.target || "__none__"}
                                      onValueChange={(v) => updateItem(fi, ii, { target: v === "__none__" ? "" : v })}>
                                      <SelectTrigger className="h-7 flex-1" data-testid={`map-target-${fi}-${ii}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {TARGET_OPTIONS
                                          .filter((o) => o.value === "__none__"
                                            || (it.kind === "curve" ? ORBIT_TRACES.some((t) => t.id === o.value)
                                              : ORBIT_LANDMARKS.some((d) => d.id === o.value)))
                                          .map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                    <Select value={it.side} onValueChange={(v) => updateItem(fi, ii, { side: v as Side })}>
                                      <SelectTrigger className="h-7 w-20" data-testid={`map-side-${fi}-${ii}`}><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="right">Sağ</SelectItem>
                                        <SelectItem value="left">Sol</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer">Slicer&apos;da isimlendirme rehberi (eşleşme için)</summary>
                    <div className="mt-2 space-y-1">
                      <p>Slicer&apos;da her kontrol noktasını şu <b>id</b> ile adlandırın; rim/taban için eğri (Curve)
                        markup&apos;ını adında <b>rim</b> veya <b>floor/taban</b> geçecek şekilde kaydedin. Yan için
                        isme <b>R/L</b> veya <b>sag/sol</b> ekleyin (ör. <code>ec_R</code>, <code>rim_left</code>).</p>
                      <div className="grid grid-cols-2 gap-x-4">
                        {ORBIT_LANDMARKS.map((d) => (
                          <div key={d.id}><code>{d.id}</code> — {d.label}</div>
                        ))}
                      </div>
                    </div>
                  </details>
                </CardContent>
              </Card>

              {/* 3B Görüntüleyici (opsiyonel) */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Box className="w-4 h-4" /> 3B Önizleme (opsiyonel)
                      {modelName && <Badge variant="secondary">{modelName}</Badge>}
                    </CardTitle>
                    <div className="flex gap-2">
                      <label>
                        <input type="file" accept=".stl" className="hidden"
                          onChange={(e) => e.target.files?.[0] && loadStl(e.target.files[0])}
                          data-testid="input-stl" />
                        <Button asChild variant="outline" size="sm">
                          <span><Upload className="w-4 h-4 mr-1" /> STL Yükle</span>
                        </Button>
                      </label>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const cam = cameraRef.current!, ctr = controlsRef.current!, r = radiusRef.current;
                        const t = ctr.target;
                        cam.position.set(t.x, t.y, t.z + r * 3);
                        ctr.update();
                      }} data-testid="button-reset-view">
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div ref={mountRef} className="w-full rounded-lg overflow-hidden border border-border/50"
                    style={{ height: "380px" }} data-testid="viewer-3d" />
                  <p className="text-xs text-muted-foreground mt-2">
                    Doğrulama için: aynı Slicer sahnesinden dışa aktardığınız STL&apos;i yükleyin — içe aktarılan
                    noktalar model üzerinde aynı koordinatlarda görünür. STL merkeze taşınmaz, hizalama korunur.
                    ({side === "right" ? "Sağ" : "Sol"} taraf gösteriliyor)
                  </p>
                </CardContent>
              </Card>

              {/* Ölçüm sonuçları */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Ruler className="w-4 h-4" /> Ölçümler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b border-border/50">
                          <th className="py-1.5 pr-2">Parametre</th>
                          <th className="py-1.5 px-2">Sağ</th>
                          <th className="py-1.5 px-2">Sol</th>
                          <th className="py-1.5 px-2">Asim. %</th>
                          <th className="py-1.5 pl-2">Birim</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ORBITAL_PARAMS.map((p) => {
                          if (p.bilateral) {
                            return (
                              <tr key={p.abbr} className="border-b border-border/30" data-testid={`row-param-${p.abbr}`}>
                                <td className="py-1.5 pr-2"><b>{p.abbr}</b> — {p.label}</td>
                                <td className="py-1.5 px-2" colSpan={2}>{fmt(iod) || "—"}</td>
                                <td className="py-1.5 px-2 text-muted-foreground">çift taraflı</td>
                                <td className="py-1.5 pl-2 text-muted-foreground">{p.unit}</td>
                              </tr>
                            );
                          }
                          let r: number | null, l: number | null;
                          if (p.mode === "manual") {
                            r = manual[p.abbr]?.right ?? null;
                            l = manual[p.abbr]?.left ?? null;
                          } else {
                            r = measRight[p.abbr]; l = measLeft[p.abbr];
                          }
                          const a = asymmetry(r, l).pct;
                          return (
                            <tr key={p.abbr} className="border-b border-border/30" data-testid={`row-param-${p.abbr}`}>
                              <td className="py-1.5 pr-2">
                                <b>{p.abbr}</b> — {p.label}
                                {p.mode === "manual" && <Badge variant="outline" className="ml-1 text-[10px]">elle</Badge>}
                              </td>
                              <td className="py-1.5 px-2">{fmt(r) || "—"}</td>
                              <td className="py-1.5 px-2">{fmt(l) || "—"}</td>
                              <td className="py-1.5 px-2">{fmt(a) || "—"}</td>
                              <td className="py-1.5 pl-2 text-muted-foreground">{p.unit}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    OV (hacim) Slicer &quot;Segment Statistics&quot;ten elle girilir — diğer 17 parametre içe aktarılan
                    noktalardan otomatik hesaplanır. Asimetri = |Sağ−Sol| / ortalama × 100. OFI, taban düzlemi ile
                    orbital açıklık (rim) düzlemi arası açıdır (STL yöneliminden bağımsız). MOD/mOD aynı 2B projeksiyonda.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sağ panel: olgu + durum + kayıtlılar */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Olgu Bilgisi (anonim)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Kod</Label>
                      <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="K001 / E001" data-testid="input-code" />
                    </div>
                    <div>
                      <Label className="text-xs">Cinsiyet</Label>
                      <Select value={sex} onValueChange={setSex}>
                        <SelectTrigger data-testid="select-sex"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="K">Kadın</SelectItem>
                          <SelectItem value="E">Erkek</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Yaş</Label>
                      <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="18-65" data-testid="input-age" />
                    </div>
                    <div>
                      <Label className="text-xs">OV hacim (mm³) — Sağ / Sol</Label>
                      <div className="flex gap-1">
                        <Input type="number" placeholder="Sağ" value={manual.OV?.right ?? ""}
                          onChange={(e) => setManual((m) => ({ ...m, OV: { ...m.OV, right: e.target.value ? parseFloat(e.target.value) : undefined } }))}
                          data-testid="input-ov-right" />
                        <Input type="number" placeholder="Sol" value={manual.OV?.left ?? ""}
                          onChange={(e) => setManual((m) => ({ ...m, OV: { ...m.OV, left: e.target.value ? parseFloat(e.target.value) : undefined } }))}
                          data-testid="input-ov-left" />
                      </div>
                    </div>
                  </div>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anonim teknik not — TC / isim / PII YAZMAYIN" rows={2} data-testid="input-notes" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">İçe Aktarılan Noktalar</CardTitle>
                    <div className="flex rounded-md overflow-hidden border border-border">
                      <button onClick={() => setSide("right")}
                        className={`px-3 py-1 text-sm ${side === "right" ? "bg-primary text-primary-foreground" : "bg-card"}`}
                        data-testid="button-side-right">Sağ</button>
                      <button onClick={() => setSide("left")}
                        className={`px-3 py-1 text-sm ${side === "left" ? "bg-primary text-primary-foreground" : "bg-card"}`}
                        data-testid="button-side-left">Sol</button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{placedCount}/{ORBIT_LANDMARKS.length} nokta · rim {sides[side].rim?.length || 0} · taban {sides[side].floor?.length || 0}</span>
                    <Button variant="ghost" size="sm" onClick={clearSide} data-testid="button-clear-side">
                      <Eraser className="w-3.5 h-3.5 mr-1" /> Bu tarafı temizle
                    </Button>
                  </div>

                  <ScrollArea className="h-[260px] pr-2">
                    <div className="space-y-1">
                      {ORBIT_TRACES.map((t) => {
                        const n = sides[side][t.id as "rim" | "floor"]?.length || 0;
                        return (
                          <div key={t.id} className="flex items-center gap-2 p-2 rounded-md border border-border/40 text-sm">
                            {n >= t.min ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                            <span>{t.label} <span className="text-muted-foreground">({n})</span></span>
                          </div>
                        );
                      })}
                      {ORBIT_LANDMARKS.map((d) => {
                        const placed = Array.isArray(sides[side].landmarks[d.id]);
                        return (
                          <div key={d.id} className="flex items-center gap-2 p-2 rounded-md border border-border/40 text-sm" title={d.hint}>
                            {placed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                            <span>{d.label}</span>
                            <Badge variant="outline" className="text-[10px] ml-auto">{d.group}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Kayıtlı Olgular ({cases?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[180px]">
                    <div className="space-y-1">
                      {cases?.map((c) => (
                        <div key={c.id} className="flex items-center gap-2 p-2 rounded-md border border-border/40 text-sm" data-testid={`case-${c.id}`}>
                          <button className="flex-1 text-left" onClick={() => loadCase(c)}>
                            <b>{c.code}</b> <span className="text-muted-foreground">{c.sex || "?"} · {c.age || "?"}y</span>
                          </button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                            onClick={() => deleteMutation.mutate(c.id)} data-testid={`delete-case-${c.id}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                      {(!cases || cases.length === 0) && (
                        <p className="text-xs text-muted-foreground italic p-2">Henüz kayıtlı olgu yok.</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Ruler className="w-4 h-4" /> İstatistik (cinsiyet tayini)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={() => statsMutation.mutate()}
                    disabled={statsMutation.isPending}
                    data-testid="button-run-stats"
                  >
                    {statsMutation.isPending ? "Hesaplanıyor…" : "İstatistik Üret"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Kaydedilen olgulardan gerçek, sabit seed'li (42) analiz: Welch t / Mann-Whitney +
                    BH-FDR, LDA & Random Forest çapraz doğrulama, ROC-AUC + DeLong %95 GA, sağ-sol asimetri.
                  </p>

                  {stats && (
                    <div className="space-y-2 text-xs" data-testid="stats-results">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">n={stats.nTotal ?? 0}</Badge>
                        <Badge variant="secondary">K={stats.nFemale ?? 0}</Badge>
                        <Badge variant="secondary">E={stats.nMale ?? 0}</Badge>
                        <Badge variant="outline">seed={stats.seed}</Badge>
                      </div>
                      {stats.datasetSha256 && (
                        <p className="text-[10px] text-muted-foreground font-mono break-all">
                          SHA-256: {stats.datasetSha256}
                        </p>
                      )}
                      {stats.warning && (
                        <p className="text-amber-600 dark:text-amber-400">⚠ {stats.warning}</p>
                      )}

                      {stats.models?.status === "ok" ? (
                        <div className="space-y-1">
                          <p className="font-medium">Model ({stats.models.cv}, {stats.models.nFeatures} özellik):</p>
                          {Object.entries(stats.models.results).map(([name, r]: any) => (
                            <div key={name} className="rounded-md border border-border/40 p-2" data-testid={`stats-model-${name}`}>
                              <b>{name}</b>
                              {r.error ? (
                                <span className="text-destructive"> — {r.error}</span>
                              ) : (
                                <div className="text-muted-foreground">
                                  Doğruluk {r.accuracy} · AUC {r.rocAuc} (95%GA {r.rocAuc95CI?.[0]}–{r.rocAuc95CI?.[1]}) ·
                                  Duyarlılık(E) {r.sensitivityMale} · Özgüllük(K) {r.specificityFemale}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : stats.models ? (
                        <p className="text-amber-600 dark:text-amber-400">
                          Model atlandı: {stats.models.reason}
                        </p>
                      ) : null}

                      {stats.icc?.status !== "ok" && stats.icc?.reason && (
                        <p className="text-muted-foreground">ICC: {stats.icc.reason}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground italic">
                        Tam çıktı: scripts/output/orbital_stats.json (tekrar üretilebilir).
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
