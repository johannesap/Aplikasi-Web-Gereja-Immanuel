import { can } from '../middleware/auth.js';
import { ChurchHistory, Commission, Event, Faq } from '../models/content.js';
import { audit } from '../services/audit.service.js';
import { forbidden, notFound } from '../utils/errors.js';
import { escapeRegex, paged } from '../utils/pagination.js';
import { slugify } from '../utils/slug.js';

// Konfigurasi setiap jenis konten yang dikelola lewat /api/admin/:resource.
export const RESOURCES = {
  'church-history': { model: ChurchHistory, sort: { order: 1, year: 1 }, search: ['title', 'year'], label: 'title' },
  commissions: { model: Commission, sort: { order: 1, name: 1 }, search: ['name'], label: 'name', slugFrom: 'name' },
  events: { model: Event, sort: { startAt: -1 }, search: ['title', 'location'], label: 'title', slugFrom: 'title' },
  faqs: { model: Faq, sort: { category: 1, order: 1 }, search: ['question', 'answer'], label: 'question' },
};

const config = (req) => {
  const cfg = RESOURCES[req.params.resource];
  if (!cfg) throw notFound('Jenis konten tidak dikenal');
  return cfg;
};

// Mengubah konten yang sedang/akan tayang butuh izin publikasi, supaya alur tinjauan bisa ditegakkan.
function assertPublishAllowed(req, currentStatus, nextStatus) {
  if ((currentStatus === 'published' || nextStatus === 'published') && !can(req, 'content:publish')) {
    throw forbidden('Anda tidak memiliki izin mempublikasikan atau mengubah konten yang sudah tayang');
  }
}

export function searchFilter(fields, q) {
  if (!q) return {};
  const re = new RegExp(escapeRegex(String(q).slice(0, 100)), 'i');
  return { $or: fields.map((f) => ({ [f]: re })) };
}

export async function list(req, res) {
  const { model, sort, search } = config(req);
  const filter = searchFilter(search, req.query.q);
  if (req.query.status === 'draft' || req.query.status === 'published') filter.status = req.query.status;
  res.json(await paged(model, filter, sort, req.query));
}

export async function get(req, res) {
  const item = await config(req).model.findById(req.params.id).lean();
  if (!item) throw notFound();
  res.json(item);
}

export async function create(req, res) {
  const { model, slugFrom, label } = config(req);
  const data = { status: 'draft', ...req.body };
  assertPublishAllowed(req, undefined, data.status);
  if (slugFrom) data.slug = slugify(data[slugFrom]);
  const item = await model.create({ ...data, createdBy: req.user._id, updatedBy: req.user._id });
  await audit(req, { action: 'create', entity: req.params.resource, entityId: item._id, summary: item[label], after: item });
  res.status(201).json(item);
}

export async function update(req, res) {
  const { model, label } = config(req);
  const item = await model.findById(req.params.id);
  if (!item) throw notFound();
  assertPublishAllowed(req, item.status, req.body.status);
  const before = item.toObject();
  item.set({ ...req.body, updatedBy: req.user._id });
  await item.save();
  await audit(req, { action: 'update', entity: req.params.resource, entityId: item._id, summary: item[label], before, after: item });
  res.json(item);
}

export async function setStatus(req, res) {
  const { model, label } = config(req);
  const item = await model.findById(req.params.id);
  if (!item) throw notFound();
  const before = item.toObject();
  item.status = req.body.status;
  item.updatedBy = req.user._id;
  await item.save();
  await audit(req, { action: 'status', entity: req.params.resource, entityId: item._id, summary: item[label], before, after: item });
  res.json(item);
}

export async function remove(req, res) {
  const { model, label } = config(req);
  const item = await model.findByIdAndDelete(req.params.id);
  if (!item) throw notFound();
  await audit(req, { action: 'delete', entity: req.params.resource, entityId: item._id, summary: item[label], before: item });
  res.status(204).end();
}
