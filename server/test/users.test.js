import { PASSWORD, api, auth, loginAs, reset, start, stop } from './helpers.js';
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { User } from '../src/models/User.js';

before(start);
after(stop);
beforeEach(reset);

const newUser = (i) => ({ name: `Pengelola ${i}`, email: `p${i}@test.local`, role: 'sekretariat' });

describe('manajemen akun', () => {
  it('hanya super admin yang bisa mengelola akun; akun baru tidak pernah super admin', async () => {
    const sek = await loginAs('sekretariat');
    assert.equal((await api().post('/api/admin/users').set(auth(sek.token)).send(newUser(1))).status, 403);

    const admin = await loginAs('sekretariat', { isSuperAdmin: true });
    const res = await api().post('/api/admin/users').set(auth(admin.token)).send({ ...newUser(2), isSuperAdmin: true });
    assert.equal(res.status, 201);
    assert.ok(res.body.tempPassword);
    assert.equal(res.body.user.isSuperAdmin, false);
    assert.equal(res.body.user.mustChangePassword, true);
    assert.equal(res.body.user.passwordHash, undefined);

    const login = await api().post('/api/auth/login').send({ email: 'p2@test.local', password: res.body.tempPassword });
    assert.equal(login.status, 200);
  });

  it('maksimal 15 akun aktif, termasuk saat dibuat bersamaan', async () => {
    const admin = await loginAs('sekretariat', { isSuperAdmin: true }); // kursi 1
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) => api().post('/api/admin/users').set(auth(admin.token)).send(newUser(i))),
    );
    const created = results.filter((r) => r.status === 201).length;
    assert.equal(created, 14);
    assert.ok(results.filter((r) => r.status !== 201).every((r) => r.status === 409));
    assert.equal(await User.countDocuments({ isActive: true }), 15);
    const seats = (await User.find({ isActive: true }).lean()).map((u) => u.seat);
    assert.equal(new Set(seats).size, 15);
  });

  it('menonaktifkan akun melepas kursi, mencabut sesi, dan memblokir token', async () => {
    const admin = await loginAs('sekretariat', { isSuperAdmin: true });
    const target = await loginAs('majelis');
    const res = await api().patch(`/api/admin/users/${target.user.id}`).set(auth(admin.token)).send({ isActive: false });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.seat, undefined);
    assert.equal((await api().get('/api/admin/dashboard').set(auth(target.token))).status, 401);
    assert.equal((await api().post('/api/auth/refresh').send({ refreshToken: target.refreshToken })).status, 401);
    const login = await api().post('/api/auth/login').send({ email: target.user.email, password: PASSWORD });
    assert.equal(login.status, 401);

    const back = await api().patch(`/api/admin/users/${target.user.id}`).set(auth(admin.token)).send({ isActive: true });
    assert.equal(back.status, 200);
    assert.ok(back.body.user.seat >= 1);
  });

  it('reset sandi memberi sandi sementara dan mencabut sesi lama', async () => {
    const admin = await loginAs('sekretariat', { isSuperAdmin: true });
    const target = await loginAs('majelis');
    const res = await api().post(`/api/admin/users/${target.user.id}/reset-password`).set(auth(admin.token));
    assert.equal(res.status, 200);
    assert.equal((await api().post('/api/auth/refresh').send({ refreshToken: target.refreshToken })).status, 401);
    const login = await api().post('/api/auth/login').send({ email: target.user.email, password: res.body.tempPassword });
    assert.equal(login.body.user.mustChangePassword, true);
  });

  it('tidak bisa menonaktifkan diri sendiri', async () => {
    const admin = await loginAs('sekretariat', { isSuperAdmin: true });
    const res = await api().patch(`/api/admin/users/${admin.user.id}`).set(auth(admin.token)).send({ isActive: false });
    assert.equal(res.status, 400);
  });
});
