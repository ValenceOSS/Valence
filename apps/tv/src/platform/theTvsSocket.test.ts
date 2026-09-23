import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { keepTheSessionToken } from '@ValenceTv/platform/theSessionToken';
import type * as TheTvsSocket from '@ValenceTv/platform/theTvsSocket';

class AFakeSocket {
  static readonly OPEN = 1;

  static made: AFakeSocket[] = [];

  readyState = 0;

  sent: string[] = [];

  isClosed = false;

  onopen: (() => void) | null = null;

  onmessage: ((event: { data: string | ArrayBuffer }) => void) | null = null;

  onclose: (() => void) | null = null;

  onerror: (() => void) | null = null;

  constructor(
    readonly url: string,
    readonly protocols: undefined,
    readonly options: { headers: Record<string, string> },
  ) {
    AFakeSocket.made.push(this);
  }

  send(raw: string): void {
    this.sent.push(raw);
  }

  close(): void {
    this.isClosed = true;
  }
}

const realSocket = Object.getOwnPropertyDescriptor(globalThis, 'WebSocket');

Object.defineProperty(globalThis, 'WebSocket', {
  value: AFakeSocket,
  configurable: true,
  writable: true,
});

afterAll(() => {
  if (realSocket !== undefined) {
    Object.defineProperty(globalThis, 'WebSocket', realSocket);
  }
});

const theSocket = async (): Promise<typeof TheTvsSocket.theTvsSocket> =>
  Promise.resolve(
    jest.requireActual<typeof TheTvsSocket>('@ValenceTv/platform/theTvsSocket').theTvsSocket,
  );

const handlers = () => ({ onOpen: jest.fn(), onMessage: jest.fn(), onClose: jest.fn() });

const lastMade = (): AFakeSocket => {
  const made = AFakeSocket.made.at(-1);

  if (made === undefined) {
    throw new Error('No socket was opened');
  }

  return made;
};

beforeEach(() => {
  AFakeSocket.made = [];
});

describe('theTvsSocket', () => {
  it('says the connection is closed where there is no server to open it to', async () => {
    const told = handlers();
    const link = (await theSocket())(told);

    expect(told.onClose).toHaveBeenCalledTimes(1);
    expect(AFakeSocket.made).toHaveLength(0);

    link.send('hello');
    link.close();
  });

  it('opens a signed socket on the server, securely where the server is', async () => {
    rememberServerAddress('https://valence.example.com');
    keepTheSessionToken('secret');

    (await theSocket())(handlers());

    expect(lastMade().url).toBe('wss://valence.example.com/api/realtime');
    expect(lastMade().options.headers).toEqual({ authorization: 'Bearer secret' });
  });

  it('opens a plain socket on a plain server', async () => {
    rememberServerAddress('http://valence.local:3000');

    (await theSocket())(handlers());

    expect(lastMade().url).toBe('ws://valence.local:3000/api/realtime');
  });

  it('passes on what the connection says, and only text', async () => {
    rememberServerAddress('http://valence.local:3000');

    const told = handlers();

    (await theSocket())(told);

    const socket = lastMade();

    socket.onopen?.();
    socket.onmessage?.({ data: '{"kind":"hello"}' });
    socket.onmessage?.({ data: new ArrayBuffer(2) });
    socket.onclose?.();

    expect(told.onOpen).toHaveBeenCalledTimes(1);
    expect(told.onMessage).toHaveBeenCalledTimes(1);
    expect(told.onMessage).toHaveBeenCalledWith('{"kind":"hello"}');
    expect(told.onClose).toHaveBeenCalledTimes(1);
  });

  it('sends only once the connection is open', async () => {
    rememberServerAddress('http://valence.local:3000');

    const link = (await theSocket())(handlers());
    const socket = lastMade();

    link.send('early');
    socket.readyState = AFakeSocket.OPEN;
    link.send('on time');

    expect(socket.sent).toEqual(['on time']);
  });

  it('closes on an error, and when asked', async () => {
    rememberServerAddress('http://valence.local:3000');

    const link = (await theSocket())(handlers());

    lastMade().onerror?.();

    expect(lastMade().isClosed).toBe(true);

    (await theSocket())(handlers()).close();

    expect(lastMade().isClosed).toBe(true);

    link.close();
  });
});
