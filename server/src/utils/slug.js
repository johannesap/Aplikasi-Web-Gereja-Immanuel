import { randomBytes } from 'node:crypto';

export function slugify(text) {
  const base = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  // Akhiran acak supaya slug tetap unik tanpa query tambahan.
  return `${base || 'item'}-${randomBytes(3).toString('hex')}`;
}
