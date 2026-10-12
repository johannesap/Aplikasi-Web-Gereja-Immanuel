import { PASSWORD, api, auth, loginAs, reset, start, stop } from './helpers.js';
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { User } from '../src/models/User.js';
import { hashPassword } from '../src/services/auth.service.js';

before(start);
after(stop);
beforeEach(reset);

describe('auth', () => {
  it('login berhasil tidak membocorkan password hash', async () => {
    const { user } = await loginAs('sekretariat');
    const res = await api().post('/api/auth/login').send({ email: user.email, password: PASSWORD });
    assert.equal(res.status, 200);
    assert.ok(res.body.accessToken && res.body.refreshToken);
    assert.equal(res.body.user.passwordHash, undefined);
    assert.ok(res.body.user.permissions.includes('content:edit'));
  });

  it('kata sandi salah ditolak dan akun terkunci setelah 5 kali', async () => {
    const { user } = await loginAs('majelis');
    for (let i = 0; i < 5; i++) {
      const res = await api().post('/api/auth/login').send({ email: user.email, password: 'salah-salah-1' });
      assert.equal(res.status, 401);
    }
    const locked = await api().post('/api/auth/login').send({ email: user.email, password: PASSWORD });
    assert.equal(locked.status, 429);
  });

  it('validasi input login', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'bukan-email', password: '' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error.message);
  });

  it('tidak ada endpoint registrasi publik', async () => {
    const res = await api().post('/api/auth/register').send({ email: 'a@b.c', password: PASSWORD });
    assert.equal(res.status, 404);
  });

  it('refresh token dirotasi dan hanya bisa dipakai sekali', async () => {
    const { refreshToken } = await loginAs('sekretariat');
    const first = await api().post('/api/auth/refresh').send({ refreshToken });
    assert.equal(first.status, 200);
    assert.notEqual(first.body.refreshToken, refreshToken);
    const reused = await api().post('/api/auth/refresh').send({ refreshToken });
    assert.equal(reused.status, 401);
  });

  it('logout mencabut refresh token', async () => {
    const { refreshToken } = await loginAs('sekretariat');
    assert.equal((await api().post('/api/auth/logout').send({ refreshToken })).status, 204);
    assert.equal((await api().post('/api/auth/refresh').send({ refreshToken })).status, 401);
  });

  it('akun dengan sandi sementara wajib ganti sandi sebelum memakai admin API', async () => {
    const email = 'baru@test.local';
    await User.create({ name: 'Baru', email, role: 'sekretariat', passwordHash: await hashPassword(PASSWORD), seat: 1 });
    const login = await api().post('/api/auth/login').send({ email, password: PASSWORD });
    assert.equal(login.body.user.mustChangePassword, true);
    const blocked = await api().get('/api/admin/dashboard').set(auth(login.body.accessToken));
    assert.equal(blocked.status, 403);

    const weak = await api().post('/api/auth/change-password').set(auth(login.body.accessToken))
      .send({ currentPassword: PASSWORD, newPassword: 'pendek' });
    assert.equal(weak.status, 400);

    const changed = await api().post('/api/auth/change-password').set(auth(login.body.accessToken))
      .send({ currentPassword: PASSWORD, newPassword: 'SandiBaru2026' });
    assert.equal(changed.status, 200);
    const ok = await api().get('/api/admin/dashboard').set(auth(changed.body.accessToken));
    assert.equal(ok.status, 200);
    // Refresh token lama ikut dicabut.
    assert.equal((await api().post('/api/auth/refresh').send({ refreshToken: login.body.refreshToken })).status, 401);
  });

  it('akses admin tanpa token atau dengan token palsu ditolak', async () => {
    assert.equal((await api().get('/api/admin/dashboard')).status, 401);
    assert.equal((await api().post('/api/admin/events').send({ title: 'x' })).status, 401);
    assert.equal((await api().get('/api/admin/dashboard').set(auth('palsu.token.x'))).status, 401);
  });
});
