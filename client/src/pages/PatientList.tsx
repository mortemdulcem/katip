import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Users,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Calendar,
  User as UserIcon,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

interface Patient {
  tc: string;
  ad: string;
  soyad: string;
  dogumTarihi: string;
  cinsiyet: string;
  calismaTarihi: string;
  ornekSayisi: string;
  yas: number;
}

function parseCSVRow(raw: string): string {
  return raw.replace(/^"=""/, "").replace(/""?"$/, "").trim();
}

function formatDate(raw: string): string {
  if (raw.length === 8) {
    return `${raw.slice(6, 8)}.${raw.slice(4, 6)}.${raw.slice(0, 4)}`;
  }
  return raw;
}

function calculateAge(birthDate: string): number {
  if (birthDate.length !== 8) return 0;
  const year = parseInt(birthDate.slice(0, 4));
  const month = parseInt(birthDate.slice(4, 6));
  const day = parseInt(birthDate.slice(6, 8));
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
    age--;
  }
  return age;
}

export default function PatientList() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortField, setSortField] = useState<string>("sira");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const perPage = 50;

  useEffect(() => {
    fetch("/brain_ct_patients.csv")
      .then((r) => r.text())
      .then((text) => {
        const lines = text.trim().split("\n");
        const parsed: Patient[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const cols = line.split(',""=""');
          if (cols.length < 6) {
            const altCols = line.split('","');
            if (altCols.length >= 6) {
              cols.length = 0;
              altCols.forEach(c => cols.push(c));
            }
          }
          if (cols.length < 6) continue;

          const clean = (s: string) => s.replace(/^["=]+/g, "").replace(/["=]+$/g, "").replace(/^=""/, "").replace(/"*$/, "").trim();

          const tc = clean(cols[0]);
          const fullName = clean(cols[1]);
          const parts = fullName.split("^");
          const soyad = parts[0] || "";
          const ad = parts.slice(1).join(" ") || "";
          const dogum = clean(cols[2]);
          const cinsiyet = clean(cols[3]);
          const calisma = clean(cols[4]);
          const ornek = clean(cols[5]);

          if (tc.length < 5) continue;

          parsed.push({
            tc,
            ad,
            soyad,
            dogumTarihi: dogum,
            cinsiyet: cinsiyet === "F" ? "Kadın" : cinsiyet === "M" ? "Erkek" : cinsiyet,
            calismaTarihi: calisma,
            ornekSayisi: ornek,
            yas: calculateAge(dogum),
          });
        }
        setPatients(parsed);
      });
  }, []);

  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    patients.forEach((p) => dates.add(p.calismaTarihi));
    return Array.from(dates).sort();
  }, [patients]);

  const filtered = useMemo(() => {
    let list = [...patients];

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.ad.toLowerCase().includes(s) ||
          p.soyad.toLowerCase().includes(s) ||
          p.tc.includes(s) ||
          `${p.ad} ${p.soyad}`.toLowerCase().includes(s) ||
          `${p.soyad} ${p.ad}`.toLowerCase().includes(s)
      );
    }

    if (genderFilter !== "all") {
      list = list.filter((p) => p.cinsiyet === genderFilter);
    }

    if (dateFilter !== "all") {
      list = list.filter((p) => p.calismaTarihi === dateFilter);
    }

    if (sortField !== "sira") {
      list.sort((a, b) => {
        let va: any, vb: any;
        switch (sortField) {
          case "ad": va = a.ad + " " + a.soyad; vb = b.ad + " " + b.soyad; break;
          case "soyad": va = a.soyad; vb = b.soyad; break;
          case "tc": va = a.tc; vb = b.tc; break;
          case "yas": va = a.yas; vb = b.yas; break;
          case "tarih": va = a.calismaTarihi; vb = b.calismaTarihi; break;
          case "ornek": va = parseInt(a.ornekSayisi) || 0; vb = parseInt(b.ornekSayisi) || 0; break;
          default: va = 0; vb = 0;
        }
        if (typeof va === "string") {
          return sortDir === "asc" ? va.localeCompare(vb, "tr") : vb.localeCompare(va, "tr");
        }
        return sortDir === "asc" ? va - vb : vb - va;
      });
    }

    return list;
  }, [patients, search, genderFilter, dateFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [search, genderFilter, dateFilter]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const stats = useMemo(() => {
    const erkek = patients.filter((p) => p.cinsiyet === "Erkek").length;
    const kadin = patients.filter((p) => p.cinsiyet === "Kadın").length;
    const ages = patients.map((p) => p.yas).filter((a) => a > 0);
    const avgAge = ages.length > 0 ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : "0";
    return { total: patients.length, erkek, kadin, avgAge };
  }, [patients]);

  const downloadCSV = () => {
    let csv = "Sıra,TC Kimlik No,Ad,Soyad,Yaş,Cinsiyet,Doğum Tarihi,Çalışma Tarihi,Örnek Sayısı\n";
    filtered.forEach((p, i) => {
      csv += `${i + 1},"${p.tc}","${p.ad}","${p.soyad}",${p.yas},"${p.cinsiyet}","${formatDate(p.dogumTarihi)}","${formatDate(p.calismaTarihi)}","${p.ornekSayisi}"\n`;
    });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `hasta_listesi_${filtered.length}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th
      className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
      onClick={() => toggleSort(field)}
      data-testid={`sort-${field}`}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? "text-primary" : "opacity-30"}`} />
      </div>
    </th>
  );

  return (
    <div className="flex h-screen bg-background" data-testid="patient-list-page">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1400px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Hasta Listesi</h1>
              <p className="text-sm text-muted-foreground">Nisan 2026 — Beyin BT Hastaları</p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadCSV} data-testid="button-download-csv">
              <Download className="w-4 h-4 mr-2" />
              CSV İndir
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-total-count">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Toplam Hasta</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10">
                  <UserIcon className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-male-count">{stats.erkek}</p>
                  <p className="text-xs text-muted-foreground">Erkek</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10">
                  <UserIcon className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-female-count">{stats.kadin}</p>
                  <p className="text-xs text-muted-foreground">Kadın</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Calendar className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-avg-age">{stats.avgAge}</p>
                  <p className="text-xs text-muted-foreground">Ort. Yaş</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Hasta adı, soyadı veya TC ile ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-gender">
                    <SelectValue placeholder="Cinsiyet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="Erkek">Erkek</SelectItem>
                    <SelectItem value="Kadın">Kadın</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-date">
                    <SelectValue placeholder="Tarih" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Tarihler</SelectItem>
                    {uniqueDates.map((d) => (
                      <SelectItem key={d} value={d}>{formatDate(d)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="table-patients">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase w-12">#</th>
                      <SortHeader field="tc">TC Kimlik No</SortHeader>
                      <SortHeader field="ad">Ad</SortHeader>
                      <SortHeader field="soyad">Soyad</SortHeader>
                      <SortHeader field="yas">Yaş</SortHeader>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase cursor-pointer" onClick={() => toggleSort("cinsiyet")}>Cinsiyet</th>
                      <SortHeader field="tarih">Çalışma Tarihi</SortHeader>
                      <SortHeader field="ornek">Örnek</SortHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((p, i) => (
                      <tr
                        key={p.tc + i}
                        className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                        data-testid={`row-patient-${i}`}
                      >
                        <td className="px-3 py-2.5 text-sm text-muted-foreground">{(page - 1) * perPage + i + 1}</td>
                        <td className="px-3 py-2.5 text-sm font-mono" data-testid={`text-tc-${i}`}>{p.tc}</td>
                        <td className="px-3 py-2.5 text-sm font-medium" data-testid={`text-ad-${i}`}>{p.ad}</td>
                        <td className="px-3 py-2.5 text-sm font-medium" data-testid={`text-soyad-${i}`}>{p.soyad}</td>
                        <td className="px-3 py-2.5 text-sm" data-testid={`text-yas-${i}`}>{p.yas}</td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant="outline"
                            className={p.cinsiyet === "Erkek" ? "text-sky-600 border-sky-300 bg-sky-50 dark:bg-sky-950 dark:border-sky-800" : "text-pink-600 border-pink-300 bg-pink-50 dark:bg-pink-950 dark:border-pink-800"}
                            data-testid={`badge-cinsiyet-${i}`}
                          >
                            {p.cinsiyet}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-sm" data-testid={`text-tarih-${i}`}>{formatDate(p.calismaTarihi)}</td>
                        <td className="px-3 py-2.5 text-sm text-muted-foreground" data-testid={`text-ornek-${i}`}>{p.ornekSayisi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground" data-testid="text-showing">
                  {filtered.length} hastadan {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} gösteriliyor
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium px-2" data-testid="text-page-info">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
