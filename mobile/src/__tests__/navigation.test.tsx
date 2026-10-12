jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

import { configure } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';

// Mesin CI/laptop yang sibuk bisa lebih lambat dari batas bawaan 1 detik.
configure({ asyncUtilTimeout: 5000 });

const profile = {
  _id: 'p', name: 'Gereja POUK Immanuel Kopassus', shortDescription: '', description: '', welcomeMessage: '',
  historyIntro: '', logoUrl: '', photoUrl: '', heroImageUrl: '', address: '', phone: '', email: '', website: '',
  mapsUrl: '', socials: {}, additionalInfo: '', updatedAt: '2026-01-01T00:00:00Z',
};

// Server palsu: hanya endpoint publik yang menjawab; tidak ada token sama sekali.
global.fetch = jest.fn(async (url: string) => {
  const body = url.includes('/church-profile')
    ? profile
    : url.includes('/faqs')
      ? { items: [] }
      : { items: [], page: 1, limit: 20, total: 0, hasMore: false };
  return { ok: true, status: 200, json: async () => body } as Response;
}) as unknown as typeof fetch;

const routes = require('path').join(__dirname, '..', 'app');

describe('navigasi publik tanpa login', () => {
  it('Beranda tampil langsung dengan menu utama dan acara', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    expect(await screen.findByText('Acara Mendatang')).toBeTruthy();
    expect(screen.getByLabelText('Profil Gereja')).toBeTruthy();
    expect(screen.getByLabelText('FAQ')).toBeTruthy();
    expect(await screen.findByText('Belum ada acara terjadwal')).toBeTruthy();
  });

  it('Lainnya menawarkan Login Pengelola, bukan memaksa login', async () => {
    await renderRouter(routes, { initialUrl: '/more' });
    expect(await screen.findByText('Login Pengelola')).toBeTruthy();
    expect(screen.getByText('Khusus Majelis dan Sekretariat')).toBeTruthy();
  });

  it('membuka area pengelola tanpa sesi diarahkan ke login', async () => {
    await renderRouter(routes, { initialUrl: '/admin' });
    expect(await screen.findByText('Masuk')).toBeTruthy();
    expect(screen.getByText(/Jemaat tidak perlu login/)).toBeTruthy();
  });
});
