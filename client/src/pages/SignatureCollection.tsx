import { useRef, useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";
import { Trash2, RotateCcw, Save, ChevronRight, CheckCircle2, User, PenLine, Gauge } from "lucide-react";

const SHAPES = [
  { id: "imza", label: "İmza", desc: "Kendi imzanızı atın" },
  { id: "paraf", label: "Paraf", desc: "Kendi parafınızı atın" },
  { id: "W", label: "W", desc: "W harfini yazın" },
  { id: "Ş", label: "Ş", desc: "Ş harfini yazın" },
  { id: "İ", label: "İ", desc: "İ harfini yazın" },
  { id: "O", label: "O", desc: "O harfini yazın" },
  { id: "α", label: "α (alfa)", desc: "Alfa sembolünü çizin" },
];
const TOTAL_REPS = 50;
const CANVAS_SIZE = 512;
const MIN_LINE_WIDTH = 1;
const MAX_LINE_WIDTH = 8;
const DEFAULT_LINE_WIDTH = 3;

interface PressurePoint {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export default function SignatureCollection() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const pressureData = useRef<PressurePoint[][]>([]);
  const currentStroke = useRef<PressurePoint[]>([]);
  const lastPressure = useRef(0.5);

  const [participantCode, setParticipantCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [activeShape, setActiveShape] = useState(SHAPES[0].id);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPressure, setCurrentPressure] = useState(0);
  const [avgPressure, setAvgPressure] = useState(0);
  const [maxPressureVal, setMaxPressureVal] = useState(0);
  const [hasPressureSupport, setHasPressureSupport] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);

  const { data: participant } = useQuery<any>({
    queryKey: ['/api/signature/participants', participantCode],
    queryFn: () => fetch(`/api/signature/participants/${participantCode}`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
    enabled: !!participantCode,
  });

  const { data: progress = {} } = useQuery<Record<string, number>>({
    queryKey: ['/api/signature/progress', participantCode],
    queryFn: () => fetch(`/api/signature/progress/${participantCode}`, { credentials: 'include' }).then(r => r.json()),
    enabled: !!participantCode,
    refetchInterval: 3000,
  });

  const createParticipant = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/signature/participants', data),
    onSuccess: () => {
      setParticipantCode(inputCode.toUpperCase());
      queryClient.invalidateQueries({ queryKey: ['/api/signature/participants'] });
      toast({ title: "Katılımcı kaydedildi", description: `Kod: ${inputCode.toUpperCase()}` });
    },
    onError: (e: any) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const currentRep = (progress[activeShape] || 0) + 1;
  const shapeComplete = (progress[activeShape] || 0) >= TOTAL_REPS;

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = DEFAULT_LINE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setHasDrawing(false);
    setCurrentPressure(0);
    setAvgPressure(0);
    setMaxPressureVal(0);
    setStrokeCount(0);
    pressureData.current = [];
    currentStroke.current = [];
    lastPressure.current = 0.5;
  }, []);

  useEffect(() => { initCanvas(); }, [initCanvas, activeShape]);

  const getPressureStats = useCallback(() => {
    const allPoints = pressureData.current.flat();
    if (allPoints.length === 0) return { avg: 0, max: 0, min: 0 };
    const pressures = allPoints.map(p => p.pressure);
    return {
      avg: pressures.reduce((a, b) => a + b, 0) / pressures.length,
      max: Math.max(...pressures),
      min: Math.min(...pressures),
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_SIZE / rect.width;
      const scaleY = CANVAS_SIZE / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const pressureToWidth = (pressure: number): number => {
      if (pressure === 0 || pressure === 0.5) return DEFAULT_LINE_WIDTH;
      return MIN_LINE_WIDTH + pressure * (MAX_LINE_WIDTH - MIN_LINE_WIDTH);
    };

    const start = (e: PointerEvent) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      isDrawing.current = true;
      const pos = getPos(e);
      const pressure = e.pressure > 0 && e.pressure !== 0.5 ? e.pressure : 0.5;
      if (e.pressure > 0 && e.pressure !== 0.5) {
        setHasPressureSupport(true);
      }
      lastPressure.current = pressure;
      ctx.lineWidth = pressureToWidth(pressure);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      currentStroke.current = [{ x: pos.x, y: pos.y, pressure, timestamp: Date.now() }];
      setCurrentPressure(Math.round(pressure * 100));
      setHasDrawing(true);
    };

    const move = (e: PointerEvent) => {
      e.preventDefault();
      if (!isDrawing.current) return;
      const pos = getPos(e);
      const rawPressure = e.pressure > 0 ? e.pressure : lastPressure.current;
      const pressure = lastPressure.current * 0.6 + rawPressure * 0.4;
      lastPressure.current = pressure;

      if (rawPressure > 0 && rawPressure !== 0.5) {
        setHasPressureSupport(true);
      }

      ctx.lineWidth = pressureToWidth(pressure);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);

      currentStroke.current.push({ x: pos.x, y: pos.y, pressure, timestamp: Date.now() });
      setCurrentPressure(Math.round(pressure * 100));
    };

    const end = (e: PointerEvent) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      canvas.releasePointerCapture(e.pointerId);

      if (currentStroke.current.length > 0) {
        pressureData.current.push([...currentStroke.current]);
        setStrokeCount(pressureData.current.length);
        const stats = getPressureStats();
        setAvgPressure(Math.round(stats.avg * 100));
        setMaxPressureVal(Math.round(stats.max * 100));
      }
      currentStroke.current = [];
    };

    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointerleave', end);
    canvas.addEventListener('pointercancel', end);

    return () => {
      canvas.removeEventListener('pointerdown', start);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', end);
      canvas.removeEventListener('pointerleave', end);
      canvas.removeEventListener('pointercancel', end);
    };
  }, [getPressureStats]);

  const handleSave = async () => {
    if (!hasDrawing || !participantCode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    try {
      const imageData = canvas.toDataURL('image/png');
      const stats = getPressureStats();
      const pressureMetadata = {
        hasPressureSupport,
        strokeCount: pressureData.current.length,
        totalPoints: pressureData.current.flat().length,
        avgPressure: Math.round(stats.avg * 1000) / 1000,
        maxPressure: Math.round(stats.max * 1000) / 1000,
        minPressure: Math.round(stats.min * 1000) / 1000,
        strokes: pressureData.current.map(stroke => ({
          points: stroke.length,
          avgPressure: Math.round((stroke.reduce((a, p) => a + p.pressure, 0) / stroke.length) * 1000) / 1000,
          maxPressure: Math.round(Math.max(...stroke.map(p => p.pressure)) * 1000) / 1000,
          duration: stroke.length > 1 ? stroke[stroke.length - 1].timestamp - stroke[0].timestamp : 0,
        })),
      };
      await apiRequest('POST', '/api/signature/samples', {
        participantCode,
        shapeType: activeShape,
        repetitionNumber: currentRep,
        imageData,
        pressureData: JSON.stringify(pressureMetadata),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/signature/progress', participantCode] });
      initCanvas();
      if (currentRep >= TOTAL_REPS) {
        toast({ title: "Şekil tamamlandı!", description: `${activeShape} için 50 tekrar tamamlandı.` });
        const nextShape = SHAPES.find(s => (progress[s.id] || 0) < TOTAL_REPS && s.id !== activeShape);
        if (nextShape) setActiveShape(nextShape.id);
      } else {
        toast({ title: `Kaydedildi — Tekrar ${currentRep}/${TOTAL_REPS}` });
      }
    } catch {
      toast({ title: "Kaydetme hatası", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const totalDone = Object.values(progress).reduce((a, b) => a + b, 0);
  const totalNeeded = SHAPES.length * TOTAL_REPS;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold font-display flex items-center gap-2">
              <PenLine className="w-6 h-6 text-primary" />
              İmza & Şekil Veri Toplama
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Adli grafoloji araştırması — Her şekil 50 tekrar, 512×512 piksel
            </p>
          </div>

          {!participantCode ? (
            <div className="bg-card border border-border rounded-xl p-8 max-w-md mx-auto mt-16">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">Katılımcı Kodu Girin</h2>
              </div>
              <div className="space-y-3">
                <Input
                  placeholder="Örn: K001, E002..."
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && inputCode && setParticipantCode(inputCode)}
                  data-testid="input-participant-code"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => inputCode && setParticipantCode(inputCode)}
                    disabled={!inputCode}
                    data-testid="button-existing-participant"
                  >
                    Mevcut Katılımcı
                  </Button>
                  <Button
                    onClick={() => {
                      if (!inputCode) return;
                      createParticipant.mutate({ code: inputCode.toUpperCase() });
                    }}
                    disabled={!inputCode || createParticipant.isPending}
                    data-testid="button-new-participant"
                  >
                    Yeni Kayıt
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-3">
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold">Katılımcı</span>
                    <Button variant="ghost" size="sm" onClick={() => { setParticipantCode(""); setInputCode(""); }}>
                      Değiştir
                    </Button>
                  </div>
                  <Badge variant="secondary" className="text-base font-mono">{participantCode}</Badge>
                  <div className="mt-3">
                    <div className="text-xs text-muted-foreground mb-1">Genel İlerleme</div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${Math.min(100, (totalDone / totalNeeded) * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-right mt-1">{totalDone} / {totalNeeded}</div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="text-sm font-semibold mb-3">Şekiller</div>
                  <div className="space-y-1">
                    {SHAPES.map(shape => {
                      const done = progress[shape.id] || 0;
                      const complete = done >= TOTAL_REPS;
                      return (
                        <button
                          key={shape.id}
                          onClick={() => { setActiveShape(shape.id); initCanvas(); }}
                          data-testid={`button-shape-${shape.id}`}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                            activeShape === shape.id
                              ? 'bg-primary text-primary-foreground'
                              : complete
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                              : 'hover:bg-accent'
                          }`}
                        >
                          <span className="font-medium">{shape.label}</span>
                          <span className="flex items-center gap-1">
                            {complete ? <CheckCircle2 className="w-4 h-4" /> : `${done}/${TOTAL_REPS}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-semibold text-lg">
                        {SHAPES.find(s => s.id === activeShape)?.label}
                        <span className="text-muted-foreground text-sm font-normal ml-2">
                          — {SHAPES.find(s => s.id === activeShape)?.desc}
                        </span>
                      </h2>
                      {!shapeComplete && (
                        <p className="text-sm text-muted-foreground">
                          Tekrar <span className="font-bold text-primary">{currentRep}</span> / {TOTAL_REPS}
                        </p>
                      )}
                    </div>
                    {shapeComplete && (
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Tamamlandı
                      </Badge>
                    )}
                  </div>

                  {shapeComplete ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                      <p className="text-lg font-semibold">Bu şekil tamamlandı!</p>
                      <p className="text-muted-foreground mb-6">Lütfen başka bir şekil seçin</p>
                      {SHAPES.filter(s => (progress[s.id] || 0) < TOTAL_REPS).length > 0 && (
                        <Button onClick={() => {
                          const next = SHAPES.find(s => (progress[s.id] || 0) < TOTAL_REPS);
                          if (next) { setActiveShape(next.id); initCanvas(); }
                        }}>
                          Sonraki Şekle Geç <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center mb-4">
                        <canvas
                          ref={canvasRef}
                          width={CANVAS_SIZE}
                          height={CANVAS_SIZE}
                          data-testid="canvas-drawing"
                          className="border-2 border-border rounded-lg cursor-crosshair"
                          style={{ width: '100%', maxWidth: 480, height: 'auto', touchAction: 'none' }}
                        />
                      </div>

                      {hasDrawing && (
                        <div className="mb-4 bg-muted/40 border border-border rounded-lg p-3 max-w-[480px] mx-auto" data-testid="pressure-panel">
                          <div className="flex items-center gap-2 mb-2">
                            <Gauge className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold">Basınç Verisi</span>
                            {hasPressureSupport ? (
                              <Badge variant="default" className="text-xs bg-green-600">Basınç Algılanıyor</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Fare Modu (sabit basınç)</Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="bg-background rounded-md p-2">
                              <div className="text-lg font-bold text-primary" data-testid="text-current-pressure">{currentPressure}%</div>
                              <div className="text-[10px] text-muted-foreground">Anlık</div>
                            </div>
                            <div className="bg-background rounded-md p-2">
                              <div className="text-lg font-bold text-blue-600 dark:text-blue-400" data-testid="text-avg-pressure">{avgPressure}%</div>
                              <div className="text-[10px] text-muted-foreground">Ortalama</div>
                            </div>
                            <div className="bg-background rounded-md p-2">
                              <div className="text-lg font-bold text-orange-600 dark:text-orange-400" data-testid="text-max-pressure">{maxPressureVal}%</div>
                              <div className="text-[10px] text-muted-foreground">Maksimum</div>
                            </div>
                            <div className="bg-background rounded-md p-2">
                              <div className="text-lg font-bold text-muted-foreground" data-testid="text-stroke-count">{strokeCount}</div>
                              <div className="text-[10px] text-muted-foreground">Çizgi</div>
                            </div>
                          </div>

                          <div className="mt-2">
                            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                              <span>Hafif</span>
                              <span>Basınç Göstergesi</span>
                              <span>Kuvvetli</span>
                            </div>
                            <div className="w-full h-3 bg-gradient-to-r from-blue-200 via-blue-400 to-red-500 rounded-full relative">
                              <div
                                className="absolute top-[-2px] w-4 h-4 bg-white border-2 border-primary rounded-full shadow transition-all"
                                style={{ left: `calc(${Math.min(currentPressure, 100)}% - 8px)` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 justify-center">
                        <Button
                          variant="outline"
                          onClick={initCanvas}
                          data-testid="button-clear-canvas"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Temizle
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={!hasDrawing || saving}
                          data-testid="button-save-sample"
                          className="px-8"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                      </div>
                      <p className="text-center text-xs text-muted-foreground mt-3">
                        Çizimi tamamlayın, ardından "Kaydet" butonuna basın.
                        {hasPressureSupport
                          ? ' Kalem basıncı algılandı — çizgi kalınlığı basınca göre değişir.'
                          : ' Basınç desteği için dokunmatik kalem (stylus) kullanın.'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
