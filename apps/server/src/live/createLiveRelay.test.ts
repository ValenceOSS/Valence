import { describe, expect, it } from 'vitest';
import { createLiveRelay } from './createLiveRelay';

const ASKING = { userAgent: null, referrer: null };

const queryOf = (link: string) => {
  const found = new URL(link, 'https://valence.test').searchParams;

  return {
    u: found.get('u') ?? undefined,
    e: found.get('e') ?? undefined,
    s: found.get('s') ?? undefined,
  };
};

const providerSending =
  (type: string): typeof fetch =>
  () =>
    Promise.resolve(
      new Response('<script>alert(1)</script>', { headers: { 'content-type': type } }),
    );

describe('createLiveRelay', () => {
  it('sends a segment with the media type a provider gave it', async () => {
    const relay = createLiveRelay();
    const link = relay.linkFor('news', 'https://provider.test/seg1.ts');
    const answered = await relay.answer(
      'news',
      queryOf(link),
      ASKING,
      providerSending('video/mp2t'),
    );

    expect(answered?.headers.get('content-type')).toBe('video/mp2t');
  });

  it('never sends a provider’s page as a page from this origin', async () => {
    const relay = createLiveRelay();
    const link = relay.linkFor('news', 'https://provider.test/seg1.ts');
    const answered = await relay.answer(
      'news',
      queryOf(link),
      ASKING,
      providerSending('text/html'),
    );

    expect(answered?.headers.get('content-type')).toBe('video/mp2t');
    expect(answered?.headers.get('content-security-policy')).toBe('sandbox');
    expect(answered?.headers.get('content-disposition')).toBe('attachment');
  });
});
