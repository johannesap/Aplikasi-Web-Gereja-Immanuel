const store: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (k: string) => store[k] ?? null),
  setItemAsync: jest.fn(async (k: string, v: string) => {
    store[k] = v;
  }),
  deleteItemAsync: jest.fn(async (k: string) => {
    delete store[k];
  }),
}));

import { api, ApiError, NETWORK_ERROR, saveSession, setSessionEndedHandler } from '../api';

const json = (status: number, body: unknown) =>
  Promise.resolve({ ok: status < 400, status, json: async () => body } as Response);

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

beforeEach(() => {
  fetchMock.mockReset();
  for (const k of Object.keys(store)) delete store[k];
});

const user = { _id: 'u1', name: 'A', email: 'a@b.c', role: 'sekretariat', isSuperAdmin: false, isActive: true, mustChangePassword: false };

describe('klien API', () => {
  it('kegagalan jaringan menjadi ApiError status 0 dengan pesan ramah', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(api('/api/public/faqs')).rejects.toMatchObject({ status: 0, message: NETWORK_ERROR });
  });

  it('pesan error dari server diteruskan', async () => {
    fetchMock.mockReturnValueOnce(json(404, { error: { message: 'Acara tidak ditemukan' } }));
    const request = api('/api/public/events/x');
    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({ status: 404, message: 'Acara tidak ditemukan' });
  });

  it('request publik tidak pernah mengirim token', async () => {
    await saveSession({ accessToken: 'AT', refreshToken: 'RT', user: user as any });
    fetchMock.mockReturnValueOnce(json(200, { items: [] }));
    await api('/api/public/faqs');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('token kedaluwarsa diperbarui sekali lalu request diulang', async () => {
    await saveSession({ accessToken: 'OLD', refreshToken: 'RT1', user: user as any });
    fetchMock
      .mockReturnValueOnce(json(401, { error: { message: 'Sesi berakhir' } }))
      .mockReturnValueOnce(json(200, { accessToken: 'NEW', refreshToken: 'RT2', user }))
      .mockReturnValueOnce(json(200, { ok: true }));

    await expect(api('/api/admin/dashboard', { auth: true })).resolves.toEqual({ ok: true });
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer NEW');
    expect(store['pouk.refreshToken']).toBe('RT2');
  });

  it('refresh ditolak: sesi dihapus dan aplikasi diberi tahu', async () => {
    const ended = jest.fn();
    setSessionEndedHandler(ended);
    await saveSession({ accessToken: 'OLD', refreshToken: 'RT1', user: user as any });
    fetchMock
      .mockReturnValueOnce(json(401, { error: { message: 'Sesi berakhir' } }))
      .mockReturnValueOnce(json(401, { error: { message: 'Sesi berakhir' } }));

    await expect(api('/api/admin/dashboard', { auth: true })).rejects.toMatchObject({ status: 401 });
    expect(ended).toHaveBeenCalled();
    expect(store['pouk.refreshToken']).toBeUndefined();
  });
});
