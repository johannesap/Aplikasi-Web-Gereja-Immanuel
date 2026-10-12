import { z } from 'zod';
import { ROLES } from '../config/permissions.js';

const text = (max) => z.string().trim().max(max);
const optText = (max) => text(max).optional();
// URL gambar dari endpoint upload (/uploads/...) atau URL http(s) eksternal.
const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || v.startsWith('/uploads/') || /^https?:\/\//.test(v), 'URL gambar tidak valid')
  .optional();
const linkUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https?:\/\//.test(v), 'Tautan harus diawali http:// atau https://')
  .optional();
const status = z.enum(['draft', 'published']);
const order = z.coerce.number().int().min(0).max(10000).optional();

export const password = z
  .string()
  .min(10, 'Kata sandi minimal 10 karakter')
  .max(128)
  .regex(/[A-Za-z]/, 'Kata sandi harus mengandung huruf')
  .regex(/[0-9]/, 'Kata sandi harus mengandung angka');

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Format email tidak valid').max(200),
  password: z.string().min(1, 'Kata sandi wajib diisi').max(128),
});

export const refreshSchema = z.object({ refreshToken: z.string().min(20).max(200) });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: password,
});

export const statusSchema = z.object({ status });

export const contentSchemas = {
  'church-history': z.object({
    year: text(20).min(1, 'Tahun wajib diisi'),
    title: text(150).min(1, 'Judul wajib diisi'),
    description: optText(5000),
    imageUrl,
    order,
    status: status.optional(),
  }),
  commissions: z.object({
    name: text(120).min(1, 'Nama komisi wajib diisi'),
    description: optText(5000),
    activities: optText(3000),
    schedule: optText(1000),
    contact: optText(300),
    imageUrl,
    order,
    status: status.optional(),
  }),
  events: z
    .object({
      title: text(150).min(1, 'Judul acara wajib diisi'),
      description: optText(5000),
      startAt: z.coerce.date({ error: 'Tanggal mulai tidak valid' }),
      endAt: z.coerce.date({ error: 'Tanggal selesai tidak valid' }).optional().nullable(),
      location: optText(200),
      contact: optText(300),
      imageUrl,
      status: status.optional(),
    })
    .refine((v) => !v.endAt || v.endAt >= v.startAt, {
      message: 'Waktu selesai harus setelah waktu mulai',
      path: ['endAt'],
    }),
  faqs: z.object({
    question: text(300).min(1, 'Pertanyaan wajib diisi'),
    answer: text(3000).min(1, 'Jawaban wajib diisi'),
    category: optText(60),
    order,
    status: status.optional(),
  }),
};

export const profileSchema = z.object({
  name: text(150).min(1).optional(),
  shortDescription: optText(300),
  description: optText(5000),
  welcomeMessage: optText(500),
  historyIntro: optText(5000),
  logoUrl: imageUrl,
  photoUrl: imageUrl,
  heroImageUrl: imageUrl,
  address: optText(300),
  phone: optText(50),
  email: z.union([z.literal(''), z.string().trim().email('Format email tidak valid').max(200)]).optional(),
  website: linkUrl,
  mapsUrl: linkUrl,
  socials: z.object({ instagram: linkUrl, facebook: linkUrl, youtube: linkUrl }).partial().optional(),
  additionalInfo: optText(3000),
});

export const createUserSchema = z.object({
  name: text(100).min(1, 'Nama wajib diisi'),
  email: z.string().trim().toLowerCase().email('Format email tidak valid').max(200),
  role: z.enum(ROLES),
});

export const updateUserSchema = z.object({
  name: text(100).min(1).optional(),
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
});
