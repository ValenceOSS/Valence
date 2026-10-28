import { describe, expect, it, vi } from 'vitest';
import { fetchPosterAttachment } from './fetchPosterAttachment';
import type { PosterRequest } from './fetchPosterAttachment';

const POSTER = 'https://93.184.215.14/poster.jpg';

const answering = (
  body: ConstructorParameters<typeof Response>[0],
  init: ConstructorParameters<typeof Response>[1],
): PosterRequest => vi.fn<PosterRequest>().mockResolvedValue(new Response(body, init));

describe('fetchPosterAttachment', () => {
  it('fetches a poster as base64, with its type', async () => {
    const request = answering(new Uint8Array([1, 2, 3]), {
      headers: { 'content-type': 'image/jpeg; charset=binary' },
    });

    expect(await fetchPosterAttachment(POSTER, request)).toStrictEqual({
      base64: 'AQID',
      type: 'image/jpeg',
    });
    expect(request).toHaveBeenCalledWith(POSTER, expect.objectContaining({ redirect: 'manual' }));
  });

  it('fetches nothing where there is no poster', async () => {
    const request = answering(null, {});

    expect(await fetchPosterAttachment(null, request)).toBeNull();
    expect(request).not.toHaveBeenCalled();
  });

  it('never fetches from an address a webhook could not be sent to', async () => {
    const request = answering(null, {});

    expect(await fetchPosterAttachment('http://169.254.169.254/latest', request)).toBeNull();
    expect(request).not.toHaveBeenCalled();
  });

  it('passes over an answer that is not a picture', async () => {
    expect(
      await fetchPosterAttachment(
        POSTER,
        answering('<html></html>', { headers: { 'content-type': 'text/html' } }),
      ),
    ).toBeNull();
  });

  it('passes over a refusal or a redirect', async () => {
    expect(
      await fetchPosterAttachment(
        POSTER,
        answering(null, { status: 302, headers: { location: 'http://10.0.0.1/' } }),
      ),
    ).toBeNull();
  });

  it('passes over a poster larger than Pushover takes', async () => {
    expect(
      await fetchPosterAttachment(
        POSTER,
        answering(new Uint8Array(5_242_881), { headers: { 'content-type': 'image/png' } }),
      ),
    ).toBeNull();
  });

  it('passes over a host that cannot be reached', async () => {
    expect(
      await fetchPosterAttachment(
        POSTER,
        vi.fn<PosterRequest>().mockRejectedValue(new Error('timeout')),
      ),
    ).toBeNull();
  });
});
