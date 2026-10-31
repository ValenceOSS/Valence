import { afterEach, describe, expect, it, vi } from 'vitest';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { fetchPushDelivery } from '@ValenceClient/notifications/fetchPushDelivery';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchPushDelivery', () => {
  it('reads what a push woke the phone to say', async () => {
    const delivery = {
      event: 'requests.available',
      title: sayVerbatim('Ready to watch'),
      body: sayVerbatim('A Minecraft Movie'),
      link: null,
    };

    vi.stubGlobal('fetch', () => Promise.resolve(Response.json(delivery)));

    expect(await fetchPushDelivery('d')).toEqual(delivery);
  });

  it('answers nothing where the delivery is gone or not this phone’s', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(null, { status: 404 })));

    expect(await fetchPushDelivery('d')).toBeNull();
  });
});
