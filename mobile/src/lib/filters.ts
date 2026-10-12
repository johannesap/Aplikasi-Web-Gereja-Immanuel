import type { Faq } from '@/types';

const normalize = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

/** Setiap kata yang diketik harus muncul di pertanyaan, jawaban, atau kategori. */
export function filterFaqs(items: Faq[], query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return items;
  return items.filter((f) => {
    const haystack = normalize(`${f.question} ${f.answer} ${f.category}`);
    return words.every((w) => haystack.includes(w));
  });
}

/** Mengelompokkan FAQ per kategori, urutan kategori mengikuti data. */
export function groupFaqs(items: Faq[]) {
  const groups = new Map<string, Faq[]>();
  for (const f of items) {
    const key = f.category || 'Umum';
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  return [...groups].map(([title, data]) => ({ title, data }));
}
