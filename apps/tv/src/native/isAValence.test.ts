import { isAValence } from '@ValenceTv/native/isAValence';

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
  jest.useRealTimers();
});

describe('isAValence', () => {
  it('asks the address for its health and says whether it answered', async () => {
    const asked = jest.fn(() => Promise.resolve(new Response('{}', { status: 200 })));

    globalThis.fetch = asked;

    await expect(isAValence('http://tv.local:3000')).resolves.toBe(true);
    expect(asked).toHaveBeenCalledWith(
      'http://tv.local:3000/api/health',
      expect.objectContaining({ headers: { accept: 'application/json' } }),
    );
  });

  it('says no where the address refuses', async () => {
    globalThis.fetch = jest.fn(() => Promise.resolve(new Response('', { status: 404 })));

    await expect(isAValence('http://tv.local')).resolves.toBe(false);
  });

  it('says no where nothing can be reached', async () => {
    globalThis.fetch = jest.fn(() => Promise.reject(new Error('offline')));

    await expect(isAValence('http://tv.local')).resolves.toBe(false);
  });

  it('gives up after a few seconds of silence', async () => {
    jest.useFakeTimers();
    globalThis.fetch = jest.fn(
      (_: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new Error('aborted'));
          });
        }),
    );

    const answer = isAValence('http://tv.local');

    jest.advanceTimersByTime(3000);

    await expect(answer).resolves.toBe(false);
  });
});
