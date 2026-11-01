import { describe, expect, it, vi } from 'vitest';
import { createSignedInSockets } from './createSignedInSockets';

describe('createSignedInSockets', () => {
  it('closes the sockets of the sign-ins that were ended, and only those', () => {
    const sockets = createSignedInSockets();
    const phone = vi.fn();
    const laptop = vi.fn();

    sockets.hold({ sessionId: 'session-1', accountId: 'dan' }, phone);
    sockets.hold({ sessionId: 'session-2', accountId: 'dan' }, laptop);
    sockets.close({ sessionIds: ['session-1'] });

    expect(phone).toHaveBeenCalledOnce();
    expect(laptop).not.toHaveBeenCalled();
  });

  it('closes every socket of an account signed out everywhere', () => {
    const sockets = createSignedInSockets();
    const dans = [vi.fn(), vi.fn()];
    const marques = vi.fn();

    sockets.hold({ sessionId: 'session-1', accountId: 'dan' }, dans[0] ?? vi.fn());
    sockets.hold({ sessionId: 'session-2', accountId: 'dan' }, dans[1] ?? vi.fn());
    sockets.hold({ sessionId: 'session-3', accountId: 'marques' }, marques);
    sockets.close({ accountId: 'dan' });

    for (const one of dans) {
      expect(one).toHaveBeenCalledOnce();
    }

    expect(marques).not.toHaveBeenCalled();
  });

  it('forgets a socket once it has closed by itself, and closes each only once', () => {
    const sockets = createSignedInSockets();
    const gone = vi.fn();
    const ended = vi.fn();

    sockets.hold({ sessionId: 'session-1', accountId: 'dan' }, gone)();
    sockets.hold({ sessionId: 'session-2', accountId: 'dan' }, ended);
    sockets.close({ accountId: 'dan' });
    sockets.close({ accountId: 'dan' });

    expect(gone).not.toHaveBeenCalled();
    expect(ended).toHaveBeenCalledOnce();
  });
});
