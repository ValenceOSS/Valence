import { afterEach, describe, expect, it, vi } from 'vitest';
import { serverAddress } from '@ValenceClient/session/serverAddress';
import { theDesktopsSocket } from './theDesktopsSocket';

vi.mock('@ValenceClient/session/serverAddress', () => ({ serverAddress: vi.fn() }));

const opened: FakeSocket[] = [];

class FakeSocket {
  static readonly OPEN = 1;
  readyState = 0;
  sent: string[] = [];
  isClosed = false;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(readonly url: URL) {
    opened.push(this);
  }

  send(message: string): void {
    this.sent.push(message);
  }

  close(): void {
    this.isClosed = true;
  }
}

const HANDLERS = { onOpen: vi.fn(), onMessage: vi.fn(), onClose: vi.fn() };

afterEach(() => {
  opened.length = 0;
  vi.unstubAllGlobals();
  vi.mocked(serverAddress).mockReset();
});

describe('theDesktopsSocket', () => {
  it('opens no connection while no server has been chosen', () => {
    vi.mocked(serverAddress).mockReturnValue(null);
    vi.stubGlobal('WebSocket', FakeSocket);

    const link = theDesktopsSocket(HANDLERS);

    link.send('hello');
    link.close();

    expect(opened).toHaveLength(0);
  });

  it('connects through the window’s own host rather than to the server', () => {
    vi.mocked(serverAddress).mockReturnValue('https://valence.example.com');
    vi.stubGlobal('WebSocket', FakeSocket);

    theDesktopsSocket(HANDLERS);

    expect(opened[0]?.url.href).toBe(`ws://${window.location.host}/api/realtime`);
  });

  it('passes on what the connection says, and sends only once it is open', () => {
    vi.mocked(serverAddress).mockReturnValue('https://valence.example.com');
    vi.stubGlobal('WebSocket', FakeSocket);

    const link = theDesktopsSocket(HANDLERS);
    const socket = opened[0];

    link.send('too early');
    socket?.onopen?.();
    socket?.onmessage?.(new MessageEvent('message', { data: 'hello' }));

    if (socket !== undefined) {
      socket.readyState = FakeSocket.OPEN;
    }

    link.send('ping');
    socket?.onerror?.();
    socket?.onclose?.();

    expect(HANDLERS.onOpen).toHaveBeenCalledOnce();
    expect(HANDLERS.onMessage).toHaveBeenCalledWith('hello');
    expect(HANDLERS.onClose).toHaveBeenCalledOnce();
    expect(socket?.sent).toEqual(['ping']);
    expect(socket?.isClosed).toBe(true);
  });

  it('closes the connection when the client is done with it', () => {
    vi.mocked(serverAddress).mockReturnValue('https://valence.example.com');
    vi.stubGlobal('WebSocket', FakeSocket);

    theDesktopsSocket(HANDLERS).close();

    expect(opened[0]?.isClosed).toBe(true);
  });
});
