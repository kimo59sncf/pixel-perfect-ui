import { queryOptions } from "@tanstack/react-query";
import surahs from "@/data/surahs.json";
import type { Lang } from "./store";

export type Surah = (typeof surahs)[number];
export const SURAHS: Surah[] = surahs;

// Source: Tanzil Uthmani text + editions served by api.alquran.cloud (Islamic Network).
const API = "https://api.alquran.cloud/v1";
export const TRANSLATIONS: Record<Lang, { id: string; name: string } | null> = {
  fr: { id: "fr.hamidullah", name: "Muhammad Hamidullah (Tanzil)" },
  en: { id: "en.sahih", name: "Saheeh International (Tanzil)" },
  ar: null,
};

export const RECITERS = [
  { id: "ar.alafasy", name: "Mishary Alafasy", ar: "مشاري العفاسي" },
  { id: "ar.husary", name: "Mahmoud Khalil Al-Husary", ar: "محمود خليل الحصري" },
  { id: "ar.minshawi", name: "Mohamed Siddiq Al-Minshawi", ar: "محمد صديق المنشاوي" },
  { id: "ar.abdulbasitmurattal", name: "Abdul Basit (Murattal)", ar: "عبد الباسط عبد الصمد" },
  { id: "ar.abdurrahmaansudais", name: "Abdurrahman As-Sudais", ar: "عبدالرحمن السديس" },
  { id: "ar.mahermuaiqly", name: "Maher Al-Muaiqly", ar: "ماهر المعيقلي" },
  { id: "ar.saoodshuraym", name: "Saud Ash-Shuraim", ar: "سعود الشريم" },
];

export type Ayah = { n: number; global: number; ar: string; tr?: string; audio: string };

export const surahQuery = (n: number, lang: Lang, reciter: string) =>
  queryOptions({
    queryKey: ["surah", n, lang, reciter],
    staleTime: Infinity,
    queryFn: async (): Promise<Ayah[]> => {
      const tr = TRANSLATIONS[lang];
      const eds = ["quran-uthmani", reciter, ...(tr ? [tr.id] : [])].join(",");
      const res = await fetch(`${API}/surah/${n}/editions/${eds}`);
      if (!res.ok) throw new Error("network");
      const { data } = await res.json();
      const [text, audio, trans] = data;
      return text.ayahs.map((a: { numberInSurah: number; number: number; text: string }, i: number) => ({
        n: a.numberInSurah,
        global: a.number,
        ar: a.text,
        audio: audio.ayahs[i].audio,
        tr: trans?.ayahs[i]?.text,
      }));
    },
  });

export type SearchHit = { s: number; a: number; text: string };
export const searchQuery = (q: string, lang: Lang) =>
  queryOptions({
    queryKey: ["search", q, lang],
    enabled: q.trim().length > 2,
    staleTime: Infinity,
    queryFn: async (): Promise<SearchHit[]> => {
      const ed = TRANSLATIONS[lang]?.id ?? "quran-simple-clean";
      const res = await fetch(`${API}/search/${encodeURIComponent(q.trim())}/all/${ed}`);
      if (res.status === 404) return [];
      if (!res.ok) throw new Error("network");
      const { data } = await res.json();
      return (data?.matches ?? []).slice(0, 100).map((m: { surah: { number: number }; numberInSurah: number; text: string }) => ({
        s: m.surah.number, a: m.numberInSurah, text: m.text,
      }));
    },
  });

export const surahName = (s: Surah, lang: Lang) => (lang === "ar" ? s.ar : s.tr);
export const surah = (n: number): Surah => SURAHS[Math.min(Math.max(n, 1), 114) - 1]!;
