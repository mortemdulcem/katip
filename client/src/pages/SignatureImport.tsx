import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";
import {
  Upload, ScanLine, Settings2, CheckCircle2, XCircle, Loader2,
  ChevronRight, RotateCcw, Save, Eye, EyeOff, AlertCircle
} from "lucide-react";

const SHAPES = ["imza", "paraf", "W", "Ş", "İ", "O", "α"];

interface CroppedCell {
  row: number;
  col: number;
  shapeType: string;
  imageData: string;
  selected: boolean;
}

interface GridParams {
  xStart: number;
  yStart: number;
  xEnd: number;
  yEnd: number;
  cols: number;
  rows: number;
}

const DEFAULT_PARAMS_4COL: GridParams = {
  xStart: 65, yStart: 80, xEnd: 3730, yEnd: 6960, cols: 4, rows: 7,
};
const DEFAULT_PARAMS_2COL: GridParams = {
  xStart: 65, yStart: 820, xEnd: 3730, yEnd: 6960, cols: 2, rows: 7,
};

function ParamInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <Input
        type="number"
        value={value}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        className="h-8 text-sm font-mono"
        data-testid={`input-param-${label}`}
      />
    </div>
  );
}

export default function SignatureImport() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [participantCode, setParticipantCode] = useState("");
  const [step, setStep] = useState<"code" | "upload" | "preview" | "done">("code");
  const [pages, setPages] = useState<{ file: File; params: GridParams; cells: CroppedCell[]; processed: boolean }[]>([]);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [totalImported, setTotalImported] = useState(0);
  const [showGrid, setShowGrid] = useState(true);

  const { data: progress = {} } = useQuery<Record<string, number>>({
    queryKey: ['/api/signature/progress', participantCode],
    queryFn: () => fetch(`/api/signature/progress/${participantCode}`, { credentials: 'include' }).then(r => r.json()),
    enabled: !!participantCode && step !== "code",
  });

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newPages = Array.from(files).map((file, i) => ({
      file,
      // First file (page 0) might be info page with 2 cols, rest are 4 col
      params: i === 0 && files.length > 1 ? { ...DEFAULT_PARAMS_2COL } : { ...DEFAULT_PARAMS_4COL },
      cells: [],
      processed: false,
    }));
    setPages(newPages);
    setActivePageIdx(0);
    setStep("upload");
  };

  const processPage = async (idx: number) => {
    const page = pages[idx];
    if (!page) return;
    setProcessing(true);
    try {
      const fd = new FormData();
      fd.append("image", page.file);
      Object.entries(page.params).forEach(([k, v]) => fd.append(k, String(v)));

      const res = await fetch('/api/signature/crop-preview', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      const cells: CroppedCell[] = data.cells.map((c: any) => ({ ...c, selected: true }));
      setPages(prev => prev.map((p, i) => i === idx ? { ...p, cells, processed: true } : p));
      setStep("preview");
    } catch (e: any) {
      toast({ title: "Kırpma hatası", description: e.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const toggleCell = (pageIdx: number, cellIdx: number) => {
    setPages(prev => prev.map((p, pi) =>
      pi !== pageIdx ? p : {
        ...p,
        cells: p.cells.map((c, ci) => ci === cellIdx ? { ...c, selected: !c.selected } : c),
      }
    ));
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const cells = pages.flatMap(p => p.cells.filter(c => c.selected).map(c => ({
        shapeType: c.shapeType,
        imageData: c.imageData,
      })));

      const res = await fetch('/api/signature/bulk-import', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantCode, cells }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setTotalImported(data.saved);
      setStep("done");
      queryClient.invalidateQueries({ queryKey: ['/api/signature/progress', participantCode] });
      toast({ title: `${data.saved} örnek içe aktarıldı!` });
    } catch (e: any) {
      toast({ title: "İçe aktarma hatası", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const activePage = pages[activePageIdx];
  const selectedCount = pages.reduce((n, p) => n + p.cells.filter(c => c.selected).length, 0);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">

          <div className="mb-6">
            <h1 className="text-2xl font-bold font-display flex items-center gap-2">
              <ScanLine className="w-6 h-6 text-primary" />
              Taranmış Form İçe Aktarma
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Fiziksel formlardan otomatik kırpma ve veritabanına aktarma
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8 text-sm">
            {[
              { key: "code", label: "1. Katılımcı" },
              { key: "upload", label: "2. Dosya Yükle" },
              { key: "preview", label: "3. Önizleme" },
              { key: "done", label: "4. Tamamlandı" },
            ].map((s, i, arr) => (
              <div key={s.key} className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full font-medium text-xs ${
                  step === s.key ? 'bg-primary text-primary-foreground' :
                  ['code','upload','preview','done'].indexOf(step) > i ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                  'bg-muted text-muted-foreground'
                }`}>{s.label}</span>
                {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              </div>
            ))}
          </div>

          {/* Step 1: Code */}
          {step === "code" && (
            <div className="max-w-md mx-auto bg-card border border-border rounded-xl p-8">
              <h2 className="font-semibold text-lg mb-4">Katılımcı Kodu</h2>
              <Input
                placeholder="Örn: K001, E004..."
                value={participantCode}
                onChange={e => setParticipantCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && participantCode && setStep("upload")}
                data-testid="input-import-participant-code"
                className="mb-4"
              />
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 text-xs text-blue-700 dark:text-blue-300 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Katılımcı yoksa otomatik oluşturulur. Mevcut tekrar sayısının üzerine ekleme yapılır.</span>
              </div>
              {participantCode && (
                <div className="text-xs text-muted-foreground mb-4">
                  Mevcut ilerleme: {Object.values(progress).reduce((a, b) => a + b, 0)} örnek
                </div>
              )}
              <Button onClick={() => setStep("upload")} disabled={!participantCode} className="w-full" data-testid="button-code-next">
                Devam Et <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 2: Upload */}
          {step === "upload" && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Taranmış Sayfa Görüntüleri</h2>
                  <Badge variant="secondary">{participantCode}</Badge>
                </div>

                <div
                  className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileRef.current?.click()}
                  data-testid="dropzone-images"
                >
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium mb-1">PNG/JPG görüntüleri seçin</p>
                  <p className="text-sm text-muted-foreground">Birden fazla sayfa seçebilirsiniz</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => handleFiles(e.target.files)}
                    data-testid="input-file-upload"
                  />
                </div>

                {pages.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">{pages.length} dosya seçildi:</div>
                    <div className="space-y-1">
                      {pages.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-sm bg-muted rounded-lg px-3 py-2">
                          <span className="font-mono text-xs">{p.file.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">{(p.file.size / 1024 / 1024).toFixed(1)} MB</span>
                            <select
                              value={p.params.cols}
                              onChange={e => {
                                const cols = parseInt(e.target.value);
                                setPages(prev => prev.map((pg, pi) => pi !== i ? pg : {
                                  ...pg,
                                  params: { ...(cols === 2 ? DEFAULT_PARAMS_2COL : DEFAULT_PARAMS_4COL), cols },
                                }));
                              }}
                              className="text-xs border border-border rounded px-1 py-0.5 bg-background"
                              data-testid={`select-cols-page-${i}`}
                            >
                              <option value="2">2 sütun (bilgi sayfası)</option>
                              <option value="4">4 sütun (örnek sayfası)</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Settings2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Grid Parametreleri (sayfa: {activePageIdx + 1})</span>
                        <div className="flex gap-1 ml-auto">
                          {pages.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setActivePageIdx(i)}
                              className={`w-6 h-6 rounded text-xs ${activePageIdx === i ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'}`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                      {activePage && (
                        <div className="grid grid-cols-3 gap-3">
                          {(["xStart", "yStart", "xEnd", "yEnd"] as const).map(k => (
                            <ParamInput
                              key={k}
                              label={k}
                              value={activePage.params[k]}
                              onChange={v => setPages(prev => prev.map((p, i) => i !== activePageIdx ? p : { ...p, params: { ...p.params, [k]: v } }))}
                            />
                          ))}
                          <ParamInput label="cols" value={activePage.params.cols} onChange={v => setPages(prev => prev.map((p, i) => i !== activePageIdx ? p : { ...p, params: { ...p.params, cols: v } }))} />
                          <ParamInput label="rows" value={activePage.params.rows} onChange={v => setPages(prev => prev.map((p, i) => i !== activePageIdx ? p : { ...p, params: { ...p.params, rows: v } }))} />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => {
                          setActivePageIdx(0);
                          processPage(0);
                        }}
                        disabled={processing}
                        className="flex-1"
                        data-testid="button-process-images"
                      >
                        {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ScanLine className="w-4 h-4 mr-2" />}
                        {processing ? 'İşleniyor...' : 'Kırp ve Önizle'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{participantCode}</Badge>
                  <span className="text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">{selectedCount}</span> hücre seçili
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowGrid(!showGrid)}>
                    {showGrid ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    {showGrid ? 'Gizle' : 'Grid Göster'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setStep("upload"); }}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Tekrar İşle
                  </Button>
                  {pages.length > 1 && pages.some(p => !p.processed) && (
                    <Button variant="outline" size="sm" onClick={() => {
                      const nextIdx = pages.findIndex(p => !p.processed);
                      if (nextIdx >= 0) { setActivePageIdx(nextIdx); processPage(nextIdx); }
                    }} disabled={processing}>
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sonraki Sayfayı İşle <ChevronRight className="w-4 h-4" /></>}
                    </Button>
                  )}
                  <Button onClick={handleImport} disabled={importing || selectedCount === 0} data-testid="button-confirm-import">
                    {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {importing ? 'Kaydediliyor...' : `${selectedCount} Hücreyi Kaydet`}
                  </Button>
                </div>
              </div>

              {/* Page tabs */}
              {pages.length > 1 && (
                <div className="flex gap-1">
                  {pages.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePageIdx(i)}
                      className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${activePageIdx === i ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'}`}
                    >
                      Sayfa {i + 1}
                      {p.processed ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Grid preview for active page */}
              {activePage && activePage.processed && showGrid && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  {/* Header row with shape labels */}
                  <div className="grid border-b border-border bg-muted/50" style={{ gridTemplateColumns: `120px repeat(${activePage.params.cols}, 1fr)` }}>
                    <div className="p-2 text-xs font-semibold text-center">Şekil</div>
                    {Array.from({ length: activePage.params.cols }, (_, i) => (
                      <div key={i} className="p-2 text-xs text-center text-muted-foreground">Sütun {i + 1}</div>
                    ))}
                  </div>

                  {/* Rows by shape */}
                  {SHAPES.slice(0, activePage.params.rows).map((shape, row) => {
                    const rowCells = activePage.cells.filter(c => c.row === row);
                    const existingReps = progress[shape] || 0;
                    return (
                      <div
                        key={shape}
                        className="grid border-b border-border last:border-0"
                        style={{ gridTemplateColumns: `120px repeat(${activePage.params.cols}, 1fr)` }}
                      >
                        <div className="p-3 flex flex-col justify-center border-r border-border">
                          <span className="font-bold text-sm">{shape}</span>
                          <span className="text-xs text-muted-foreground">Mevcut: {existingReps}</span>
                          <span className="text-xs text-green-600 dark:text-green-400">
                            +{rowCells.filter(c => c.selected).length} eklenecek
                          </span>
                        </div>
                        {rowCells.map((cell, ci) => {
                          const cellIdx = activePage.cells.indexOf(cell);
                          return (
                            <div
                              key={ci}
                              onClick={() => toggleCell(activePageIdx, cellIdx)}
                              data-testid={`cell-${row}-${ci}`}
                              className={`p-1 cursor-pointer border-r border-border last:border-0 relative transition-all ${
                                cell.selected
                                  ? 'bg-green-50 dark:bg-green-950/30'
                                  : 'bg-red-50/50 dark:bg-red-950/20 opacity-50'
                              }`}
                            >
                              <img src={cell.imageData} alt={`${shape} col${ci}`} className="w-full h-auto" />
                              <div className="absolute top-1 right-1">
                                {cell.selected
                                  ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  : <XCircle className="w-4 h-4 text-red-400" />
                                }
                              </div>
                              <div className="text-xs text-center text-muted-foreground mt-0.5">
                                #{existingReps + ci + 1}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}

              {activePage && !activePage.processed && (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                  <p className="text-muted-foreground mb-4">Bu sayfa henüz işlenmedi</p>
                  <Button onClick={() => processPage(activePageIdx)} disabled={processing}>
                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ScanLine className="w-4 h-4 mr-2" />}
                    İşle
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Done */}
          {step === "done" && (
            <div className="max-w-md mx-auto bg-card border border-border rounded-xl p-10 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">{totalImported} örnek aktarıldı!</h2>
              <p className="text-muted-foreground mb-6">Katılımcı <span className="font-mono font-bold">{participantCode}</span> için veriler kaydedildi.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => {
                  setStep("code");
                  setPages([]);
                  setParticipantCode("");
                }}>
                  Yeni Katılımcı
                </Button>
                <Button onClick={() => {
                  setStep("upload");
                  setPages([]);
                }}>
                  Daha Fazla Sayfa
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
