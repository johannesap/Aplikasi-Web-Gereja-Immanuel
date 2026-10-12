// Atur hak akses setiap role di sini. Server memeriksa izin ini pada setiap endpoint admin.
// Contoh alur tinjauan: hapus 'content:publish' dari sekretariat agar hanya Majelis yang bisa mempublikasikan.
export const ROLES = ['majelis', 'sekretariat'];

export const ALL_PERMISSIONS = [
  'content:read', // melihat area pengelola, termasuk draft
  'content:edit', // tambah/ubah draft
  'content:publish', // publikasi, tarik publikasi, ubah konten yang sudah tayang
  'content:delete',
  'profile:edit',
  'upload',
  'audit:read',
  'users:manage', // hanya super admin secara bawaan
];

export const ROLE_PERMISSIONS = {
  sekretariat: ['content:read', 'content:edit', 'content:publish', 'content:delete', 'profile:edit', 'upload', 'audit:read'],
  majelis: ['content:read', 'content:publish', 'audit:read'],
};

export function permissionsFor(user) {
  if (user.isSuperAdmin) return [...ALL_PERMISSIONS];
  return ROLE_PERMISSIONS[user.role] ?? [];
}
