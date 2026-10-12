import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type FieldType = 'text' | 'multiline' | 'number' | 'image' | 'datetime' | 'email' | 'url' | 'phone';

export interface FieldDef {
  name: string; // boleh bertitik, mis. "socials.instagram"
  label: string;
  type: FieldType;
  required?: boolean;
  max?: number;
  hint?: string;
}

export interface ResourceDef {
  key: 'church-history' | 'commissions' | 'events' | 'faqs';
  title: string;
  singular: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  labelField: string;
  subtitle?: (item: Record<string, any>) => string;
  fields: FieldDef[];
}

export const RESOURCES: Record<ResourceDef['key'], ResourceDef> = {
  events: {
    key: 'events',
    title: 'Acara',
    singular: 'acara',
    icon: 'calendar-outline',
    labelField: 'title',
    fields: [
      { name: 'title', label: 'Judul acara', type: 'text', required: true, max: 150 },
      { name: 'startAt', label: 'Mulai (WIB)', type: 'datetime', required: true },
      { name: 'endAt', label: 'Selesai (WIB)', type: 'datetime', hint: 'Opsional' },
      { name: 'location', label: 'Lokasi', type: 'text', max: 200 },
      { name: 'description', label: 'Deskripsi', type: 'multiline', max: 5000 },
      { name: 'contact', label: 'Kontak panitia', type: 'text', max: 300, hint: 'Hanya isi bila disetujui untuk dipublikasikan' },
      { name: 'imageUrl', label: 'Poster / gambar', type: 'image' },
    ],
  },
  commissions: {
    key: 'commissions',
    title: 'Komisi',
    singular: 'komisi',
    icon: 'people-outline',
    labelField: 'name',
    fields: [
      { name: 'name', label: 'Nama komisi', type: 'text', required: true, max: 120 },
      { name: 'description', label: 'Deskripsi', type: 'multiline', max: 5000 },
      { name: 'activities', label: 'Kegiatan utama', type: 'multiline', max: 3000 },
      { name: 'schedule', label: 'Jadwal kegiatan', type: 'multiline', max: 1000 },
      { name: 'contact', label: 'Kontak / penanggung jawab', type: 'text', max: 300, hint: 'Hanya isi bila disetujui untuk dipublikasikan' },
      { name: 'imageUrl', label: 'Foto / ilustrasi', type: 'image' },
      { name: 'order', label: 'Urutan tampil', type: 'number', hint: 'Angka kecil tampil lebih dulu' },
    ],
  },
  'church-history': {
    key: 'church-history',
    title: 'Sejarah',
    singular: 'peristiwa sejarah',
    icon: 'time-outline',
    labelField: 'title',
    subtitle: (i) => i.year,
    fields: [
      { name: 'year', label: 'Tahun / tanggal', type: 'text', required: true, max: 20 },
      { name: 'title', label: 'Judul peristiwa', type: 'text', required: true, max: 150 },
      { name: 'description', label: 'Deskripsi', type: 'multiline', max: 5000 },
      { name: 'imageUrl', label: 'Foto dokumentasi', type: 'image' },
      { name: 'order', label: 'Urutan di timeline', type: 'number', hint: 'Angka kecil tampil lebih dulu' },
    ],
  },
  faqs: {
    key: 'faqs',
    title: 'FAQ',
    singular: 'FAQ',
    icon: 'help-circle-outline',
    labelField: 'question',
    subtitle: (i) => i.category,
    fields: [
      { name: 'question', label: 'Pertanyaan', type: 'text', required: true, max: 300 },
      { name: 'answer', label: 'Jawaban', type: 'multiline', required: true, max: 3000 },
      { name: 'category', label: 'Kategori', type: 'text', max: 60, hint: 'Mis. Informasi gereja, Jadwal kegiatan' },
      { name: 'order', label: 'Urutan', type: 'number' },
    ],
  },
};

export const PROFILE_FIELDS: FieldDef[] = [
  { name: 'name', label: 'Nama resmi gereja', type: 'text', required: true, max: 150 },
  { name: 'shortDescription', label: 'Deskripsi singkat', type: 'multiline', max: 300 },
  { name: 'description', label: 'Deskripsi lengkap', type: 'multiline', max: 5000 },
  { name: 'welcomeMessage', label: 'Sambutan di Beranda', type: 'multiline', max: 500 },
  { name: 'historyIntro', label: 'Pengantar sejarah', type: 'multiline', max: 5000 },
  { name: 'logoUrl', label: 'Logo', type: 'image' },
  { name: 'heroImageUrl', label: 'Gambar utama Beranda', type: 'image' },
  { name: 'photoUrl', label: 'Foto gereja', type: 'image' },
  { name: 'address', label: 'Alamat', type: 'multiline', max: 300 },
  { name: 'mapsUrl', label: 'Tautan Google Maps', type: 'url', max: 500 },
  { name: 'phone', label: 'Telepon', type: 'phone', max: 50 },
  { name: 'email', label: 'Email', type: 'email', max: 200 },
  { name: 'website', label: 'Situs web', type: 'url', max: 200 },
  { name: 'socials.instagram', label: 'Instagram (URL)', type: 'url', max: 200 },
  { name: 'socials.facebook', label: 'Facebook (URL)', type: 'url', max: 200 },
  { name: 'socials.youtube', label: 'YouTube (URL)', type: 'url', max: 200 },
  { name: 'additionalInfo', label: 'Informasi tambahan', type: 'multiline', max: 3000 },
];

export const isResourceKey = (k: string): k is ResourceDef['key'] => k in RESOURCES;
