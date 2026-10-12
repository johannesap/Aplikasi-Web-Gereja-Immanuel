import mongoose from 'mongoose';
import { ChurchHistory, Commission, Event, Faq } from '../models/content.js';
import { getProfile } from '../models/ChurchProfile.js';
import { notFound } from '../utils/errors.js';
import { paged } from '../utils/pagination.js';
import { searchFilter } from './content.controller.js';

// Publik hanya pernah melihat konten berstatus published; field internal disembunyikan.
const PUBLISHED = { status: 'published' };
const HIDDEN = { createdBy: 0, updatedBy: 0 };

const byIdOrSlug = (key) =>
  mongoose.isValidObjectId(key) ? { $or: [{ _id: key }, { slug: key }] } : { slug: key };

export async function churchProfile(_req, res) {
  const { updatedBy, ...profile } = await getProfile();
  res.json(profile);
}

export async function churchHistory(_req, res) {
  const [profile, items] = await Promise.all([
    getProfile(),
    ChurchHistory.find(PUBLISHED, HIDDEN).sort({ order: 1, year: 1 }).limit(200).lean(),
  ]);
  res.json({ intro: profile.historyIntro, items });
}

export async function commissions(req, res) {
  res.json(await paged(Commission, PUBLISHED, { order: 1, name: 1 }, req.query, HIDDEN));
}

export async function commission(req, res) {
  const item = await Commission.findOne({ ...PUBLISHED, ...byIdOrSlug(req.params.id) }, HIDDEN).lean();
  if (!item) throw notFound('Komisi tidak ditemukan');
  res.json(item);
}

// when=upcoming: belum selesai (termasuk yang sedang berlangsung), urut terdekat dulu.
// when=past: sudah selesai, urut terbaru dulu. when=all: semua, urut terbaru dulu.
export function eventFilter(when, now = new Date()) {
  if (when === 'upcoming') return { $or: [{ startAt: { $gte: now } }, { endAt: { $gte: now } }] };
  if (when === 'past') return { startAt: { $lt: now }, $or: [{ endAt: null }, { endAt: { $lt: now } }] };
  return {};
}

export async function events(req, res) {
  const when = ['upcoming', 'past'].includes(req.query.when) ? req.query.when : 'all';
  const filter = {
    ...PUBLISHED,
    $and: [eventFilter(when), searchFilter(['title', 'location'], req.query.q)],
  };
  const sort = when === 'upcoming' ? { startAt: 1 } : { startAt: -1 };
  res.json(await paged(Event, filter, sort, req.query, HIDDEN));
}

export async function event(req, res) {
  const item = await Event.findOne({ ...PUBLISHED, ...byIdOrSlug(req.params.id) }, HIDDEN).lean();
  if (!item) throw notFound('Acara tidak ditemukan');
  res.json(item);
}

export async function faqs(_req, res) {
  // ponytail: FAQ dikirim sekaligus (maks. 500) agar pencarian di aplikasi instan & bisa offline.
  // Tambahkan pagination bila FAQ mendekati ratusan.
  const items = await Faq.find(PUBLISHED, HIDDEN).sort({ category: 1, order: 1 }).limit(500).lean();
  res.json({ items });
}
