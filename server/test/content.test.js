import { api, auth, loginAs, reset, start, stop } from './helpers.js';
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { AuditLog } from '../src/models/AuditLog.js';

before(start);
after(stop);
beforeEach(reset);

const day = 86_400_000;
const iso = (days) => new Date(Date.now() + days * day).toISOString();

describe('konten', () => {
  it('CRUD acara oleh sekretariat, tercatat di audit log', async () => {
    const { token } = await loginAs('sekretariat');
    const created = await api().post('/api/admin/events').set(auth(token))
      .send({ title: 'Ibadah Contoh', startAt: iso(2), location: 'Aula' });
    assert.equal(created.status, 201);
    assert.equal(created.body.status, 'draft');
    assert.match(created.body.slug, /^ibadah-contoh-/);
    const id = created.body._id;

    const updated = await api().put(`/api/admin/events/${id}`).set(auth(token))
      .send({ title: 'Ibadah Contoh 2', startAt: iso(2) });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.title, 'Ibadah Contoh 2');

    assert.equal((await api().get(`/api/admin/events/${id}`).set(auth(token))).status, 200);
    assert.equal((await api().delete(`/api/admin/events/${id}`).set(auth(token))).status, 204);
    assert.equal((await api().get(`/api/admin/events/${id}`).set(auth(token))).status, 404);

    const actions = (await AuditLog.find({ entity: 'events' }).lean()).map((l) => l.action).sort();
    assert.deepEqual(actions, ['create', 'delete', 'update']);
    const upd = await AuditLog.findOne({ action: 'update' }).lean();
    assert.equal(upd.changes.after.title, 'Ibadah Contoh 2');
  });

  it('validasi input konten', async () => {
    const { token } = await loginAs('sekretariat');
    const noTitle = await api().post('/api/admin/events').set(auth(token)).send({ startAt: iso(1) });
    assert.equal(noTitle.status, 400);
    const badRange = await api().post('/api/admin/events').set(auth(token))
      .send({ title: 'x', startAt: iso(2), endAt: iso(1) });
    assert.equal(badRange.status, 400);
    const badImage = await api().post('/api/admin/faqs').set(auth(token))
      .send({ question: 'q', answer: 'a', imageUrl: 'javascript:alert(1)' });
    assert.equal(badImage.status, 201, 'field asing dibuang, bukan disimpan');
    assert.equal(badImage.body.imageUrl, undefined);
    const unknown = await api().post('/api/admin/users-hack').set(auth(token)).send({});
    assert.equal(unknown.status, 404);
  });

  it('majelis bisa publikasi tetapi tidak bisa membuat, mengubah, atau menghapus', async () => {
    const sek = await loginAs('sekretariat');
    const maj = await loginAs('majelis');
    const faq = await api().post('/api/admin/faqs').set(auth(sek.token)).send({ question: 'Q?', answer: 'A' });

    assert.equal((await api().post('/api/admin/faqs').set(auth(maj.token)).send({ question: 'Q', answer: 'A' })).status, 403);
    assert.equal((await api().put(`/api/admin/faqs/${faq.body._id}`).set(auth(maj.token)).send({ question: 'Q', answer: 'B' })).status, 403);
    assert.equal((await api().delete(`/api/admin/faqs/${faq.body._id}`).set(auth(maj.token))).status, 403);
    assert.equal((await api().put('/api/admin/church-profile').set(auth(maj.token)).send({ address: 'x' })).status, 403);
    assert.equal((await api().get('/api/admin/users').set(auth(maj.token))).status, 403);

    const pub = await api().patch(`/api/admin/faqs/${faq.body._id}/status`).set(auth(maj.token)).send({ status: 'published' });
    assert.equal(pub.status, 200);
    assert.equal(pub.body.status, 'published');
  });

  it('draft tidak tampil di API publik', async () => {
    const { token } = await loginAs('sekretariat');
    const draft = await api().post('/api/admin/commissions').set(auth(token)).send({ name: 'Komisi Draft' });
    await api().post('/api/admin/commissions').set(auth(token)).send({ name: 'Komisi Tayang', status: 'published' });

    const list = await api().get('/api/public/commissions');
    assert.equal(list.status, 200);
    assert.deepEqual(list.body.items.map((c) => c.name), ['Komisi Tayang']);
    assert.equal(list.body.items[0].createdBy, undefined);
    assert.equal((await api().get(`/api/public/commissions/${draft.body._id}`)).status, 404);
    assert.equal((await api().get(`/api/public/commissions/${draft.body.slug}`)).status, 404);
  });

  it('filter acara publik: mendatang, selesai, semua, dan pencarian', async () => {
    const { token } = await loginAs('sekretariat');
    const mk = (title, startAt, endAt) =>
      api().post('/api/admin/events').set(auth(token)).send({ title, startAt, endAt, status: 'published' });
    await mk('Besok', iso(1));
    await mk('Minggu Depan', iso(7));
    await mk('Kemarin', iso(-1));
    await mk('Sedang Berlangsung', iso(-1), iso(1));

    const titles = async (q) => (await api().get(`/api/public/events?${q}`)).body.items.map((e) => e.title);
    assert.deepEqual(await titles('when=upcoming'), ['Sedang Berlangsung', 'Besok', 'Minggu Depan']);
    assert.deepEqual(await titles('when=past'), ['Kemarin']);
    assert.equal((await titles('when=all')).length, 4);
    assert.deepEqual(await titles('when=all&q=minggu'), ['Minggu Depan']);

    const page = await api().get('/api/public/events?when=all&limit=2&page=2');
    assert.equal(page.body.items.length, 2);
    assert.equal(page.body.hasMore, false);
  });

  it('FAQ publik dan sejarah publik hanya berisi yang tayang', async () => {
    const { token } = await loginAs('sekretariat');
    await api().post('/api/admin/faqs').set(auth(token)).send({ question: 'Tayang?', answer: 'Ya', status: 'published' });
    await api().post('/api/admin/faqs').set(auth(token)).send({ question: 'Draft?', answer: 'Ya' });
    await api().post('/api/admin/church-history').set(auth(token)).send({ year: '2000', title: 'Awal', status: 'published' });
    await api().put('/api/admin/church-profile').set(auth(token)).send({ historyIntro: 'Pengantar' });

    const faqs = await api().get('/api/public/faqs');
    assert.deepEqual(faqs.body.items.map((f) => f.question), ['Tayang?']);
    const history = await api().get('/api/public/church-history');
    assert.equal(history.body.intro, 'Pengantar');
    assert.equal(history.body.items.length, 1);
  });

  it('profil gereja: socials digabung, URL tidak valid ditolak', async () => {
    const { token } = await loginAs('sekretariat');
    await api().put('/api/admin/church-profile').set(auth(token)).send({ socials: { instagram: 'https://instagram.com/x' } });
    await api().put('/api/admin/church-profile').set(auth(token)).send({ socials: { youtube: 'https://youtube.com/y' } });
    const p = await api().get('/api/public/church-profile');
    assert.equal(p.body.socials.instagram, 'https://instagram.com/x');
    assert.equal(p.body.socials.youtube, 'https://youtube.com/y');
    assert.equal(p.body.updatedBy, undefined);
    const bad = await api().put('/api/admin/church-profile').set(auth(token)).send({ website: 'ftp://x' });
    assert.equal(bad.status, 400);
  });

  it('tanpa izin publikasi, konten yang sudah tayang tidak bisa diubah', async () => {
    const { ROLE_PERMISSIONS } = await import('../src/config/permissions.js');
    const original = ROLE_PERMISSIONS.sekretariat;
    ROLE_PERMISSIONS.sekretariat = original.filter((p) => p !== 'content:publish');
    try {
      const sek = await loginAs('sekretariat');
      const maj = await loginAs('majelis');
      const draft = await api().post('/api/admin/faqs').set(auth(sek.token)).send({ question: 'Q', answer: 'A' });
      assert.equal(draft.status, 201);
      const direct = await api().post('/api/admin/faqs').set(auth(sek.token)).send({ question: 'Q', answer: 'A', status: 'published' });
      assert.equal(direct.status, 403);
      await api().patch(`/api/admin/faqs/${draft.body._id}/status`).set(auth(maj.token)).send({ status: 'published' });
      const edit = await api().put(`/api/admin/faqs/${draft.body._id}`).set(auth(sek.token)).send({ question: 'Q2', answer: 'A' });
      assert.equal(edit.status, 403);
    } finally {
      ROLE_PERMISSIONS.sekretariat = original;
    }
  });

  it('unggah gambar menerima JPG/PNG/WebP saja', async () => {
    const { token } = await loginAs('sekretariat');
    const png = Buffer.from('89504e470d0a1a0a', 'hex');
    const ok = await api().post('/api/admin/uploads').set(auth(token)).attach('image', png, { filename: 'a.png', contentType: 'image/png' });
    assert.equal(ok.status, 201);
    assert.match(ok.body.url, /^\/uploads\/.+\.png$/);
    assert.equal((await api().get(ok.body.url)).status, 200);
    const bad = await api().post('/api/admin/uploads').set(auth(token)).attach('image', Buffer.from('<html>'), { filename: 'a.html', contentType: 'text/html' });
    assert.equal(bad.status, 400);
  });
});
