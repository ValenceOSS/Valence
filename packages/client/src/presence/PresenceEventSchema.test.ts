import { describe, expect, it } from 'vitest';
import { PresenceEventSchema } from '@ValenceClient/presence/PresenceEventSchema';

describe('PresenceEventSchema', () => {
  it('reads a film command sent from another of the same person’s devices', () => {
    const event = {
      kind: 'video',
      command: { kind: 'play', mediaId: '00000000-0000-4000-8000-000000000001', startSeconds: 30 },
      fromClientId: 'phone',
      fromLabel: 'iPhone',
    };

    expect(PresenceEventSchema.parse(event)).toEqual(event);
  });

  it('reads every film command a remote sends', () => {
    const commands = [
      { kind: 'pause' },
      { kind: 'resume' },
      { kind: 'seek', positionSeconds: 120 },
      { kind: 'skip', seconds: -10 },
      { kind: 'stop' },
    ];

    for (const command of commands) {
      expect(
        PresenceEventSchema.safeParse({
          kind: 'video',
          command,
          fromClientId: 'phone',
          fromLabel: 'iPhone',
        }).success,
      ).toBe(true);
    }
  });

  it('refuses a film command that does not say where it came from', () => {
    expect(
      PresenceEventSchema.safeParse({ kind: 'video', command: { kind: 'pause' } }).success,
    ).toBe(false);
  });

  it('refuses a film command it does not know', () => {
    expect(
      PresenceEventSchema.safeParse({
        kind: 'video',
        command: { kind: 'rewind' },
        fromClientId: 'phone',
        fromLabel: 'iPhone',
      }).success,
    ).toBe(false);
  });

  it('still reads an operator’s resume, which carries nothing else', () => {
    expect(PresenceEventSchema.parse({ kind: 'resumed' })).toEqual({ kind: 'resumed' });
  });
});
