import { get } from '@react-native-cookies/cookies';
import { thePhonesSocket } from './thePhonesSocket';
import { THE_SERVER_ADDRESS } from './THE_SERVER_ADDRESS';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';

const aStore = (address: string): DeviceStore => {
  const held = new Map([[THE_SERVER_ADDRESS, address]]);

  return {
    read: (key) => held.get(key) ?? null,
    write: (key, value) => {
      held.set(key, value);
    },
    forget: (key) => {
      held.delete(key);
    },
  };
};

const opened: string[] = [];

const handlers = { onOpen: jest.fn(), onMessage: jest.fn(), onClose: jest.fn() };

class ASocket {
  static readonly OPEN = 1;

  static latest: ASocket | null = null;

  readyState = 1;

  onopen: (() => void) | null = null;

  onmessage: ((event: { data: string }) => void) | null = null;

  onclose: (() => void) | null = null;

  onerror: (() => void) | null = null;

  sent: string[] = [];

  closed = false;

  constructor(
    readonly url: string,
    readonly protocols: undefined,
    readonly options?: { headers: Record<string, string> },
  ) {
    opened.push(url);
    ASocket.latest = this;
  }

  send(raw: string) {
    this.sent.push(raw);
  }

  close() {
    this.closed = true;
  }
}

beforeEach(() => {
  opened.length = 0;
  ASocket.latest = null;
  handlers.onOpen.mockClear();
  handlers.onMessage.mockClear();
  handlers.onClose.mockClear();
  Object.defineProperty(globalThis, 'WebSocket', { configurable: true, value: ASocket });
  jest.mocked(get).mockReset().mockResolvedValue({});
});

const onceItHasAsked = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('thePhonesSocket', () => {
  it('opens against the server this phone watches', async () => {
    thePhonesSocket(aStore('http://192.168.1.36:8420'))(handlers);
    await onceItHasAsked();

    expect(opened[0]).toBe('ws://192.168.1.36:8420/api/realtime');
  });

  it('turns a secure address into a secure socket, which a server behind tls insists on', async () => {
    thePhonesSocket(aStore('https://valence.example'))(handlers);
    await onceItHasAsked();

    expect(opened[0]).toBe('wss://valence.example/api/realtime');
  });

  it('passes on what the server said', async () => {
    thePhonesSocket(aStore('http://one.local:8420'))(handlers);
    await onceItHasAsked();
    ASocket.latest?.onmessage?.({ data: '{"kind":"hello"}' });

    expect(handlers.onMessage).toHaveBeenCalledWith('{"kind":"hello"}');
  });

  it('ignores a frame that is not text, rather than passing on nothing', async () => {
    thePhonesSocket(aStore('http://one.local:8420'))(handlers);
    await onceItHasAsked();
    Reflect.apply(ASocket.latest?.onmessage ?? (() => undefined), null, [{ data: 42 }]);

    expect(handlers.onMessage).not.toHaveBeenCalled();
  });

  it('says when it opened and when it ended', async () => {
    thePhonesSocket(aStore('http://one.local:8420'))(handlers);
    await onceItHasAsked();
    ASocket.latest?.onopen?.();
    ASocket.latest?.onclose?.();

    expect(handlers.onOpen).toHaveBeenCalled();
    expect(handlers.onClose).toHaveBeenCalled();
  });

  it('closes rather than leaving a socket that errored open', async () => {
    thePhonesSocket(aStore('http://one.local:8420'))(handlers);
    await onceItHasAsked();
    ASocket.latest?.onerror?.();

    expect(ASocket.latest?.closed).toBe(true);
  });

  it('does not send down a socket that is not open', async () => {
    const link = thePhonesSocket(aStore('http://one.local:8420'))(handlers);
    await onceItHasAsked();

    Reflect.set(ASocket.latest ?? {}, 'readyState', 3);
    link.send('hello');

    expect(ASocket.latest?.sent).toEqual([]);
  });

  it('opens it with this phone\u2019s session on it, which a socket does not carry by itself', async () => {
    jest.mocked(get).mockResolvedValue({
      'valence.session_token': { name: 'valence.session_token', value: 'abc' },
    });

    thePhonesSocket(aStore('http://one.local:8420'))(handlers);
    await onceItHasAsked();

    expect(ASocket.latest?.options).toEqual({ headers: { Cookie: 'valence.session_token=abc' } });
  });

  it('opens anyway where this phone holds no session to send', async () => {
    thePhonesSocket(aStore('http://one.local:8420'))(handlers);
    await onceItHasAsked();

    expect(ASocket.latest?.options).toBeUndefined();
  });

  it('opens nothing at all where it was closed before the jar answered', async () => {
    const link = thePhonesSocket(aStore('http://one.local:8420'))(handlers);

    link.close();
    await onceItHasAsked();

    expect(opened).toEqual([]);
  });
});
