import { AuditLog } from '../models/AuditLog.js';

const IGNORED = new Set(['_id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'passwordHash', '__v']);

const plain = (doc) => (doc?.toObject ? doc.toObject() : doc) ?? undefined;

// Hanya menyimpan field yang berubah, supaya riwayat mudah dibaca dan tidak membengkak.
export function diff(before, after) {
  const b = plain(before) || {};
  const a = plain(after) || {};
  const out = { before: {}, after: {} };
  for (const key of new Set([...Object.keys(b), ...Object.keys(a)])) {
    if (IGNORED.has(key)) continue;
    if (JSON.stringify(b[key]) !== JSON.stringify(a[key])) {
      out.before[key] = b[key];
      out.after[key] = a[key];
    }
  }
  return out;
}

export async function audit(req, { action, entity, entityId, summary = '', before, after, actor }) {
  const user = actor ?? req.user;
  try {
    await AuditLog.create({
      actor: user?._id,
      actorName: user?.name ?? '',
      action,
      entity,
      entityId: entityId?.toString(),
      summary,
      changes: before || after ? diff(before, after) : undefined,
      ip: req.ip,
    });
  } catch (err) {
    // Kegagalan audit tidak boleh membatalkan perubahan yang sudah tersimpan.
    console.error('Gagal menulis audit log', err);
  }
}
