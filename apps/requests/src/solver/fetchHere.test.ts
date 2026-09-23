import { afterEach, describe, expect, it, vi } from 'vitest';
import { PageAnswerSchema } from '@ValenceRequests/solver/PageAnswerSchema';
import { fetchHere } from './fetchHere';

/**
 * Stands in for the browser's FileReader, reading a blob into a data URL or failing to.
 *
 * @param fails - Whether reading fails.
 * @returns A FileReader class.
 */
const aFileReader = (fails = false) =>
  class {
    public result: string | null = null;

    public onload: (() => void) | null = null;

    public onerror: (() => void) | null = null;

    public readAsDataURL(blob: Blob): void {
      void blob.arrayBuffer().then((buffer) => {
        if (fails) {
          this.onerror?.();

          return;
        }

        this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`;
        this.onload?.();
      });
    }
  };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchHere', () => {
  it('asks with the site’s cookies and says what came back', async () => {
    const fetch = vi.fn(() =>
      Promise.resolve(
        new Response('<p>hi</p>', { status: 200, headers: { 'content-type': 'text/html' } }),
      ),
    );

    vi.stubGlobal('fetch', fetch);
    vi.stubGlobal('FileReader', aFileReader());

    const answer = PageAnswerSchema.parse(
      JSON.parse(
        await fetchHere({ url: 'https://example.org/', method: 'GET', body: null, headers: {} }),
      ),
    );

    expect(fetch).toHaveBeenCalledWith('https://example.org/', {
      method: 'GET',
      headers: {},
      credentials: 'include',
      redirect: 'follow',
    });
    expect(answer).toMatchObject({ status: 200, headers: { 'content-type': 'text/html' } });
    expect(answer.dataUrl).toBe(
      `data:text/html;base64,${Buffer.from('<p>hi</p>').toString('base64')}`,
    );
  });

  it('sends a body where there is one', async () => {
    const fetch = vi.fn(() => Promise.resolve(new Response('')));

    vi.stubGlobal('fetch', fetch);
    vi.stubGlobal('FileReader', aFileReader());

    await fetchHere({
      url: 'https://example.org/login',
      method: 'POST',
      body: 'user=a',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.org/login',
      expect.objectContaining({ method: 'POST', body: 'user=a' }),
    );
  });

  it('fails where the answer cannot be read', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('x')));
    vi.stubGlobal('FileReader', aFileReader(true));

    await expect(
      fetchHere({ url: 'https://example.org/', method: 'GET', body: null, headers: {} }),
    ).rejects.toThrow('The answer could not be read');
  });
});
