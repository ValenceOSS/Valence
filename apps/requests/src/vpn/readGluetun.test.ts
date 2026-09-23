import { describe, expect, it, vi } from 'vitest';
import { readGluetun } from './readGluetun';

const NOW = new Date('2026-09-19T12:00:00.000Z');

/**
 * Answers as gluetun would, one reply per address asked.
 */
const gluetun = (replies: Record<string, { status: number; body: object }>) =>
  vi.fn((url: string) => {
    const reply = Object.entries(replies).find(([ending]) => url.endsWith(ending))?.[1];

    return reply === undefined
      ? Promise.reject(new Error('connect ECONNREFUSED'))
      : Promise.resolve(new Response(JSON.stringify(reply.body), { status: reply.status }));
  });

describe('readGluetun', () => {
  it('says there is no VPN where none was set up, without asking anything', async () => {
    const fetch = gluetun({});

    expect(await readGluetun({ address: '', apiKey: '', fetch })).toEqual({
      isConfigured: false,
      isUp: null,
      publicAddress: null,
      country: null,
      checkedAt: null,
      problem: null,
      problemCode: null,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reads a running tunnel and where traffic leaves from', async () => {
    const fetch = gluetun({
      '/v1/vpn/status': { status: 200, body: { status: 'running' } },
      '/v1/publicip/ip': {
        status: 200,
        body: { public_ip: '203.0.113.7', country: 'Netherlands' },
      },
    });

    expect(
      await readGluetun({ address: 'http://gluetun:8000', apiKey: '', fetch, now: () => NOW }),
    ).toEqual({
      isConfigured: true,
      isUp: true,
      publicAddress: '203.0.113.7',
      country: 'Netherlands',
      checkedAt: NOW.toISOString(),
      problem: null,
      problemCode: null,
    });
  });

  it('still reads the tunnel as up when gluetun has not yet learned its address', async () => {
    const fetch = gluetun({
      '/v1/vpn/status': { status: 200, body: { status: 'running' } },
      '/v1/publicip/ip': { status: 200, body: { public_ip: '' } },
    });

    const vpn = await readGluetun({ address: 'http://gluetun:8000', apiKey: '', fetch });

    expect(vpn.isUp).toBe(true);
    expect(vpn.publicAddress).toBeNull();
    expect(vpn.country).toBeNull();
  });

  it('still reads the tunnel as up when asking where it leaves from fails', async () => {
    const fetch = gluetun({
      '/v1/vpn/status': { status: 200, body: { status: 'running' } },
      '/v1/publicip/ip': { status: 500, body: {} },
    });

    const vpn = await readGluetun({ address: 'http://gluetun:8000', apiKey: '', fetch });

    expect(vpn.isUp).toBe(true);
    expect(vpn.publicAddress).toBeNull();
  });

  it('hands gluetun its key where it has one', async () => {
    const fetch = gluetun({ '/v1/vpn/status': { status: 200, body: { status: 'stopped' } } });

    await readGluetun({ address: 'http://gluetun:8000', apiKey: 'a-key', fetch });

    expect(fetch).toHaveBeenCalledWith(
      'http://gluetun:8000/v1/vpn/status',
      expect.objectContaining({ headers: { 'X-API-Key': 'a-key' } }),
    );
  });

  it('reads a stopped tunnel as down, saying so', async () => {
    const fetch = gluetun({ '/v1/vpn/status': { status: 200, body: { status: 'stopped' } } });

    const vpn = await readGluetun({ address: 'http://gluetun:8000', apiKey: '', fetch });

    expect(vpn.isUp).toBe(false);
    expect(vpn.problem).toBe('The tunnel is stopped');
    expect(vpn.problemCode).toBe('VpnDown');
  });

  it('names the key when gluetun refuses the question', async () => {
    const fetch = gluetun({ '/v1/vpn/status': { status: 401, body: {} } });

    const vpn = await readGluetun({ address: 'http://gluetun:8000', apiKey: '', fetch });

    expect(vpn.problem).toBe('gluetun refused the question; check VPN_API_KEY');
    expect(vpn.problemCode).toBe('VpnKeyRefused');
  });

  it('reads any other failed answer as down', async () => {
    const fetch = gluetun({ '/v1/vpn/status': { status: 502, body: {} } });

    expect((await readGluetun({ address: 'http://gluetun:8000', apiKey: '', fetch })).problem).toBe(
      'gluetun answered 502',
    );
  });

  it('reads an answer that is not a status as down', async () => {
    const fetch = gluetun({ '/v1/vpn/status': { status: 200, body: { tunnel: 'maybe' } } });

    expect((await readGluetun({ address: 'http://gluetun:8000', apiKey: '', fetch })).problem).toBe(
      'gluetun answered something that was not a status',
    );
  });

  it('reads a gluetun that cannot be reached as down', async () => {
    const vpn = await readGluetun({
      address: 'http://gluetun:8000',
      apiKey: '',
      fetch: gluetun({}),
    });

    expect(vpn).toMatchObject({
      isConfigured: true,
      isUp: false,
      problem: 'gluetun could not be reached at http://gluetun:8000',
      problemCode: 'VpnDown',
    });
  });
});
