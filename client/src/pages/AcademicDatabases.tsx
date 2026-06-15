import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  ExternalLink,
  Database,
  BookOpen,
  GraduationCap,
  FlaskConical,
  Scale,
  Globe,
  FileText,
  ShieldCheck,
  Library,
  Newspaper,
  Microscope,
  Heart,
  Cpu,
  Leaf,
} from "lucide-react";

interface AcademicDB {
  name: string;
  url: string;
  description: string;
  category: string;
  tags: string[];
}

const CATEGORIES: Record<string, { icon: any; color: string; label: string }> = {
  "Multidisipliner": { icon: Database, color: "bg-blue-600", label: "Multidisipliner" },
  "Tam Metin": { icon: BookOpen, color: "bg-emerald-600", label: "Tam Metin Dergi" },
  "Tez & Disertasyon": { icon: GraduationCap, color: "bg-purple-600", label: "Tez & Disertasyon" },
  "Atıf İndeksi": { icon: FlaskConical, color: "bg-red-600", label: "Atıf İndeksi" },
  "Tıp & Sağlık": { icon: Heart, color: "bg-pink-600", label: "Tıp & Sağlık" },
  "İntihal": { icon: ShieldCheck, color: "bg-orange-600", label: "İntihal Tespit" },
  "Retrospektif": { icon: Library, color: "bg-amber-700", label: "Retrospektif İndeks" },
  "Haber & Medya": { icon: Newspaper, color: "bg-slate-600", label: "Haber & Medya" },
  "Mühendislik": { icon: Cpu, color: "bg-cyan-600", label: "Mühendislik & Teknoloji" },
  "Sosyal Bilimler": { icon: Scale, color: "bg-indigo-600", label: "Sosyal Bilimler" },
  "Tarih & Beşeri": { icon: Globe, color: "bg-teal-600", label: "Tarih & Beşeri Bilimler" },
  "Referans Yönetimi": { icon: FileText, color: "bg-gray-600", label: "Referans Yönetimi" },
  "Çevre": { icon: Leaf, color: "bg-green-600", label: "Çevre & Sürdürülebilirlik" },
  "Savunma": { icon: Microscope, color: "bg-stone-600", label: "Savunma & Güvenlik" },
};

const DATABASES: AcademicDB[] = [
  { name: "Annual Reviews", url: "https://www.annualreviews.org/", description: "Yıllık derleme makaleleri — 50+ disiplinde kapsamlı literatür özetleri", category: "Tam Metin", tags: ["derleme", "tüm alanlar"] },
  { name: "CAB Abstracts", url: "https://www.cabdirect.org/", description: "Tarım, veterinerlik, çevre bilimleri ve gıda bilimi alanında 10M+ kayıt", category: "Multidisipliner", tags: ["tarım", "veteriner", "çevre"] },
  { name: "EBSCOHOST", url: "https://search.ebscohost.com/", description: "Dünyanın en büyük akademik arama platformu — çoklu veritabanı erişimi", category: "Multidisipliner", tags: ["platform", "tüm alanlar"] },
  { name: "Academic Search Ultimate", url: "https://search.ebscohost.com/", description: "EBSCO'nun en kapsamlı multidisipliner veritabanı — 10.000+ tam metin dergi", category: "Multidisipliner", tags: ["tam metin", "tüm alanlar"] },
  { name: "Business Source Ultimate", url: "https://search.ebscohost.com/", description: "İşletme, ekonomi, finans ve yönetim alanında en büyük tam metin veritabanı", category: "Sosyal Bilimler", tags: ["işletme", "ekonomi", "finans"] },
  { name: "Central & Eastern European Academic Source", url: "https://search.ebscohost.com/", description: "Orta ve Doğu Avrupa'dan akademik yayınlar — bölgesel araştırmalar", category: "Sosyal Bilimler", tags: ["avrupa", "bölgesel"] },
  { name: "ERIC", url: "https://eric.ed.gov/", description: "Eğitim araştırmaları veritabanı — ABD Eğitim Bakanlığı destekli, 1.8M+ kayıt", category: "Sosyal Bilimler", tags: ["eğitim", "pedagoji", "ücretsiz"] },
  { name: "MasterFILE Complete", url: "https://search.ebscohost.com/", description: "Genel referans veritabanı — popüler dergiler, referans kitapları ve birincil kaynaklar", category: "Multidisipliner", tags: ["genel", "referans"] },
  { name: "MasterFILE Reference eBook Collection", url: "https://search.ebscohost.com/", description: "Referans e-kitap koleksiyonu — ansiklopediler, almanaklar, rehberler", category: "Multidisipliner", tags: ["e-kitap", "referans"] },
  { name: "Newspaper Source Plus", url: "https://search.ebscohost.com/", description: "Dünya genelinden 1.200+ gazete tam metni ve transkriptleri", category: "Haber & Medya", tags: ["gazete", "haber"] },
  { name: "OpenDissertations", url: "https://search.ebscohost.com/", description: "Açık erişimli tez ve disertasyonlar — dünya geneli yüksek lisans ve doktora tezleri", category: "Tez & Disertasyon", tags: ["tez", "açık erişim"] },
  { name: "Regional Business News", url: "https://search.ebscohost.com/", description: "Bölgesel iş dünyası haberleri ve yayınları — ABD ve dünya geneli", category: "Haber & Medya", tags: ["iş dünyası", "haber"] },
  { name: "The Belt and Road Initiative Reference Source", url: "https://search.ebscohost.com/", description: "Kuşak ve Yol Girişimi araştırma kaynakları — Çin ekonomi politikası", category: "Sosyal Bilimler", tags: ["ekonomi", "politika", "çin"] },
  { name: "TR Dizin", url: "https://trdizin.gov.tr/", description: "TÜBİTAK ULAKBİM Türkiye ulusal akademik dergi indeksi — Türkçe yayınlar", category: "Multidisipliner", tags: ["türkiye", "ulusal", "türkçe"] },
  { name: "Applied Science & Business Periodicals Retrospective", url: "https://search.ebscohost.com/", description: "1913-1983 arası uygulamalı bilim ve işletme dergileri retrospektif indeksi", category: "Retrospektif", tags: ["tarihsel", "uygulamalı bilim"] },
  { name: "Applied Science & Technology Index Retrospective", url: "https://search.ebscohost.com/", description: "1913-1983 arası uygulamalı bilim ve teknoloji retrospektif indeksi (H.W. Wilson)", category: "Retrospektif", tags: ["tarihsel", "teknoloji"] },
  { name: "Art Index Retrospective", url: "https://search.ebscohost.com/", description: "1929-1984 arası sanat dergileri retrospektif indeksi (H.W. Wilson)", category: "Retrospektif", tags: ["tarihsel", "sanat"] },
  { name: "Business Periodicals Index Retrospective", url: "https://search.ebscohost.com/", description: "1913-1982 arası işletme dergileri retrospektif indeksi (H.W. Wilson)", category: "Retrospektif", tags: ["tarihsel", "işletme"] },
  { name: "Education Index Retrospective", url: "https://search.ebscohost.com/", description: "1929-1983 arası eğitim dergileri retrospektif indeksi (H.W. Wilson)", category: "Retrospektif", tags: ["tarihsel", "eğitim"] },
  { name: "European Views of the Americas: 1493 to 1750", url: "https://search.ebscohost.com/", description: "1493-1750 arası Avrupa'nın Amerika kıtasına bakışı — tarihsel belgeler", category: "Tarih & Beşeri", tags: ["tarih", "keşif çağı"] },
  { name: "GreenFILE", url: "https://search.ebscohost.com/", description: "Çevre, iklim değişikliği, sürdürülebilirlik konularında araştırma veritabanı", category: "Çevre", tags: ["çevre", "iklim", "sürdürülebilirlik"] },
  { name: "Humanities & Social Sciences Index Retrospective", url: "https://search.ebscohost.com/", description: "1907-1984 arası beşeri ve sosyal bilimler retrospektif indeksi (H.W. Wilson)", category: "Retrospektif", tags: ["tarihsel", "sosyal bilimler"] },
  { name: "Library, Information Science & Technology Abstracts", url: "https://search.ebscohost.com/", description: "Kütüphanecilik, bilgi bilimi ve teknoloji alanında öz ve indeks veritabanı", category: "Sosyal Bilimler", tags: ["kütüphanecilik", "bilgi bilimi"] },
  { name: "MEDLINE", url: "https://pubmed.ncbi.nlm.nih.gov/", description: "ABD Ulusal Tıp Kütüphanesi — 30M+ biyomedikal ve yaşam bilimleri kaydı", category: "Tıp & Sağlık", tags: ["tıp", "biyomedikal", "PubMed"] },
  { name: "Newswires", url: "https://search.ebscohost.com/", description: "Uluslararası haber ajansları telgrafları — AP, UPI, Reuters ve daha fazlası", category: "Haber & Medya", tags: ["haber ajansı", "telgraf"] },
  { name: "Social Sciences Index Retrospective: 1907-1983", url: "https://search.ebscohost.com/", description: "1907-1983 arası sosyal bilimler retrospektif indeksi (H.W. Wilson)", category: "Retrospektif", tags: ["tarihsel", "sosyal bilimler"] },
  { name: "Teacher Reference Center", url: "https://search.ebscohost.com/", description: "Öğretmenler için referans kaynakları — müfredat, pedagoji, sınıf yönetimi", category: "Sosyal Bilimler", tags: ["eğitim", "öğretmen"] },
  { name: "DynaMed", url: "https://www.dynamed.com/", description: "Kanıta dayalı klinik karar destek sistemi — güncel tedavi rehberleri", category: "Tıp & Sağlık", tags: ["klinik", "tedavi", "kanıta dayalı tıp"] },
  { name: "Emerald Premier eJournal", url: "https://www.emerald.com/", description: "İşletme, yönetim, mühendislik ve kütüphanecilik alanında 300+ dergi", category: "Tam Metin", tags: ["işletme", "yönetim"] },
  { name: "IEEE Xplore", url: "https://ieeexplore.ieee.org/", description: "Elektrik, elektronik, bilgisayar mühendisliği — 5M+ teknik belge", category: "Mühendislik", tags: ["mühendislik", "bilgisayar", "elektronik"] },
  { name: "İntihal.net", url: "https://www.intihal.net/", description: "Türkiye'nin akademik intihal tespit sistemi — üniversitelerde zorunlu kullanım", category: "İntihal", tags: ["intihal", "türkiye", "akademik dürüstlük"] },
  { name: "iThenticate", url: "https://www.ithenticate.com/", description: "Profesyonel intihal tespit yazılımı — dergi yayıncıları ve araştırmacılar için", category: "İntihal", tags: ["intihal", "yayıncılık"] },
  { name: "JSTOR Archive Journal Content", url: "https://www.jstor.org/", description: "Akademik dergi arşivi — binlerce derginin tam geçmişi, beşeri bilimlerden fen bilimlerine", category: "Tam Metin", tags: ["arşiv", "tüm alanlar", "tam metin"] },
  { name: "Mendeley", url: "https://www.mendeley.com/", description: "Referans yönetim aracı ve akademik sosyal ağ — 100M+ makale keşfi", category: "Referans Yönetimi", tags: ["referans", "sosyal ağ", "ücretsiz"] },
  { name: "Military Big Data", url: "https://search.ebscohost.com/", description: "Savunma, askeri teknoloji ve güvenlik çalışmaları veri kaynağı", category: "Savunma", tags: ["savunma", "askeri", "güvenlik"] },
  { name: "Ovid Total Access Collection", url: "https://ovidsp.ovid.com/", description: "Wolters Kluwer tıp veritabanı — tıp, hemşirelik, eczacılık dergileri", category: "Tıp & Sağlık", tags: ["tıp", "hemşirelik", "eczacılık"] },
  { name: "New England Journal of Medicine (NEJM)", url: "https://www.nejm.org/", description: "Dünyanın en prestijli tıp dergisi — 1812'den beri yayında, IF: 176.1", category: "Tıp & Sağlık", tags: ["tıp", "klinik", "yüksek etki"] },
  { name: "NEJM Evidence Bundle", url: "https://evidence.nejm.org/", description: "NEJM kanıt paketi — sistematik derlemeler ve meta-analizler", category: "Tıp & Sağlık", tags: ["kanıta dayalı tıp", "meta-analiz"] },
  { name: "ProQuest Dissertations & Theses", url: "https://www.proquest.com/pqdtglobal/", description: "Dünya geneli tez veritabanı — 5M+ doktora ve yüksek lisans tezi", category: "Tez & Disertasyon", tags: ["tez", "doktora", "dünya geneli"] },
  { name: "ScienceDirect Freedom Collection", url: "https://www.sciencedirect.com/", description: "Elsevier'in tam metin veritabanı — 2.500+ dergi, 40.000+ kitap", category: "Tam Metin", tags: ["fen", "tıp", "mühendislik", "tam metin"] },
  { name: "Scopus", url: "https://www.scopus.com/", description: "Elsevier'in atıf veritabanı — 27.000+ dergi, 250M+ atıf, h-indeks hesaplama", category: "Atıf İndeksi", tags: ["atıf", "h-indeks", "tüm alanlar"] },
  { name: "SpringerLink", url: "https://link.springer.com/", description: "Springer Nature tam metin platformu — 3.700+ dergi, 300.000+ kitap", category: "Tam Metin", tags: ["fen", "tıp", "mühendislik"] },
  { name: "Palgrave Macmillan Journals", url: "https://www.palgrave.com/", description: "Sosyal bilimler ve beşeri bilimler alanında prestijli dergiler", category: "Tam Metin", tags: ["sosyal bilimler", "beşeri bilimler"] },
  { name: "Adis Journals", url: "https://www.springer.com/gp/adis", description: "İlaç ve farmakoloji alanında uzmanlaşmış dergiler — Springer bünyesinde", category: "Tıp & Sağlık", tags: ["farmakoloji", "ilaç"] },
  { name: "Nature Journals", url: "https://www.nature.com/", description: "Nature Publishing Group — dünyanın en yüksek etkili bilim dergileri, IF: 64.8", category: "Tam Metin", tags: ["fen", "yüksek etki", "multidisipliner"] },
  { name: "Taylor & Francis", url: "https://www.tandfonline.com/", description: "2.700+ dergi — sosyal bilimler, beşeri bilimler, fen ve teknoloji", category: "Tam Metin", tags: ["tüm alanlar", "tam metin"] },
  { name: "Turnitin", url: "https://www.turnitin.com/", description: "Global intihal tespit ve akademik bütünlük platformu — 1.5 milyar+ öğrenci ödevi", category: "İntihal", tags: ["intihal", "akademik bütünlük", "global"] },
  { name: "Web of Science", url: "https://www.webofscience.com/", description: "Clarivate'in atıf platformu — 21.000+ dergi, JIF (Journal Impact Factor) kaynağı", category: "Atıf İndeksi", tags: ["atıf", "impact factor", "tüm alanlar"] },
  { name: "Science Citation Index (SCI)", url: "https://www.webofscience.com/", description: "Fen bilimleri atıf indeksi — 1900'den beri, en prestijli dergi sıralaması", category: "Atıf İndeksi", tags: ["fen bilimleri", "atıf", "SCI"] },
  { name: "Social Science Citation Index (SSCI)", url: "https://www.webofscience.com/", description: "Sosyal bilimler atıf indeksi — 3.500+ dergi, sosyal bilim araştırmaları", category: "Atıf İndeksi", tags: ["sosyal bilimler", "atıf", "SSCI"] },
  { name: "Art & Humanities Citation Index (AHCI)", url: "https://www.webofscience.com/", description: "Sanat ve beşeri bilimler atıf indeksi — 1.800+ dergi", category: "Atıf İndeksi", tags: ["sanat", "beşeri bilimler", "AHCI"] },
  { name: "Book Citation Index", url: "https://www.webofscience.com/", description: "Kitap atıf indeksi — akademik kitapların atıf takibi", category: "Atıf İndeksi", tags: ["kitap", "atıf"] },
  { name: "Conference Proceedings Citation Index (CPCI-S)", url: "https://www.webofscience.com/", description: "Fen bilimleri konferans bildiri indeksi — uluslararası bilimsel konferanslar", category: "Atıf İndeksi", tags: ["konferans", "fen bilimleri"] },
  { name: "Conference Proceedings Citation Index (CPCI-SSH)", url: "https://www.webofscience.com/", description: "Sosyal bilimler & beşeri bilimler konferans bildiri indeksi", category: "Atıf İndeksi", tags: ["konferans", "sosyal bilimler"] },
  { name: "Wiley Online Library", url: "https://onlinelibrary.wiley.com/", description: "Wiley tam metin platformu — 1.600+ dergi, tıptan mühendisliğe geniş kapsam", category: "Tam Metin", tags: ["tüm alanlar", "tam metin"] },
];

export default function AcademicDatabases() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = DATABASES.filter((db) => {
    const matchesSearch =
      !search ||
      db.name.toLowerCase().includes(search.toLowerCase()) ||
      db.description.toLowerCase().includes(search.toLowerCase()) ||
      db.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = !activeCategory || db.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const categoryCounts: Record<string, number> = {};
  DATABASES.forEach((db) => {
    categoryCounts[db.category] = (categoryCounts[db.category] || 0) + 1;
  });

  const uniqueCategories = Object.keys(CATEGORIES).filter(
    (c) => categoryCounts[c]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Database className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              Akademik Veritabanları
            </h1>
          </div>
          <p className="text-muted-foreground text-lg" data-testid="text-page-subtitle">
            {DATABASES.length} veritabanına doğrudan erişim — araştırmanız için
            tüm kaynaklar tek sayfada
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Veritabanı ara... (ör: Scopus, tıp, atıf, tez)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-base"
              data-testid="input-search-databases"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="text-base px-3 py-1" data-testid="badge-result-count">
              {filtered.length} sonuç
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={activeCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(null)}
            data-testid="button-filter-all"
          >
            Tümü ({DATABASES.length})
          </Button>
          {uniqueCategories.map((cat) => {
            const catInfo = CATEGORIES[cat];
            const Icon = catInfo.icon;
            return (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setActiveCategory(activeCategory === cat ? null : cat)
                }
                className="gap-1"
                data-testid={`button-filter-${cat}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {catInfo.label} ({categoryCounts[cat]})
              </Button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((db, idx) => {
            const catInfo = CATEGORIES[db.category] || CATEGORIES["Multidisipliner"];
            const Icon = catInfo.icon;
            return (
              <Card
                key={db.name}
                className="hover:shadow-lg transition-shadow duration-200 group"
                data-testid={`card-database-${idx}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className={`p-1.5 rounded ${catInfo.color} text-white shrink-0`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base leading-tight truncate" data-testid={`text-db-name-${idx}`}>
                        {db.name}
                      </CardTitle>
                    </div>
                    <a
                      href={db.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                      data-testid={`link-db-${idx}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-db-desc-${idx}`}>
                    {db.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      {catInfo.label}
                    </Badge>
                    {db.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16" data-testid="text-no-results">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sonuç bulunamadı</h3>
            <p className="text-muted-foreground">
              Farklı anahtar kelimeler veya kategori deneyin
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
