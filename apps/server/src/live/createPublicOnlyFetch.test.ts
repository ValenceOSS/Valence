import { describe, expect, it, vi } from 'vitest';
import { createPublicOnlyFetch } from '@ValenceServer/live/createPublicOnlyFetch';
import { FINAL_ADDRESS } from '@ValenceServer/live/FINAL_ADDRESS';

const resolves =
  (...addresses: string[]) =>
  () =>
    Promise.resolve(addresses);

describe('createPublicOnlyFetch', () => {
  it('fetches a public address', async () => {
    const inner = vi.fn(() => Promise.resolve(new Response('ok')));
    const guarded = createPublicOnlyFetch(inner, resolves('93.184.216.34'));

    await expect((await guarded('http://cdn.example/a.ts')).text()).resolves.toBe('ok');
  });

  it('refuses a private address without sending anything', async () => {
    const inner = vi.fn(() => Promise.resolve(new Response('secret')));
    const guarded = createPublicOnlyFetch(inner, resolves('93.184.216.34'));

    await expect(guarded('http://169.254.169.254/latest/meta-data')).rejects.toThrow();
    await expect(guarded('http://[::1]:8420/api')).rejects.toThrow();
    expect(inner).not.toHaveBeenCalled();
  });

  it('refuses a redirect to a private address', async () => {
    const inner = vi.fn(() =>
      Promise.resolve(
        new Response(null, { status: 302, headers: { location: 'http://10.0.0.5/admin' } }),
      ),
    );
    const guarded = createPublicOnlyFetch(inner, resolves('93.184.216.34'));

    await expect(guarded('http://cdn.example/a.ts')).rejects.toThrow();
    expect(inner).toHaveBeenCalledTimes(1);
  });

  it('refuses a response a proxy reports as coming from a private address', async () => {
    const inner = vi.fn(() =>
      Promise.resolve(new Response('x', { headers: { [FINAL_ADDRESS]: 'http://172.18.0.4/x' } })),
    );
    const guarded = createPublicOnlyFetch(inner, resolves('93.184.216.34'));

    await expect(guarded('http://cdn.example/a.ts')).rejects.toThrow();
  });
});
