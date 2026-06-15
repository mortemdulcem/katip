import { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Download,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Loader2,
  FileText,
  Languages,
  ArrowLeft,
  Image,
  ChevronDown,
  ChevronUp,
  X,
  ZoomIn,
  RotateCcw,
} from "lucide-react";

interface Book {
  id: string;
  title: string;
  titleTr: string;
  pages: number;
  chapterCount: number;
}

interface Chapter {
  id: string;
  label: string;
  charCount: number;
  wordCount: number;
  startPage?: number;
  endPage?: number;
}

interface ChapterImage {
  filename: string;
  page: number;
  size: number;
}

interface TranslationState {
  [chapterId: string]: {
    status: "pending" | "translating" | "done" | "error";
    chunks: { original: string; translated: string }[];
    totalChunks: number;
    completedChunks: number;
  };
}

const CHUNK_SIZE = 3000;

function splitTextIntoChunks(text: string, maxSize: number = CHUNK_SIZE): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;
    if (currentChunk.length + trimmedPara.length + 2 > maxSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedPara;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmedPara;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  return chunks.filter(c => c.length >= 5);
}

function cleanTranslatedText(text: string): string {
  const paras = text.split(/\n\n+/);
  return paras
    .map(p => {
      let line = p.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
      line = line.replace(/^(\d{1,4})\s{2,}/g, "");
      line = line.replace(/\s{2,}(\d{1,4})\s*$/g, "");
      line = line.replace(/\s{2,}/g, " ").trim();
      return line;
    })
    .filter(p => {
      if (p.length === 0) return false;
      if (/^\d{1,4}$/.test(p.trim())) return false;
      if (/^(Chapter|CHAPTER)\s+\d+$/i.test(p.trim())) return false;
      if (/^Sayfa\s+\d+$/i.test(p.trim())) return false;
      if (/^\d{1,4}\s*[-–—]\s*\d{1,4}$/.test(p.trim())) return false;
      if (/^[ivxlcdm]+$/i.test(p.trim()) && p.trim().length < 10) return false;
      return true;
    })
    .join("\n\n");
}

function isHeadingLine(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length > 120 || trimmed.length < 3) return false;
  if (/[.;,:]$/.test(trimmed)) return false;
  if (/^(Bölüm|BÖLÜM|Kısım|KISIM)\s+\d/i.test(trimmed)) return true;
  if (/^\d{1,2}\.\d{1,2}\s+[A-ZÇĞİÖŞÜa-zçğıöşü]/.test(trimmed) && trimmed.length < 80) return true;
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 80 && /[A-ZÇĞİÖŞÜ]{3,}/.test(trimmed) && !/\d{3,}/.test(trimmed)) return true;
  if (/^(Giriş|Sonuç|Özet|Tartışma|Kaynaklar|Kaynakça|Referanslar|İçindekiler|Önsöz|Sonsöz|Teşekkür|Dizin)$/i.test(trimmed)) return true;
  if (/^(Introduction|Conclusion|Summary|Discussion|References|Bibliography|Preface|Epilogue|Index)$/i.test(trimmed)) return true;
  return false;
}

function looksLikeSentenceEnd(text: string): boolean {
  const t = text.trim();
  if (/[.!?…\u2026]$/.test(t)) return true;
  if (/[)"\u201D\u2019'\]]$/.test(t) && /[.!?…]/.test(t.slice(-10))) return true;
  return false;
}

function looksLikeNewSentenceStart(text: string): boolean {
  const t = text.trim();
  if (/^[A-ZÇĞİÖŞÜ]/.test(t)) return true;
  if (/^\d+[\.\)]\s/.test(t)) return true;
  if (/^[-–—•]/.test(t)) return true;
  return false;
}

function mergeChunkTexts(chunks: { translated: string }[]): string[] {
  const allParas: string[] = [];
  let carryOver = "";

  for (const chunk of chunks) {
    const cleaned = cleanTranslatedText(chunk.translated);
    const paras = cleaned.split(/\n\n+/).filter(p => p.trim());
    if (paras.length === 0) continue;

    let startIdx = 0;
    if (carryOver) {
      const firstPara = paras[0];
      const shouldMerge = !isHeadingLine(firstPara) && !isHeadingLine(carryOver) &&
        (!looksLikeNewSentenceStart(firstPara) || !looksLikeSentenceEnd(carryOver));
      if (shouldMerge) {
        allParas.push(carryOver + " " + firstPara);
        startIdx = 1;
      } else {
        allParas.push(carryOver);
      }
    }
    for (let i = startIdx; i < paras.length; i++) allParas.push(paras[i]);

    carryOver = "";
    const lastPara = allParas[allParas.length - 1];
    if (lastPara && !isHeadingLine(lastPara) && !looksLikeSentenceEnd(lastPara)) {
      carryOver = allParas.pop()!;
    }
  }
  if (carryOver) allParas.push(carryOver);
  return allParas;
}

function renderChunksToHtml(chunks: { translated: string }[]): string {
  const allParas = mergeChunkTexts(chunks);
  let html = "";
  let isFirst = true;
  for (const para of allParas) {
    const escaped = para.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    if (isHeadingLine(para)) {
      html += `<p class="sub-heading"><b>${escaped}</b></p>`;
    } else {
      const cls = isFirst ? "text-block-first" : "text-block";
      html += `<p class="${cls}">${escaped}</p>`;
    }
    isFirst = false;
  }
  return html;
}

const BOOK_META: Record<string, { authors: string; publisher: string; year: string; docFileName: string }> = {
  causation: {
    authors: "Ian Freckelton & Danuta Mendelson",
    publisher: "Routledge (Taylor & Francis Group)",
    year: "2002 / 2016",
    docFileName: "Hukuk_ve_Tipta_Nedensellik_Turkce_Ceviri.doc",
  },
  knight: {
    authors: "Pekka Saukko & Bernard Knight",
    publisher: "CRC Press (Taylor & Francis Group)",
    year: "2016 (4th Edition)",
    docFileName: "Knight_Adli_Patoloji_Turkce_Ceviri.doc",
  },
};

export default function BookTranslation() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [translationState, setTranslationState] = useState<TranslationState>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<string | null>(null);
  const abortRef = useRef(false);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [chapterImages, setChapterImages] = useState<Record<string, ChapterImage[]>>({});
  const [loadingImages, setLoadingImages] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightboxImage) setLightboxImage(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [lightboxImage]);

  const loadChapterImages = async (bookId: string, chapterId: string) => {
    if (chapterImages[chapterId]) return;
    setLoadingImages(chapterId);
    try {
      const res = await fetch(`/api/book/${bookId}/chapter/${chapterId}/images`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setChapterImages(prev => ({ ...prev, [chapterId]: data.images || [] }));
      }
    } catch {}
    setLoadingImages(null);
  };

  const toggleChapterImages = (chapterId: string) => {
    if (expandedChapter === chapterId) {
      setExpandedChapter(null);
    } else {
      setExpandedChapter(chapterId);
      if (selectedBook) loadChapterImages(selectedBook, chapterId);
    }
  };

  useEffect(() => {
    fetch("/api/books", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setBooks(data))
      .catch(() => toast({ title: "Hata", description: "Kitap listesi yüklenemedi", variant: "destructive" }));
  }, []);

  const selectBook = async (bookId: string) => {
    setSelectedBook(bookId);
    setChapters([]);
    setTranslationState({});

    try {
      const res = await fetch(`/api/book/${bookId}/chapters`, { credentials: "include" });
      if (!res.ok) {
        toast({ title: "Hata", description: "Bölümler yüklenemedi. Kitap verisi hazırlanıyor olabilir, lütfen tekrar deneyin.", variant: "destructive" });
        setSelectedBook(null);
        return;
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        toast({ title: "Hata", description: "Geçersiz bölüm verisi", variant: "destructive" });
        setSelectedBook(null);
        return;
      }
      setChapters(data);

      const initial: TranslationState = {};
      for (const ch of data) {
        initial[ch.id] = {
          status: "pending",
          chunks: [],
          totalChunks: Math.ceil(ch.charCount / CHUNK_SIZE),
          completedChunks: 0,
        };
      }

      const cachePromises = data.map(async (ch: Chapter) => {
        try {
          const [cacheRes, chRes] = await Promise.all([
            fetch(`/api/book/${bookId}/translation-cache-all/${ch.id}`, { credentials: "include" }),
            fetch(`/api/book/${bookId}/chapter/${ch.id}`, { credentials: "include" }),
          ]);
          const cacheData = await cacheRes.json();
          const chData = await chRes.json();
          const realChunks = splitTextIntoChunks(chData.text);
          const realTotal = realChunks.length;

          if (cacheData.chunks && cacheData.chunks.length > 0) {
            const cachedChunks = cacheData.chunks.map((c: { translation: string }) => ({
              original: "",
              translated: c.translation,
            }));
            const cachedCount = cachedChunks.length;

            if (cachedCount >= realTotal && realTotal > 0) {
              return { id: ch.id, status: "done" as const, chunks: cachedChunks.slice(0, realTotal), totalChunks: realTotal, completedChunks: realTotal };
            } else {
              return { id: ch.id, status: "pending" as const, chunks: cachedChunks, totalChunks: realTotal, completedChunks: cachedCount };
            }
          }
          return { id: ch.id, status: "pending" as const, chunks: [] as { original: string; translated: string }[], totalChunks: realTotal, completedChunks: 0 };
        } catch {
          return null;
        }
      });

      const results = await Promise.all(cachePromises);
      for (const r of results) {
        if (r) {
          initial[r.id] = { status: r.status, chunks: r.chunks, totalChunks: r.totalChunks, completedChunks: r.completedChunks };
        }
      }

      setTranslationState(initial);
    } catch {
      toast({ title: "Hata", description: "Bölümler yüklenemedi", variant: "destructive" });
    }
  };

  const translateChunk = async (text: string, chapterId: string, chunkIndex: number): Promise<string> => {
    if (!text || text.trim().length < 5) {
      return text || "";
    }
    const MAX_CLIENT_RETRIES = 3;
    for (let attempt = 0; attempt <= MAX_CLIENT_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise(r => setTimeout(r, 2000 * attempt));
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);
        const res = await fetch(`/api/book/${selectedBook}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ text, chapterId, chunkIndex }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: "Server error" }));
          if (attempt < MAX_CLIENT_RETRIES) continue;
          throw new Error(err.message || "Translation failed");
        }
        const data = await res.json();
        return data.translation;
      } catch (e: any) {
        if (e.name === "AbortError" && attempt < MAX_CLIENT_RETRIES) continue;
        if (attempt >= MAX_CLIENT_RETRIES) throw e;
      }
    }
    throw new Error("Translation failed after retries");
  };

  const translationStateRef = useRef(translationState);
  translationStateRef.current = translationState;

  const PARALLEL_CHUNKS = 2;

  const translateChapter = async (chapterId: string) => {
    setCurrentChapter(chapterId);

    const existingState = translationStateRef.current[chapterId];
    const existingChunks = existingState?.chunks || [];

    setTranslationState((prev) => ({
      ...prev,
      [chapterId]: { ...prev[chapterId], status: "translating" },
    }));

    try {
      const cacheRes = await fetch(`/api/book/${selectedBook}/translation-cache-all/${chapterId}`, { credentials: "include" });
      const cacheData = await cacheRes.json();
      let serverCachedChunks: { original: string; translated: string }[] = [];
      if (cacheData.chunks && cacheData.chunks.length > 0) {
        serverCachedChunks = cacheData.chunks.map((c: { translation: string }) => ({
          original: "",
          translated: c.translation,
        }));
      }

      const startChunks = serverCachedChunks.length > existingChunks.length ? serverCachedChunks : existingChunks;
      const startFrom = startChunks.length;

      const res = await fetch(`/api/book/${selectedBook}/chapter/${chapterId}`, { credentials: "include" });
      const data = await res.json();
      const chunks = splitTextIntoChunks(data.text);

      if (startFrom >= chunks.length && chunks.length > 0) {
        setTranslationState((prev) => ({
          ...prev,
          [chapterId]: { ...prev[chapterId], status: "done", chunks: startChunks.slice(0, chunks.length), totalChunks: chunks.length, completedChunks: chunks.length },
        }));
        return;
      }

      setTranslationState((prev) => ({
        ...prev,
        [chapterId]: { ...prev[chapterId], totalChunks: chunks.length, chunks: [...startChunks], completedChunks: startFrom },
      }));

      const translatedChunks: { original: string; translated: string }[] = [...startChunks];
      let failedCount = 0;

      for (let i = startFrom; i < chunks.length; i += PARALLEL_CHUNKS) {
        if (abortRef.current) break;

        const batchSize = Math.min(PARALLEL_CHUNKS, chunks.length - i);
        const batch = chunks.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map((chunk, idx) => translateChunk(chunk, chapterId, i + idx))
        );

        for (let j = 0; j < results.length; j++) {
          if (results[j].status === "fulfilled") {
            translatedChunks.push({ original: batch[j], translated: (results[j] as PromiseFulfilledResult<string>).value });
          } else {
            failedCount++;
            translatedChunks.push({ original: batch[j], translated: `[Çeviri başarısız - parça ${i + j + 1}]` });
          }
        }

        setTranslationState((prev) => ({
          ...prev,
          [chapterId]: {
            ...prev[chapterId],
            chunks: [...translatedChunks],
            completedChunks: translatedChunks.length,
          },
        }));
      }

      if (!abortRef.current) {
        if (failedCount > 0) {
          setTranslationState((prev) => ({
            ...prev,
            [chapterId]: { ...prev[chapterId], status: "done" },
          }));
          toast({ title: "Çeviri Tamamlandı", description: `${chapterId}: ${failedCount} parça başarısız oldu, geri kalanı çevrildi. Tekrar deneyebilirsiniz.`, variant: "destructive" });
        } else {
          setTranslationState((prev) => ({
            ...prev,
            [chapterId]: { ...prev[chapterId], status: "done" },
          }));
        }
      }
    } catch (e: any) {
      setTranslationState((prev) => ({
        ...prev,
        [chapterId]: { ...prev[chapterId], status: "error" },
      }));
      toast({ title: "Çeviri Hatası", description: `${chapterId}: ${e.message}`, variant: "destructive" });
    }
  };

  const retryChapter = async (chapterId: string) => {
    setIsTranslating(true);
    abortRef.current = false;
    await translateChapter(chapterId);
    setIsTranslating(false);
    setCurrentChapter(null);
  };

  const startTranslation = async () => {
    setIsTranslating(true);
    abortRef.current = false;

    const MAX_CHAPTER_RETRIES = 3;

    for (let i = 0; i < chapters.length; i++) {
      if (abortRef.current) break;
      const ch = chapters[i];
      const state = translationStateRef.current[ch.id];
      if (state?.status === "done") continue;

      for (let retry = 0; retry < MAX_CHAPTER_RETRIES; retry++) {
        if (abortRef.current) break;
        await translateChapter(ch.id);
        const newState = translationStateRef.current[ch.id];
        if (newState?.status === "done") break;
        if (newState?.status === "error" && retry < MAX_CHAPTER_RETRIES - 1) {
          toast({ title: "Otomatik Yeniden Deneme", description: `${ch.label} tekrar deneniyor (${retry + 2}/${MAX_CHAPTER_RETRIES})...` });
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    }

    setIsTranslating(false);
    setCurrentChapter(null);
    if (!abortRef.current) {
      const allDone = chapters.every(ch => translationStateRef.current[ch.id]?.status === "done");
      if (allDone) {
        toast({ title: "Tamamlandı", description: "Kitap çevirisi başarıyla tamamlandı!" });
      } else {
        const errorCount = chapters.filter(ch => translationStateRef.current[ch.id]?.status === "error").length;
        toast({ title: "Kısmi Tamamlanma", description: `${errorCount} bölüm tamamlanamadı. 'Çeviriyi Başlat' ile tekrar deneyebilirsiniz.`, variant: "destructive" });
      }
    }
  };

  const retryAllFailed = async () => {
    setIsTranslating(true);
    abortRef.current = false;

    const failedChapters = chapters.filter(ch => {
      const state = translationStateRef.current[ch.id];
      return state?.status === "error";
    });

    for (const ch of failedChapters) {
      if (abortRef.current) break;
      for (let retry = 0; retry < 3; retry++) {
        if (abortRef.current) break;
        await translateChapter(ch.id);
        if (translationStateRef.current[ch.id]?.status === "done") break;
        if (retry < 2) await new Promise(r => setTimeout(r, 3000));
      }
    }

    setIsTranslating(false);
    setCurrentChapter(null);
    const remaining = chapters.filter(ch => translationStateRef.current[ch.id]?.status === "error").length;
    if (remaining === 0) {
      toast({ title: "Tamamlandı", description: "Tüm eksik bölümler başarıyla tamamlandı!" });
    } else {
      toast({ title: "Bilgi", description: `${remaining} bölüm hâlâ tamamlanamadı.`, variant: "destructive" });
    }
  };

  const stopTranslation = () => {
    abortRef.current = true;
    setIsTranslating(false);
  };

  const completedChapters = Object.values(translationState).filter((s) => s.status === "done").length;
  const hasAnyTranslation = Object.values(translationState).some((s) => s.chunks && s.chunks.length > 0);
  const totalWords = chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
  const totalChars = chapters.reduce((sum, ch) => sum + (ch.charCount || 0), 0);

  const currentBook = books.find((b) => b.id === selectedBook);
  const meta = selectedBook ? BOOK_META[selectedBook] : null;

  const [isExporting, setIsExporting] = useState(false);

  const MAX_IMAGES_PER_CHAPTER = 20;

  const fetchChapterImagesForExport = async (bookId: string, chapterId: string): Promise<string[]> => {
    try {
      const res = await fetch(`/api/book/${bookId}/chapter/${chapterId}/images`, { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      const images: ChapterImage[] = (data.images || []).slice(0, MAX_IMAGES_PER_CHAPTER);
      if (images.length === 0) return [];

      const results = await Promise.all(
        images.map(async (img) => {
          try {
            const imgRes = await fetch(`/api/book/${bookId}/chapter/${chapterId}/image/${img.filename}`, { credentials: "include" });
            if (!imgRes.ok) return null;
            const blob = await imgRes.blob();
            if (blob.size > 2 * 1024 * 1024) return null;
            return new Promise<string | null>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(blob);
            });
          } catch {
            return null;
          }
        })
      );
      return results.filter((r): r is string => r !== null);
    } catch {
      return [];
    }
  };

  const buildChapterImagesHtml = async (ch: Chapter): Promise<string> => {
    if (!selectedBook || !ch.startPage || !ch.endPage) return "";
    try {
      const images = await fetchChapterImagesForExport(selectedBook, ch.id);
      if (images.length === 0) return "";
      let html = `<div class="figure-section"><div class="figure-label">Bölüm Görselleri (${images.length} adet)</div>`;
      for (let gi = 0; gi < images.length; gi++) {
        html += `<p class="figure-label">Şekil ${gi + 1}</p><img class="figure-img" src="${images[gi]}" style="max-width:280px; max-height:220px; width:auto; height:auto;" />`;
      }
      html += `</div>`;
      return html;
    } catch {
      return "";
    }
  };

  const generateDoc = useCallback(async () => {
    const entriesWithChunks = Object.entries(translationState).filter(([, s]) => s.chunks && s.chunks.length > 0);
    if (entriesWithChunks.length === 0) {
      toast({ title: "Uyarı", description: "Henüz çevrilmiş bölüm bulunmuyor", variant: "destructive" });
      return;
    }

    setIsExporting(true);
    toast({ title: "Hazırlanıyor", description: "Görseller dahil edilerek DOC dosyası oluşturuluyor..." });

    try {
      const bookTitle = currentBook?.titleTr || "Kitap Çevirisi";
      const bookOriginal = currentBook?.title || "";

      let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<!--[if gte mso 9]><xml>
<w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml><![endif]-->
<style>
  @page {
    size: 21cm 29.7cm;
    margin: 2.5cm 2cm 2.5cm 3cm;
    mso-header-margin: 1.5cm;
    mso-footer-margin: 1.5cm;
    mso-paper-source: 0;
  }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #000;
    margin: 0;
    padding: 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: normal;
    hyphens: auto;
  }
  p {
    margin: 0 0 6pt 0;
    padding: 0;
    text-align: justify;
    orphans: 3;
    widows: 3;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .book-title { text-align: center; font-size: 22pt; font-weight: bold; margin: 80pt 0 12pt 0; color: #000; letter-spacing: 1pt; }
  .book-subtitle { text-align: center; font-size: 13pt; font-weight: bold; color: #000; margin-bottom: 30pt; }
  .book-info { text-align: center; font-size: 11pt; color: #333; margin: 4pt 0; }
  .chapter-title {
    font-size: 14pt;
    font-weight: bold;
    color: #000;
    margin: 24pt 0 18pt 0;
    padding-bottom: 4pt;
    border-bottom: 1pt solid #000;
    page-break-before: always;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
  }
  .text-block {
    margin: 0 0 6pt 0;
    text-align: justify;
    text-indent: 1.25cm;
    font-size: 12pt;
    line-height: 1.6;
    orphans: 3;
    widows: 3;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .text-block-first {
    margin: 0 0 6pt 0;
    text-align: justify;
    text-indent: 0;
    font-size: 12pt;
    line-height: 1.6;
    orphans: 3;
    widows: 3;
  }
  .sub-heading {
    font-size: 12pt;
    font-weight: bold;
    margin: 14pt 0 8pt 0;
    text-indent: 0;
    text-align: left;
    line-height: 1.5;
    color: #000;
  }
  .figure-section { margin: 15pt 0; padding: 8pt 0; border-top: 0.5pt solid #ccc; page-break-inside: avoid; }
  .figure-label { font-size: 10pt; font-weight: bold; color: #333; margin: 6pt 0 3pt 0; }
  .figure-img { max-width: 7cm; max-height: 6cm; width: auto; height: auto; margin: 4pt 0 10pt 0; }
  .footer-note { font-size: 9pt; color: #666; text-align: center; margin-top: 40pt; border-top: 0.5pt solid #999; padding-top: 8pt; }
</style>
</head>
<body>
<div class="book-title">${bookTitle.toUpperCase()}</div>
<div class="book-subtitle">(${bookOriginal})</div>
<div style="text-align:center; margin: 40pt 0;">
  <p class="book-info"><b>Yazarlar:</b> ${meta?.authors || ""}</p>
  <p class="book-info"><b>Yayınevi:</b> ${meta?.publisher || ""}</p>
  <p class="book-info"><b>Orijinal Baskı:</b> ${meta?.year || ""}</p>
  <p class="book-info" style="margin-top:20pt;"><b>Türkçe Çeviri</b></p>
  <p class="book-info">Tıp ve Hukuk Terminolojisine Uygun Akademik Çeviri</p>
</div>`;

      for (const ch of chapters) {
        const state = translationState[ch.id];
        if (!state || !state.chunks || state.chunks.length === 0) continue;

        const statusLabel = state.status === "done" ? "" : ` (kısmi çeviri - ${state.completedChunks}/${state.totalChunks})`;
        html += `<div class="chapter-title">${ch.label}${statusLabel}</div>`;
        html += renderChunksToHtml(state.chunks);
        html += await buildChapterImagesHtml(ch);
      }

      html += `<p class="footer-note">Bu çeviri, tıp ve hukuk terminolojisine sadık kalınarak akademik amaçlı hazırlanmıştır.<br>Orijinal eser: "${bookOriginal}" — ${meta?.authors || ""}, ${meta?.publisher || ""}, ${meta?.year || ""}.</p>`;
      html += `</body></html>`;

      const blob = new Blob([html], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = meta?.docFileName || "Kitap_Ceviri.doc";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "İndirildi", description: "Görseller dahil Türkçe DOC dosyası indirildi" });
    } catch (e: any) {
      toast({ title: "Hata", description: "DOC oluşturulurken hata oluştu", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }, [translationState, chapters, toast, currentBook, meta, selectedBook]);

  const generatePDF = useCallback(async () => {
    const entriesWithChunks = Object.entries(translationState).filter(([, s]) => s.chunks && s.chunks.length > 0);
    if (entriesWithChunks.length === 0) {
      toast({ title: "Uyarı", description: "Henüz çevrilmiş bölüm bulunmuyor", variant: "destructive" });
      return;
    }

    setIsExporting(true);
    toast({ title: "Hazırlanıyor", description: "Görseller dahil edilerek PDF önizlemesi oluşturuluyor..." });

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setIsExporting(false);
      toast({ title: "Hata", description: "Popup engelleyici aktif olabilir", variant: "destructive" });
      return;
    }

    try {
      const bookTitle = currentBook?.titleTr || "Kitap Çevirisi";
      const bookOriginal = currentBook?.title || "";

      let html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>${bookTitle} — Türkçe Çeviri</title>
<style>
  @page {
    size: A4;
    margin: 2.5cm 2cm 2.5cm 3cm;
  }
  @media print { .no-print { display: none; } }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #000;
    padding: 2.5cm 2cm 2.5cm 3cm;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: normal;
    hyphens: auto;
  }
  p {
    margin: 0 0 6pt 0;
    text-align: justify;
    orphans: 3;
    widows: 3;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .cover { text-align: center; padding: 100px 0; page-break-after: always; }
  .cover h1 { font-size: 22pt; font-weight: bold; margin-bottom: 10px; color: #000; letter-spacing: 1px; }
  .cover h2 { font-size: 13pt; font-weight: bold; color: #333; margin-bottom: 40px; }
  .cover p { font-size: 11pt; color: #333; margin: 4px 0; }
  .chapter { page-break-before: always; }
  .chapter-title {
    font-size: 14pt;
    font-weight: bold;
    color: #000;
    margin: 0 0 18px 0;
    padding-bottom: 4px;
    border-bottom: 1px solid #000;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .text-block {
    margin: 0 0 6pt 0;
    text-align: justify;
    font-size: 12pt;
    line-height: 1.6;
    text-indent: 1.25cm;
    orphans: 3;
    widows: 3;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .text-block-first {
    margin: 0 0 6pt 0;
    text-align: justify;
    font-size: 12pt;
    line-height: 1.6;
    text-indent: 0;
    orphans: 3;
    widows: 3;
  }
  .sub-heading {
    font-size: 12pt;
    font-weight: bold;
    margin: 14pt 0 8pt 0;
    text-indent: 0;
    text-align: left;
    line-height: 1.5;
    color: #000;
  }
  .figure-section { margin: 15px 0; padding: 8px 0; border-top: 0.5px solid #ccc; page-break-inside: avoid; }
  .figure-label { font-size: 10pt; font-weight: bold; color: #333; margin: 6px 0 3px 0; }
  .figure-img { max-width: 260px; max-height: 200px; width: auto; height: auto; margin: 4px 0 10px 0; }
  .footer-note { font-size: 9pt; color: #666; text-align: center; margin-top: 40px; border-top: 0.5px solid #999; padding-top: 8px; }
  .print-btn { position: fixed; top: 20px; right: 20px; padding: 12px 24px; background: #1a1a2e; color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; z-index: 1000; }
  .print-btn:hover { background: #2a2a4e; }
</style>
</head><body>
<button class="print-btn no-print" onclick="window.print()">PDF Olarak Kaydet / Yazdır</button>
<div class="cover">
  <h1>${bookTitle.toUpperCase()}</h1>
  <h2>(${bookOriginal})</h2>
  <p><b>Yazarlar:</b> ${meta?.authors || ""}</p>
  <p><b>Yayınevi:</b> ${meta?.publisher || ""}</p>
  <p style="margin-top:30px;"><b>Türkçe Çeviri</b></p>
  <p>Tıp ve Hukuk Terminolojisine Uygun Akademik Çeviri</p>
</div>`;

      for (const ch of chapters) {
        const state = translationState[ch.id];
        if (!state || !state.chunks || state.chunks.length === 0) continue;

        const statusLabel = state.status === "done" ? "" : ` (kısmi çeviri - ${state.completedChunks}/${state.totalChunks})`;
        html += `<div class="chapter"><div class="chapter-title">${ch.label}${statusLabel}</div>`;
        html += renderChunksToHtml(state.chunks);
        html += await buildChapterImagesHtml(ch);
        html += `</div>`;
      }

      html += `<p class="footer-note">Bu çeviri, tıp ve hukuk terminolojisine sadık kalınarak akademik amaçlı hazırlanmıştır.<br>Orijinal eser: "${bookOriginal}" — ${meta?.authors || ""}, ${meta?.publisher || ""}, ${meta?.year || ""}.</p>`;
      html += `</body></html>`;
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (e: any) {
      printWindow.close();
      toast({ title: "Hata", description: "PDF oluşturulurken hata oluştu", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }, [translationState, chapters, toast, currentBook, meta, selectedBook]);

  if (!selectedBook) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <aside className="w-64 flex-shrink-0 hidden lg:block">
          <Sidebar />
        </aside>
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                <Languages className="w-7 h-7 text-primary" />
                Kitap Çevirisi
              </h1>
              <p className="text-muted-foreground mt-1">
                Akademik kitapların Türkçeye profesyonel çevirisi
              </p>
            </div>

            <div className="grid gap-4">
              {books.map((book) => (
                <Card
                  key={book.id}
                  className="cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 hover:shadow-md"
                  onClick={() => selectBook(book.id)}
                  data-testid={`book-card-${book.id}`}
                >
                  <CardContent className="py-5 px-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{book.titleTr}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{book.title}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{book.pages} sayfa</span>
                          <span>{book.chapterCount} bölüm</span>
                          <span>{BOOK_META[book.id]?.authors}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        Çevir
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {books.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Kitaplar yükleniyor...
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-64 flex-shrink-0 hidden lg:block">
        <Sidebar />
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setSelectedBook(null); setChapters([]); setTranslationState({}); }}
                data-testid="btn-back-books"
                disabled={isTranslating}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                  <Languages className="w-7 h-7 text-primary" />
                  {currentBook?.titleTr || "Kitap Çevirisi"}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  {currentBook?.title} — Akademik Türkçe Çeviri
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {!isTranslating ? (
                <>
                  <Button onClick={startTranslation} data-testid="btn-start-translation" className="gap-2">
                    <Play className="w-4 h-4" />
                    Çeviriyi Başlat
                  </Button>
                  {Object.values(translationState).some(s => s.status === "error") && (
                    <Button onClick={retryAllFailed} variant="secondary" data-testid="btn-retry-all" className="gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Eksikleri Tamamla
                    </Button>
                  )}
                </>
              ) : (
                <Button onClick={stopTranslation} variant="destructive" data-testid="btn-stop-translation" className="gap-2">
                  <Pause className="w-4 h-4" />
                  Durdur
                </Button>
              )}
              <Button onClick={generateDoc} variant="default" data-testid="btn-download-book" className="gap-2" disabled={!hasAnyTranslation || isExporting}>
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Tüm Kitabı İndir (DOC)
              </Button>
              <Button onClick={generatePDF} variant="outline" data-testid="btn-download-pdf" className="gap-2" disabled={!hasAnyTranslation || isExporting}>
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                PDF Önizleme
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Genel İlerleme</span>
                <span className="text-sm text-muted-foreground">
                  {completedChapters} / {chapters.length} bölüm
                </span>
              </div>
              <Progress value={(completedChapters / Math.max(chapters.length, 1)) * 100} className="h-3" />
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span>Toplam: ~{Math.round(totalWords / 1000)}K kelime</span>
                <span>{currentBook?.pages || 0} sayfa</span>
                <span>{chapters.length} bölüm</span>
                <span>{(totalChars / 1000000).toFixed(1)}M karakter</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {chapters.map((ch) => {
              const state = translationState[ch.id];
              const progress = state
                ? Math.round((state.completedChunks / Math.max(state.totalChunks, 1)) * 100)
                : 0;
              const isExpanded = expandedChapter === ch.id;
              const images = chapterImages[ch.id] || [];
              const isLoadingImg = loadingImages === ch.id;

              return (
                <Card key={ch.id} className={`transition-all ${currentChapter === ch.id ? "ring-2 ring-primary" : ""}`}>
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {state?.status === "done" ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : state?.status === "translating" ? (
                          <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                        ) : state?.status === "error" ? (
                          <div className="w-5 h-5 rounded-full bg-destructive flex-shrink-0" />
                        ) : (
                          <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{ch.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {(ch.wordCount || 0).toLocaleString()} kelime · {Math.ceil(ch.charCount / CHUNK_SIZE)} parça
                            {ch.startPage && ch.endPage ? ` · Sayfa ${ch.startPage}-${ch.endPage}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {ch.startPage && ch.endPage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs h-7 px-2"
                            onClick={(e) => { e.stopPropagation(); toggleChapterImages(ch.id); }}
                            data-testid={`btn-images-${ch.id}`}
                          >
                            {isLoadingImg ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Image className="w-3.5 h-3.5" />
                            )}
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </Button>
                        )}
                        {state?.status === "translating" && (
                          <div className="w-32">
                            <Progress value={progress} className="h-2" />
                          </div>
                        )}
                        {state?.status === "error" && !isTranslating && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs h-7 px-2"
                            onClick={(e) => { e.stopPropagation(); retryChapter(ch.id); }}
                            data-testid={`btn-retry-${ch.id}`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Yeniden Dene
                          </Button>
                        )}
                        <Badge variant={
                          state?.status === "done" ? "default" :
                          state?.status === "translating" ? "secondary" :
                          state?.status === "error" ? "destructive" : "outline"
                        }>
                          {state?.status === "done" ? "Tamamlandı" :
                           state?.status === "translating" ? `%${progress}` :
                           state?.status === "error" ? `Hata (${state?.completedChunks || 0}/${state?.totalChunks || "?"})` : "Bekliyor"}
                        </Badge>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 border-t pt-4">
                        {isLoadingImg ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Görseller çıkarılıyor (ilk seferde biraz zaman alabilir)...
                          </div>
                        ) : images.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            Bu bölümde görsel bulunamadı
                          </p>
                        ) : (
                          <div>
                            <p className="text-xs text-muted-foreground mb-3">
                              {images.length} görsel bulundu (Sayfa {ch.startPage}-{ch.endPage})
                            </p>
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                              {images.map((img, idx) => (
                                <div
                                  key={img.filename}
                                  className="relative group cursor-pointer rounded overflow-hidden border bg-muted/30 hover:ring-2 hover:ring-primary/50 transition-all"
                                  onClick={() => setLightboxImage(`/api/book/${selectedBook}/chapter/${ch.id}/image/${img.filename}`)}
                                  data-testid={`chapter-image-${ch.id}-${idx}`}
                                >
                                  <img
                                    src={`/api/book/${selectedBook}/chapter/${ch.id}/image/${img.filename}`}
                                    alt={`Sayfa ${img.page} - Görsel ${idx + 1}`}
                                    className="w-full h-auto object-contain max-h-24"
                                    loading="lazy"
                                  />
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span>S. {img.page}</span>
                                    <ZoomIn className="w-3 h-3" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
          data-testid="lightbox-overlay"
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setLightboxImage(null)}
            data-testid="lightbox-close"
          >
            <X className="w-6 h-6" />
          </Button>
          <img
            src={lightboxImage}
            alt="Görsel"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
            data-testid="lightbox-image"
          />
        </div>
      )}
    </div>
  );
}
