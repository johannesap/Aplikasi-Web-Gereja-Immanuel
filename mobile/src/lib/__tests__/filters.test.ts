import type { Faq } from '@/types';
import { filterFaqs, groupFaqs } from '../filters';

const faq = (question: string, answer: string, category = ''): Faq => ({
  _id: question,
  question,
  answer,
  category,
  order: 0,
  status: 'published',
});

const items = [
  faq('Kapan ibadah dimulai?', 'Lihat menu Acara.', 'Jadwal kegiatan'),
  faq('Di mana lokasi gereja?', 'Lihat Profil Gereja.', 'Kontak dan lokasi'),
  faq('Bagaimana bergabung dengan komisi?', 'Hubungi Sekretariat.'),
];

describe('pencarian FAQ', () => {
  it('kosong menampilkan semua', () => {
    expect(filterFaqs(items, '  ')).toHaveLength(3);
  });

  it('tidak peka huruf besar dan mencocokkan semua kata', () => {
    expect(filterFaqs(items, 'IBADAH')).toHaveLength(1);
    expect(filterFaqs(items, 'lokasi gereja').map((f) => f._id)).toEqual(['Di mana lokasi gereja?']);
    expect(filterFaqs(items, 'jadwal')).toHaveLength(1); // cocok di kategori
  });

  it('tidak ada hasil', () => {
    expect(filterFaqs(items, 'parkir')).toEqual([]);
  });

  it('mengelompokkan per kategori, tanpa kategori masuk "Umum"', () => {
    expect(groupFaqs(items).map((g) => g.title)).toEqual(['Jadwal kegiatan', 'Kontak dan lokasi', 'Umum']);
  });
});
