import { describe, expect, it, vi } from 'vitest';
import { createSessionWatch } from './createSessionWatch';
import type { Schedule } from '@ValenceServer/realtime/createCoalescer';
import type { PresenceSession } from './PresenceService';

const LINGER_MS = 60_000;

const aSession: PresenceSession = {
  clientId: 'tab-1',
  accountId: 'account-1',
  profileId: 'profile-1',
  profileName: 'Connie',
  guestOf: null,
  viaShare: null,
  deviceLabel: 'A phone',
};

const aFakeClock = () => {
  let nowMs = 0;
  const waiting: { run: () => void; at: number }[] = [];

  const schedule: Schedule = (run, afterMs) => {
    const entry = { run, at: nowMs + afterMs };

    waiting.push(entry);

    return () => {
      const at = waiting.indexOf(entry);

      if (at !== -1) {
        waiting.splice(at, 1);
      }
    };
  };

  return {
    schedule,
    now: () => nowMs,
    waiting: () => waiting.length,
    tick: (byMs: number) => {
      nowMs += byMs;

      for (const entry of waiting.filter((one) => one.at <= nowMs)) {
        waiting.splice(waiting.indexOf(entry), 1);
        entry.run();
      }
    },
  };
};

const aWatch = () => {
  const clock = aFakeClock();
  const onStarted = vi.fn();
  const onEnded = vi.fn();

  const watch = createSessionWatch({
    lingerMs: LINGER_MS,
    schedule: clock.schedule,
    now: clock.now,
    onStarted,
    onEnded,
  });

  return { clock, onStarted, onEnded, watch };
};

describe('createSessionWatch', () => {
  it('says somebody has opened Valence as soon as they connect', () => {
    const { onStarted, watch } = aWatch();

    watch.opened(aSession);

    expect(onStarted).toHaveBeenCalledWith(aSession);
  });

  it('waits before believing that a connection going means somebody left', () => {
    const { clock, onEnded, watch } = aWatch();

    watch.opened(aSession);
    watch.closed(aSession.clientId);
    clock.tick(LINGER_MS - 1);

    expect(onEnded).not.toHaveBeenCalled();

    clock.tick(1);

    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it('says nothing at all about a reload, which closes a connection and opens another', () => {
    const { clock, onStarted, onEnded, watch } = aWatch();

    watch.opened(aSession);
    clock.tick(5_000);
    watch.closed(aSession.clientId);
    clock.tick(1_000);
    watch.opened(aSession);
    clock.tick(LINGER_MS);

    expect(onStarted).toHaveBeenCalledTimes(1);
    expect(onEnded).not.toHaveBeenCalled();
  });

  it('counts a visit to when the connection went, not to when the wait was over', () => {
    const { clock, onEnded, watch } = aWatch();

    watch.opened(aSession);
    clock.tick(30_000);
    watch.closed(aSession.clientId);
    clock.tick(LINGER_MS);

    expect(onEnded).toHaveBeenCalledWith({ ...aSession, lastedSeconds: 30 });
  });

  it('counts a visit from when it began, not from the reload in the middle of it', () => {
    const { clock, onEnded, watch } = aWatch();

    watch.opened(aSession);
    clock.tick(20_000);
    watch.closed(aSession.clientId);
    clock.tick(1_000);
    watch.opened(aSession);
    clock.tick(20_000);
    watch.closed(aSession.clientId);
    clock.tick(LINGER_MS);

    expect(onEnded).toHaveBeenCalledWith({ ...aSession, lastedSeconds: 41 });
  });

  it('carries whatever the session last said about itself into the leaving', () => {
    const { clock, onEnded, watch } = aWatch();

    watch.opened(aSession);
    watch.closed(aSession.clientId);
    watch.opened({ ...aSession, profileName: 'Dan', profileId: 'profile-2' });
    watch.closed(aSession.clientId);
    clock.tick(LINGER_MS);

    expect(onEnded).toHaveBeenCalledWith(
      expect.objectContaining({ profileName: 'Dan', profileId: 'profile-2' }),
    );
  });

  it('does not announce a second arrival when another socket claims the same client', () => {
    const { onStarted, onEnded, watch } = aWatch();

    watch.opened(aSession);
    watch.opened(aSession);

    expect(onStarted).toHaveBeenCalledTimes(1);
    expect(onEnded).not.toHaveBeenCalled();
  });

  it('treats another account on the same client as one person leaving and another arriving', () => {
    const { clock, onStarted, onEnded, watch } = aWatch();

    watch.opened(aSession);
    clock.tick(10_000);
    watch.opened({ ...aSession, accountId: 'account-2', profileName: 'Dan' });

    expect(onEnded).toHaveBeenCalledWith({ ...aSession, lastedSeconds: 10 });
    expect(onStarted).toHaveBeenLastCalledWith(expect.objectContaining({ accountId: 'account-2' }));
  });

  it('keeps one wait per client, however many times a closing connection is reported', () => {
    const { clock, onEnded, watch } = aWatch();

    watch.opened(aSession);
    watch.closed(aSession.clientId);
    watch.closed(aSession.clientId);

    expect(clock.waiting()).toBe(1);

    clock.tick(LINGER_MS);

    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it('has nothing to say about a client it never saw arrive', () => {
    const { clock, onEnded, watch } = aWatch();

    watch.closed('a-tab-nobody-knows');
    clock.tick(LINGER_MS);

    expect(onEnded).not.toHaveBeenCalled();
  });

  it('holds each client apart, so one leaving is not another leaving', () => {
    const { clock, onStarted, onEnded, watch } = aWatch();
    const other = { ...aSession, clientId: 'tab-2', deviceLabel: 'A television' };

    watch.opened(aSession);
    watch.opened(other);
    watch.closed(aSession.clientId);
    clock.tick(LINGER_MS);

    expect(onStarted).toHaveBeenCalledTimes(2);
    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(onEnded).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'tab-1' }));
  });
});
