import { describe, expect, it } from 'vitest';
import { aJellyfinBackend } from './aJellyfinBackend';
import { aJellyfinCaller } from './aJellyfinCaller';
import { aJellyfinOrigin } from './aJellyfinOrigin';

describe('aJellyfinBackend', () => {
  it('knows one session and records what is written to it', async () => {
    const { backend, recorded, film } = aJellyfinBackend();

    expect(await backend.callerOf('s.a-session', aJellyfinOrigin())).not.toBeNull();
    expect(await backend.callerOf('s.other', aJellyfinOrigin())).toBeNull();

    await backend.recordProgress(aJellyfinCaller(), film.id, {
      positionSeconds: 1,
      durationSeconds: 2,
    });

    expect(recorded.progress).toHaveLength(1);
  });

  it('takes changes to what it answers', async () => {
    const { backend } = aJellyfinBackend({ serverName: () => Promise.resolve('Elsewhere') });

    expect(await backend.serverName()).toBe('Elsewhere');
  });
});
