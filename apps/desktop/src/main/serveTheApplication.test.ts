import { describe, expect, it, vi } from 'vitest';

const { fetch, handle } = vi.hoisted(() => ({
  fetch: vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(),
  handle: vi.fn<(scheme: string, handler: (request: Request) => Promise<Response>) => void>(),
}));

vi.mock('electron', () => ({
  app: { getAppPath: () => '/app' },
  net: { fetch },
  protocol: { handle, registerSchemesAsPrivileged: vi.fn() },
}));

vi.mock('@ValenceDesktop/main/theServerAddress', () => ({
  theServerAddress: () => 'http://localhost:8420',
}));

const { aSliceOf, askingAs, untilLetGo, serveTheApplication, worthCarrying } =
  await import('./serveTheApplication');

const SERVER = 'http://localhost:8420';

describe('worthCarrying', () => {
  it('passes on what the page meant', () => {
    const sent = worthCarrying(
      new Headers({ accept: 'application/json', 'content-type': 'application/json' }),
    );

    expect(sent).toEqual({ accept: 'application/json', 'content-type': 'application/json' });
  });

  it('leaves behind what the page did not write', () => {
    expect(worthCarrying(new Headers({ 'sec-fetch-mode': 'cors' }))).toEqual({});
  });
});

describe('aSliceOf', () => {
  it('asks for the next slice where the page asked for the rest of the file', () => {
    expect(aSliceOf('bytes=100-')).toBe('bytes=100-2097251');
  });

  it('leaves a range that already has an end alone', () => {
    expect(aSliceOf('bytes=0-499')).toBe('bytes=0-499');
  });

  it('asks for nothing where nothing was asked', () => {
    expect(aSliceOf(undefined)).toBeUndefined();
  });
});

describe('untilLetGo', () => {
  it('gives up on the server when the page stops reading', async () => {
    const letGo = vi.fn();
    const answer = untilLetGo(new Response(new ReadableStream()), letGo);

    await answer.body?.cancel();

    expect(letGo).toHaveBeenCalledOnce();
  });

  it('passes on everything the server sent', async () => {
    const answer = untilLetGo(new Response('a film', { status: 206 }), vi.fn());

    expect(answer.status).toBe(206);
    await expect(answer.text()).resolves.toBe('a film');
  });

  it('hands an answer with no body back as it came', () => {
    const empty = new Response(null, { status: 204 });

    expect(untilLetGo(empty, vi.fn())).toBe(empty);
  });

  it('keeps the length of a slice, so a video element never takes it for a live stream', () => {
    const answer = untilLetGo(
      new Response('a film', {
        status: 206,
        headers: { 'content-length': '6', 'content-range': 'bytes 0-5/8293883774' },
      }),
      vi.fn(),
    );

    expect(answer.headers.get('content-length')).toBe('6');
    expect(answer.headers.get('content-range')).toBe('bytes 0-5/8293883774');
  });

  it('drops the length of an answer that was unpacked on the way, since it is the packed size', () => {
    const answer = untilLetGo(
      new Response('{"a":1}', {
        headers: { 'content-encoding': 'gzip', 'content-length': '3' },
      }),
      vi.fn(),
    );

    expect(answer.headers.has('content-encoding')).toBe(false);
    expect(answer.headers.has('content-length')).toBe(false);
  });
});

describe('askingAs', () => {
  it('sends the slice rather than the rest of the file', () => {
    expect(askingAs(new Headers({ range: 'bytes=0-' }), SERVER).range).toBe('bytes=0-2097151');
  });

  it('says the request comes from the server it is going to', () => {
    expect(askingAs(new Headers(), SERVER).origin).toBe(SERVER);
  });

  it('does not let the page speak for where the request came from', () => {
    const sent = askingAs(new Headers({ origin: 'valence://app' }), SERVER);

    expect(sent.origin).toBe(SERVER);
  });

  it('still carries what the page meant', () => {
    const sent = askingAs(new Headers({ 'content-type': 'application/json' }), SERVER);

    expect(sent['content-type']).toBe('application/json');
  });

  it('carries which face is watching, which the server reads on every request', () => {
    const sent = askingAs(new Headers({ 'x-valence-profile': 'a-profile' }), SERVER);

    expect(sent['x-valence-profile']).toBe('a-profile');
  });
});

describe('serveTheApplication', () => {
  it('lets go of the server when the page gives up, so an abandoned video request frees its connection', async () => {
    const reach = {
      isReachable: () => true,
      noteReached: vi.fn(),
      noteMissed: vi.fn(),
      whenChanged: () => () => {},
      stop: vi.fn(),
    };

    fetch.mockResolvedValue(new Response('{}'));
    serveTheApplication(reach, '/held');

    const handler = handle.mock.lastCall?.[1];
    const giveUp = new AbortController();

    await handler?.(new Request('valence://app/api/health', { signal: giveUp.signal }));
    giveUp.abort();

    expect(fetch.mock.lastCall?.[1]?.signal?.aborted).toBe(true);
  });
});
