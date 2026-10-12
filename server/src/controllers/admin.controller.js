import { AuditLog } from '../models/AuditLog.js';
import { ChurchProfile, getProfile } from '../models/ChurchProfile.js';
import { Event } from '../models/content.js';
import { audit } from '../services/audit.service.js';
import { uploadUrl } from '../services/storage.js';
import { badRequest } from '../utils/errors.js';
import { paged } from '../utils/pagination.js';
import { RESOURCES } from './content.controller.js';

export async function dashboard(_req, res) {
  const now = new Date();
  const counts = {};
  const recent = [];
  await Promise.all(
    Object.entries(RESOURCES).map(async ([resource, { model, label }]) => {
      const [total, published, latest] = await Promise.all([
        model.countDocuments(),
        model.countDocuments({ status: 'published' }),
        model.find({}, { [label]: 1, status: 1, updatedAt: 1 }).sort({ updatedAt: -1 }).limit(5).lean(),
      ]);
      counts[resource] = { total, published, draft: total - published };
      recent.push(...latest.map((i) => ({ resource, id: i._id, title: i[label], status: i.status, updatedAt: i.updatedAt })));
    }),
  );
  const upcomingEvents = await Event.find({ startAt: { $gte: now } }, { title: 1, startAt: 1, location: 1, status: 1 })
    .sort({ startAt: 1 })
    .limit(5)
    .lean();
  recent.sort((a, b) => b.updatedAt - a.updatedAt);
  res.json({ counts, upcomingEvents, recentlyUpdated: recent.slice(0, 8) });
}

export async function getChurchProfile(_req, res) {
  res.json(await getProfile());
}

export async function updateChurchProfile(req, res) {
  const before = await getProfile();
  const { socials, ...rest } = req.body;
  // socials digabung per field supaya mengubah satu akun media sosial tidak menghapus yang lain.
  const set = { ...rest, updatedBy: req.user._id };
  for (const [k, v] of Object.entries(socials ?? {})) set[`socials.${k}`] = v;
  const after = await ChurchProfile.findByIdAndUpdate(before._id, { $set: set }, { returnDocument: 'after', runValidators: true }).lean();
  await audit(req, { action: 'update', entity: 'church-profile', entityId: after._id, summary: 'Profil gereja', before, after });
  res.json(after);
}

export async function auditLogs(req, res) {
  const filter = req.query.entity ? { entity: String(req.query.entity) } : {};
  res.json(await paged(AuditLog, filter, { createdAt: -1 }, req.query));
}

export async function upload(req, res) {
  if (!req.file) throw badRequest('Pilih gambar terlebih dahulu');
  const url = uploadUrl(req.file.filename);
  await audit(req, { action: 'upload', entity: 'uploads', entityId: req.file.filename, summary: url });
  res.status(201).json({ url });
}
