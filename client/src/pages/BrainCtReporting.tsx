import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Brain,
  ChevronLeft,
  ChevronRight,
  Copy,
  Sparkles,
  Loader2,
  Filter,
  BarChart3,
  Users,
  Calendar,
  Image,
  Link2,
  Eye,
  Upload,
} from "lucide-react";

interface Patient {
  tc: string;
  name: string;
  birthDate: string;
  gender: string;
  studyDate: string;
  sampleCount: number;
  age: number;
}

interface Report {
  id?: number;
  patientTc: string;
  findings: string;
  conclusion: string;
  technique: string;
  status: string;
  ctImageData?: string;
  ctVideoData?: string;
  reportText?: string;
  reportDate?: string;
  icdCode?: string;
  sutCode?: string;
  accessionNumber?: string;
}

const TECHNIQUE_DEFAULT = "Beyin BT tetkiki kontrastsız olarak aksiyel planda gerçekleştirilmiştir.";

const NORMAL_FINDINGS = `Beyin parankiminde patolojik dansite değişikliği izlenmemiştir.
Ventriküler sistem ve sulkuslar yaşla uyumlu olup, orta hat yapıları ortadadır.
Ekstra-aksiyel mesafelerde patoloji saptanmamıştır.
Serebellopontin köşeler ve posterior fossa yapıları doğaldır.
Kemik yapılar normaldir. Paranazal sinüsler ve mastoid hücreler havalanmaktadır.`;

const NORMAL_CONCLUSION = "Akut patoloji saptanmamıştır.";

interface FindingOption {
  category: string;
  items: { label: string; text: string; conclusionText: string }[];
}

const FINDING_OPTIONS: FindingOption[] = [
  {
    category: "Vasküler",
    items: [
      { label: "İskemik inme (akut)", text: "Sağ/Sol MCA sulama alanında akut iskemik değişikliklerle uyumlu hipodens alan izlenmiştir.", conclusionText: "Akut iskemik inme ile uyumlu bulgular." },
      { label: "İskemik inme (subakut)", text: "Sağ/Sol serebral hemisferde subakut iskemik değişiklikler izlenmiştir.", conclusionText: "Subakut iskemik inme bulguları." },
      { label: "Kronik laküner infarkt", text: "Bilateral bazal ganglionlarda ve periventriküler beyaz cevherde kronik laküner infarkt alanları izlenmiştir.", conclusionText: "Kronik laküner infarkt bulguları." },
      { label: "Kronik iskemik değişiklikler", text: "Periventriküler ve subkortikal beyaz cevherde kronik iskemik gliozisle uyumlu hipodens alanlar izlenmiştir.", conclusionText: "Kronik iskemik gliotik değişiklikler." },
      { label: "İntraparankimal kanama", text: "Sağ/Sol serebral hemisferde intraparankimal hematom ile uyumlu hiperdens alan izlenmiştir.", conclusionText: "İntraparankimal hematom." },
      { label: "Subaraknoid kanama", text: "Bazal sisternlerde ve sulkuslarda subaraknoid kanama ile uyumlu hiperdensite izlenmiştir.", conclusionText: "Subaraknoid kanama bulguları. Acil nöroşirürji konsültasyonu önerilir." },
      { label: "Subdural hematom (akut)", text: "Sağ/Sol frontoparyetal bölgede akut subdural hematom ile uyumlu bikonveks hiperdens koleksiyon izlenmiştir.", conclusionText: "Akut subdural hematom. Nöroşirürji konsültasyonu önerilir." },
      { label: "Subdural hematom (kronik)", text: "Sağ/Sol frontoparyetal bölgede kronik subdural hematom ile uyumlu hipodens koleksiyon izlenmiştir.", conclusionText: "Kronik subdural hematom." },
      { label: "Epidural hematom", text: "Sağ/Sol temporal bölgede epidural hematom ile uyumlu bikonveks hiperdens koleksiyon izlenmiştir.", conclusionText: "Epidural hematom. Acil nöroşirürji konsültasyonu önerilir." },
    ],
  },
  {
    category: "Atrofi / Dejenerasyon",
    items: [
      { label: "Serebral atrofi (hafif)", text: "Sulkuslarda ve ventriküler sistemde yaşla orantısız hafif genişleme izlenmiş olup, hafif serebral atrofi ile uyumludur.", conclusionText: "Hafif serebral atrofi." },
      { label: "Serebral atrofi (belirgin)", text: "Sulkuslarda ve ventriküler sistemde belirgin genişleme izlenmiş olup, ileri serebral atrofi ile uyumludur.", conclusionText: "Belirgin diffüz serebral atrofi." },
      { label: "Serebellar atrofi", text: "Serebellar hemisfer ve vermiste atrofik değişiklikler izlenmiştir.", conclusionText: "Serebellar atrofi." },
    ],
  },
  {
    category: "Kitle / Lezyon",
    items: [
      { label: "İntrakranyal kitle (şüpheli)", text: "Sağ/Sol serebral hemisferde yer kaplayan lezyon ile uyumlu hiperdens/hipodens alan izlenmiştir. Kontrastlı MRG ile ileri değerlendirme önerilir.", conclusionText: "Yer kaplayan lezyon şüphesi. Kontrastlı kraniyal MRG önerilir." },
      { label: "Araknoid kist", text: "Sağ/Sol temporal fossada BOS dansitesinde araknoid kist ile uyumlu koleksiyon izlenmiştir.", conclusionText: "Araknoid kist." },
    ],
  },
  {
    category: "Travma",
    items: [
      { label: "Kafa kemiği fraktürü", text: "Sağ/Sol temporal/paryetal kemikte lineer fraktür hattı izlenmiştir.", conclusionText: "Kafa kemiği fraktürü. Klinik korelasyon önerilir." },
      { label: "Kontüzyon", text: "Sağ/Sol frontal/temporal lobda kontüzyon ile uyumlu hemorajik alanlar izlenmiştir.", conclusionText: "Serebral kontüzyon." },
      { label: "Pnömosefali", text: "İntrakranyal mesafede hava dansitesinde alanlar (pnömosefali) izlenmiştir.", conclusionText: "Pnömosefali. Klinik korelasyon önerilir." },
    ],
  },
  {
    category: "Hidrosefali / BOS",
    items: [
      { label: "Hidrosefali (obstrüktif)", text: "Lateral ve 3. ventrikülde belirgin dilatasyon izlenmiş olup, obstrüktif hidrosefali ile uyumludur.", conclusionText: "Obstrüktif hidrosefali bulguları." },
      { label: "Hidrosefali (NPH)", text: "Ventriküler sistemde orantısız genişleme izlenmiş olup, normal basınçlı hidrosefali ile uyumlu olabilir.", conclusionText: "Normal basınçlı hidrosefali ile uyumlu olabilecek bulgular. Klinik korelasyon önerilir." },
    ],
  },
  {
    category: "Diğer / İnsidental",
    items: [
      { label: "Sinüzit", text: "Maksiller/etmoid/frontal/sfenoid sinüslerde mukozal kalınlaşma ve/veya sıvı seviyeleri izlenmiştir.", conclusionText: "Sinüzit bulguları." },
      { label: "Mastoidit", text: "Bilateral/tek taraflı mastoid hücrelerde havalanma kaybı izlenmiştir.", conclusionText: "Mastoidit bulguları." },
      { label: "Kalsifikasyon (pineal/koroid)", text: "Pineal gland ve koroid pleksuslarda fizyolojik kalsifikasyonlar izlenmiştir.", conclusionText: "Fizyolojik kalsifikasyonlar (ek bulgu)." },
      { label: "Skalp yumuşak doku şişliği", text: "Sağ/Sol frontoparyetal bölgede skalp yumuşak dokusunda şişlik izlenmiştir.", conclusionText: "Skalp yumuşak doku şişliği." },
      { label: "Serebral ödem", text: "Diffüz serebral ödem ile uyumlu olarak sulkuslarda silinme ve gri-beyaz cevher ayrımında belirsizleşme izlenmiştir.", conclusionText: "Diffüz serebral ödem bulguları." },
    ],
  },
];

function parseCSV(csvText: string): Patient[] {
  const lines = csvText.trim().split("\n");
  const patients: Patient[] = [];
  const clean = (s: string) => s.replace(/^["=]+/g, "").replace(/["=]+$/g, "").replace(/^=""/, "").replace(/"*$/, "").trim();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    let cols = line.split(',""=""');
    if (cols.length < 6) {
      cols = line.split('","');
    }
    if (cols.length < 6) continue;
    const tc = clean(cols[0]);
    const rawName = clean(cols[1]);
    if (tc.length < 5) continue;
    const nameParts = rawName.split("^");
    const name = nameParts.length === 2 ? `${nameParts[1]} ${nameParts[0]}` : rawName;
    const bd = clean(cols[2]);
    const birthDate = bd.length === 8 ? `${bd.slice(6, 8)}.${bd.slice(4, 6)}.${bd.slice(0, 4)}` : bd;
    const gender = clean(cols[3]);
    const sd = clean(cols[4]);
    const studyDate = sd.length === 8 ? `${sd.slice(6, 8)}.${sd.slice(4, 6)}.${sd.slice(0, 4)}` : sd;
    const sampleCount = parseInt(clean(cols[5])) || 0;

    const birthYear = parseInt(bd.slice(0, 4));
    const studyYear = parseInt(sd.slice(0, 4));
    const age = studyYear - birthYear;

    patients.push({ tc, name, birthDate, gender, studyDate, sampleCount, age });
  }
  return patients;
}

function generateReportText(patient: Patient, technique: string, findings: string, conclusion: string): string {
  return `BEYIN BİLGİSAYARLI TOMOGRAFİ RAPORU
================================================
Hasta: ${patient.name}
TC Kimlik No: ${patient.tc}
Doğum Tarihi: ${patient.birthDate}
Cinsiyet: ${patient.gender === "M" ? "Erkek" : "Kadın"}
Yaş: ${patient.age}
Çalışma Tarihi: ${patient.studyDate}
Kesit Sayısı: ${patient.sampleCount}
================================================

TEKNİK:
${technique}

BULGULAR:
${findings}

SONUÇ:
${conclusion}

================================================
Raporlayan: Dr. Nurcan Denli Bayır
Tarih: ${new Date().toLocaleDateString("tr-TR")}`;
}

export default function BrainCtReporting() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [reports, setReports] = useState<Record<string, Report>>({});
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingCSV, setIsLoadingCSV] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [technique, setTechnique] = useState(TECHNIQUE_DEFAULT);
  const [findings, setFindings] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [selectedFindings, setSelectedFindings] = useState<Set<string>>(new Set());

  const PAGE_SIZE = 30;

  useEffect(() => {
    fetch("/brain_ct_patients.csv")
      .then((r) => r.text())
      .then((text) => {
        const parsed = parseCSV(text);
        setPatients(parsed);
        setIsLoadingCSV(false);
      })
      .catch(() => {
        toast({ title: "Hata", description: "CSV dosyası yüklenemedi", variant: "destructive" });
        setIsLoadingCSV(false);
      });
  }, []);

  useEffect(() => {
    fetch("/api/brain-ct-reports", { credentials: "include" })
      .then((r) => r.json())
      .then((data: any[]) => {
        const map: Record<string, Report> = {};
        data.forEach((r) => {
          map[r.patientTc] = r;
        });
        setReports(map);
      })
      .catch(() => {});
  }, []);

  const studyDates = useMemo(() => {
    const dates = new Set(patients.map((p) => p.studyDate));
    return Array.from(dates).sort();
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (!p.name.toLowerCase().includes(s) && !p.tc.includes(s)) return false;
      }
      if (filterStatus === "completed" && reports[p.tc]?.status !== "completed") return false;
      if (filterStatus === "pending" && reports[p.tc]?.status === "completed") return false;
      if (filterDate !== "all" && p.studyDate !== filterDate) return false;
      return true;
    });
  }, [patients, searchTerm, filterStatus, filterDate, reports]);

  const totalPages = Math.ceil(filteredPatients.length / PAGE_SIZE);
  const pagePatients = filteredPatients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = useMemo(() => {
    const total = patients.length;
    const completed = patients.filter((p) => reports[p.tc]?.status === "completed").length;
    const pending = total - completed;
    const maleCount = patients.filter((p) => p.gender === "M").length;
    const avgAge = patients.length > 0 ? Math.round(patients.reduce((s, p) => s + p.age, 0) / patients.length) : 0;
    const withImage = patients.filter((p) => reports[p.tc]?.ctImageData).length;
    const withReport = patients.filter((p) => reports[p.tc]?.reportText).length;
    return { total, completed, pending, maleCount, femaleCount: total - maleCount, avgAge, withImage, withReport };
  }, [patients, reports]);

  const toggleFinding = (label: string, text: string, conclusionText: string) => {
    const newSet = new Set(selectedFindings);
    if (newSet.has(label)) {
      newSet.delete(label);
      setFindings((prev) => prev.replace(text + "\n", "").replace(text, "").trim());
      setConclusion((prev) => prev.replace(conclusionText + " ", "").replace(conclusionText, "").trim());
    } else {
      newSet.add(label);
      setFindings((prev) => (prev ? prev + "\n" + text : text));
      setConclusion((prev) => (prev ? prev + " " + conclusionText : conclusionText));
    }
    setSelectedFindings(newSet);
  };

  const applyNormal = () => {
    setFindings(NORMAL_FINDINGS);
    setConclusion(NORMAL_CONCLUSION);
    setSelectedFindings(new Set());
  };

  const selectPatient = (p: Patient) => {
    setSelectedPatient(p);
    const existing = reports[p.tc];
    if (existing) {
      setFindings(existing.findings || "");
      setConclusion(existing.conclusion || "");
      setTechnique(existing.technique || TECHNIQUE_DEFAULT);
    } else {
      setFindings("");
      setConclusion("");
      setTechnique(TECHNIQUE_DEFAULT);
    }
    setSelectedFindings(new Set());
  };

  const saveReport = async (status: string) => {
    if (!selectedPatient) return;
    setIsSaving(true);
    try {
      const body = {
        patientTc: selectedPatient.tc,
        patientName: selectedPatient.name,
        birthDate: selectedPatient.birthDate,
        gender: selectedPatient.gender,
        studyDate: selectedPatient.studyDate,
        sampleCount: selectedPatient.sampleCount,
        findings,
        conclusion,
        technique,
        status,
      };
      const res = await fetch("/api/brain-ct-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Kayıt başarısız");
      const saved = await res.json();
      setReports((prev) => ({ ...prev, [selectedPatient.tc]: saved }));
      toast({ title: "Kaydedildi", description: `${selectedPatient.name} raporu ${status === "completed" ? "tamamlandı" : "taslak olarak kaydedildi"}.` });

      const idx = filteredPatients.findIndex((p) => p.tc === selectedPatient.tc);
      if (status === "completed" && idx < filteredPatients.length - 1) {
        selectPatient(filteredPatients[idx + 1]);
      }
    } catch (err: any) {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const generateAIReport = async () => {
    if (!selectedPatient) return;
    setIsGeneratingAI(true);
    try {
      const res = await fetch("/api/brain-ct-ai-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          patientName: selectedPatient.name,
          age: selectedPatient.age,
          gender: selectedPatient.gender,
          existingFindings: findings,
        }),
      });
      if (!res.ok) throw new Error("AI rapor oluşturulamadı");
      const data = await res.json();
      if (data.findings) setFindings(data.findings);
      if (data.conclusion) setConclusion(data.conclusion);
    } catch (err: any) {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const copyReport = () => {
    if (!selectedPatient) return;
    const text = generateReportText(selectedPatient, technique, findings, conclusion);
    navigator.clipboard.writeText(text);
    toast({ title: "Kopyalandı", description: "Rapor panoya kopyalandı." });
  };

  const bulkMarkNormal = async () => {
    const pending = filteredPatients.filter((p) => !reports[p.tc] || reports[p.tc]?.status !== "completed");
    if (pending.length === 0) {
      toast({ title: "Bilgi", description: "Tüm hastalar zaten raporlanmış." });
      return;
    }
    setIsBulkProcessing(true);
    setBulkProgress({ current: 0, total: pending.length });
    const newReports = { ...reports };
    let success = 0;
    for (let i = 0; i < pending.length; i++) {
      const p = pending[i];
      setBulkProgress({ current: i + 1, total: pending.length });
      try {
        const body = {
          patientTc: p.tc,
          patientName: p.name,
          birthDate: p.birthDate,
          gender: p.gender,
          studyDate: p.studyDate,
          sampleCount: p.sampleCount,
          findings: NORMAL_FINDINGS,
          conclusion: NORMAL_CONCLUSION,
          technique: TECHNIQUE_DEFAULT,
          status: "completed",
        };
        const res = await fetch("/api/brain-ct-reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const saved = await res.json();
          newReports[p.tc] = saved;
          success++;
        }
      } catch {}
    }
    setReports(newReports);
    setIsBulkProcessing(false);
    toast({
      title: "Toplu Raporlama Tamamlandı",
      description: `${success}/${pending.length} hasta "Normal" olarak raporlandı.`,
    });
  };

  const copyPatientReport = (p: Patient, index: number) => {
    const r = reports[p.tc];
    const text = generateReportText(
      p,
      r?.technique || TECHNIQUE_DEFAULT,
      r?.findings || NORMAL_FINDINGS,
      r?.conclusion || NORMAL_CONCLUSION
    );
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copySarusFormat = (p: Patient) => {
    const r = reports[p.tc];
    const f = r?.findings || NORMAL_FINDINGS;
    const c = r?.conclusion || NORMAL_CONCLUSION;
    const t = r?.technique || TECHNIQUE_DEFAULT;
    const text = `${t}\n\nBULGULAR:\n${f}\n\nSONUÇ:\n${c}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Kopyalandı", description: `${p.name} — SARUSPLUS formatında kopyalandı.` });
  };

  const exportAllReports = () => {
    const completedPatients = patients.filter((p) => reports[p.tc]?.status === "completed");
    if (completedPatients.length === 0) {
      toast({ title: "Uyarı", description: "Henüz tamamlanmış rapor yok.", variant: "destructive" });
      return;
    }
    let allText = `BEYIN BT RAPORLARI — TOPLU DIŞA AKTARIM\nTarih: ${new Date().toLocaleDateString("tr-TR")}\nToplam: ${completedPatients.length} rapor\n${"=".repeat(60)}\n\n`;
    completedPatients.forEach((p, i) => {
      const r = reports[p.tc];
      allText += `--- Rapor ${i + 1}/${completedPatients.length} ---\n`;
      allText += generateReportText(p, r.technique || TECHNIQUE_DEFAULT, r.findings || "", r.conclusion || "");
      allText += "\n\n";
    });
    const blob = new Blob([allText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `beyin_bt_raporlari_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoadingCSV) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-[calc(100vh-48px)]">
        <div className="w-[380px] border-r flex flex-col shrink-0">
          <div className="p-3 border-b space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-red-600" />
              <h1 className="font-bold text-sm" data-testid="text-page-title">Beyin BT Raporlama</h1>
              <Badge variant="secondary" className="text-xs ml-auto">
                {stats.completed}/{stats.total}
              </Badge>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <div className="bg-muted/50 rounded p-1.5 text-center">
                <div className="text-base font-bold" data-testid="text-stat-total">{stats.total}</div>
                <div className="text-[9px] text-muted-foreground">Toplam</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 rounded p-1.5 text-center">
                <div className="text-base font-bold text-green-600" data-testid="text-stat-completed">{stats.completed}</div>
                <div className="text-[9px] text-muted-foreground">Rapor</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950/30 rounded p-1.5 text-center">
                <div className="text-base font-bold text-orange-600" data-testid="text-stat-pending">{stats.pending}</div>
                <div className="text-[9px] text-muted-foreground">Bekleyen</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-1.5 text-center">
                <div className="text-base font-bold text-blue-600">{stats.avgAge}</div>
                <div className="text-[9px] text-muted-foreground">Ort. Yaş</div>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="İsim veya TC ara..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-7 h-8 text-xs"
                data-testid="input-search"
              />
            </div>

            <div className="flex gap-1.5">
              <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-7 text-xs flex-1" data-testid="select-filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="completed">Raporlanan</SelectItem>
                  <SelectItem value="pending">Bekleyen</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterDate} onValueChange={(v) => { setFilterDate(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-7 text-xs flex-1" data-testid="select-filter-date">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Tarihler</SelectItem>
                  {studyDates.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground">{filteredPatients.length} hasta</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span className="text-[10px] text-muted-foreground">{currentPage}/{totalPages || 1}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {pagePatients.map((p, idx) => {
              const r = reports[p.tc];
              const isSelected = selectedPatient?.tc === p.tc;
              const statusIcon = r?.status === "completed"
                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                : r?.status === "draft"
                ? <Clock className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                : <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />;

              return (
                <div
                  key={`${p.tc}-${p.studyDate}-${idx}`}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-border/30 hover:bg-accent/50 transition-colors ${isSelected ? "bg-accent" : ""}`}
                  onClick={() => selectPatient(p)}
                  data-testid={`row-patient-${idx}`}
                >
                  {statusIcon}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate flex items-center gap-1">
                      {p.name}
                      {r?.ctVideoData && <Eye className="h-2.5 w-2.5 text-red-500" title="Video var" />}
                      {r?.ctImageData && <Image className="h-2.5 w-2.5 text-blue-500" title="Görüntü var" />}
                      {r?.reportText && <Link2 className="h-2.5 w-2.5 text-purple-500" title="Rapor var" />}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {p.gender === "M" ? "E" : "K"} · {p.age}y · {p.studyDate} · {p.sampleCount} kesit
                    </div>
                  </div>
                  {reports[p.tc]?.status === "completed" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={(e) => { e.stopPropagation(); copySarusFormat(p); }}
                      title="SARUSPLUS formatında kopyala"
                      data-testid={`button-copy-${idx}`}
                    >
                      {copiedIndex === idx ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-2 border-t space-y-1.5">
            {isBulkProcessing ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Toplu raporlama: {bulkProgress.current}/{bulkProgress.total}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${bulkProgress.total > 0 ? (bulkProgress.current / bulkProgress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="w-full text-xs gap-1 bg-green-600 hover:bg-green-700"
                onClick={bulkMarkNormal}
                data-testid="button-bulk-normal"
              >
                <CheckCircle2 className="h-3 w-3" /> Tümünü Normal Raporla ({stats.pending})
              </Button>
            )}
            <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={exportAllReports} data-testid="button-export-all">
              <Download className="h-3 w-3" /> Tamamlanan Raporları Dışa Aktar
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!selectedPatient ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 px-6">
              <Brain className="h-16 w-16 opacity-20" />
              <p className="text-sm font-medium">Beyin BT Raporlama — {stats.total} Hasta</p>
              <p className="text-xs text-center max-w-md">
                {stats.pending > 0
                  ? `${stats.pending} hasta rapor bekliyor. "Tümünü Normal Raporla" ile hızlıca tamamlayın, sonra patolojik olanları düzenleyin.`
                  : `Tüm ${stats.completed} rapor tamamlandı. Her hastanın yanındaki kopyala butonuyla SARUSPLUS'a yapıştırabilirsiniz.`
                }
              </p>
              {stats.pending > 0 && (
                <Button
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  onClick={bulkMarkNormal}
                  disabled={isBulkProcessing}
                  data-testid="button-bulk-normal-center"
                >
                  {isBulkProcessing
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> {bulkProgress.current}/{bulkProgress.total}</>
                    : <><CheckCircle2 className="h-4 w-4" /> Tümünü Normal Raporla ({stats.pending} hasta)</>
                  }
                </Button>
              )}
              {stats.completed > 0 && (
                <div className="text-xs text-center space-y-1">
                  <p className="font-medium text-foreground">SARUSPLUS iş akışı:</p>
                  <p>1. Sol listeden hastanın yanındaki kopyala ikonuna tıklayın</p>
                  <p>2. SARUSPLUS'ta hastayı açın → rapor alanına yapıştırın</p>
                  <p>3. Patolojik olanları sol listeden seçip düzenleyin</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-4 max-w-4xl">
              <Card className="border-red-900/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-600" />
                      {selectedPatient.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {reports[selectedPatient.tc]?.status === "completed" && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">Tamamlandı</Badge>
                      )}
                      {reports[selectedPatient.tc]?.status === "draft" && (
                        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 text-xs">Taslak</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                    <div className="bg-muted/50 rounded p-2">
                      <span className="text-muted-foreground">TC:</span>
                      <div className="font-mono font-medium">{selectedPatient.tc}</div>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <span className="text-muted-foreground">Doğum:</span>
                      <div className="font-medium">{selectedPatient.birthDate}</div>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <span className="text-muted-foreground">Yaş/Cin:</span>
                      <div className="font-medium">{selectedPatient.age} / {selectedPatient.gender === "M" ? "Erkek" : "Kadın"}</div>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <span className="text-muted-foreground">Tarih:</span>
                      <div className="font-medium">{selectedPatient.studyDate}</div>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <span className="text-muted-foreground">Kesit:</span>
                      <div className="font-medium">{selectedPatient.sampleCount}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {(reports[selectedPatient.tc]?.ctImageData || reports[selectedPatient.tc]?.ctVideoData || reports[selectedPatient.tc]?.reportText) && (
                <Card className="border-blue-900/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Image className="h-4 w-4 text-blue-600" />
                      PACS Verileri
                      {reports[selectedPatient.tc]?.icdCode && (
                        <Badge variant="outline" className="text-[10px] ml-auto">{reports[selectedPatient.tc].icdCode}</Badge>
                      )}
                      {reports[selectedPatient.tc]?.sutCode && (
                        <Badge variant="outline" className="text-[10px]">{reports[selectedPatient.tc].sutCode}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {reports[selectedPatient.tc]?.ctImageData && (
                      <div>
                        <div className="text-xs font-medium mb-1 flex items-center gap-1">
                          <Eye className="h-3 w-3" /> BT Görüntüsü
                        </div>
                        <div className="bg-black rounded-lg overflow-hidden">
                          <img
                            src={reports[selectedPatient.tc].ctImageData}
                            alt={`BT - ${selectedPatient.name}`}
                            className="w-full max-h-[400px] object-contain"
                            data-testid="img-ct-scan"
                          />
                        </div>
                      </div>
                    )}
                    {reports[selectedPatient.tc]?.ctVideoData && (
                      <div>
                        <div className="text-xs font-medium mb-1 flex items-center gap-1">
                          <Eye className="h-3 w-3" /> BT Video Kaydı
                        </div>
                        <div className="bg-black rounded-lg overflow-hidden">
                          <video
                            src={reports[selectedPatient.tc].ctVideoData}
                            controls
                            loop
                            className="w-full max-h-[400px]"
                            data-testid="video-ct-scan"
                          />
                        </div>
                      </div>
                    )}
                    {reports[selectedPatient.tc]?.reportText && (
                      <div>
                        <div className="text-xs font-medium mb-1 flex items-center gap-1">
                          <Link2 className="h-3 w-3" /> Teleradyoloji Raporu
                          {reports[selectedPatient.tc]?.reportDate && (
                            <span className="text-muted-foreground font-normal ml-1">({reports[selectedPatient.tc].reportDate})</span>
                          )}
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 text-xs whitespace-pre-wrap max-h-[300px] overflow-y-auto font-mono">
                          {reports[selectedPatient.tc].reportText}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Teknik</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={technique}
                    onChange={(e) => setTechnique(e.target.value)}
                    className="min-h-[40px] text-sm"
                    data-testid="textarea-technique"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Bulgular</CardTitle>
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={applyNormal} data-testid="button-normal">
                        <CheckCircle2 className="h-3 w-3 text-green-500" /> Normal
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 gap-1"
                        onClick={generateAIReport}
                        disabled={isGeneratingAI}
                        data-testid="button-ai-report"
                      >
                        {isGeneratingAI ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-purple-500" />}
                        AI Rapor
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {FINDING_OPTIONS.map((cat) => (
                      <div key={cat.category}>
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{cat.category}</div>
                        <div className="flex flex-wrap gap-1">
                          {cat.items.map((item) => (
                            <Button
                              key={item.label}
                              variant={selectedFindings.has(item.label) ? "default" : "outline"}
                              size="sm"
                              className={`text-[10px] h-6 px-2 ${selectedFindings.has(item.label) ? "bg-red-700 hover:bg-red-800" : ""}`}
                              onClick={() => toggleFinding(item.label, item.text, item.conclusionText)}
                              data-testid={`button-finding-${item.label.replace(/\s/g, "-")}`}
                            >
                              {item.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Textarea
                    value={findings}
                    onChange={(e) => setFindings(e.target.value)}
                    placeholder="Bulgularınızı yazın veya yukarıdaki şablonlardan seçin..."
                    className="min-h-[120px] text-sm"
                    data-testid="textarea-findings"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Sonuç</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    placeholder="Sonuç..."
                    className="min-h-[60px] text-sm"
                    data-testid="textarea-conclusion"
                  />
                </CardContent>
              </Card>

              <div className="flex items-center gap-2 pb-6">
                <Button
                  onClick={() => saveReport("draft")}
                  variant="outline"
                  disabled={isSaving}
                  className="gap-1"
                  data-testid="button-save-draft"
                >
                  <Clock className="h-4 w-4" /> Taslak Kaydet
                </Button>
                <Button
                  onClick={() => saveReport("completed")}
                  disabled={isSaving || !findings.trim()}
                  className="gap-1 bg-green-600 hover:bg-green-700"
                  data-testid="button-save-complete"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Tamamla & Sonraki
                </Button>
                <Button variant="ghost" size="sm" className="gap-1 ml-auto" onClick={copyReport} data-testid="button-copy-report">
                  <Copy className="h-4 w-4" /> Kopyala
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
