import { describe, expect, it } from 'vitest';
import { quietLinkedViewers } from './quietLinkedViewers';

const NOW = 1_000_000;

const QUIET = 120_000;

describe('quietLinkedViewers', () => {
  it('lets go of a linked session not heard from for longer than allowed', () => {
    const heard = new Map([
      ['peer~a~old', 300_000],
      ['peer~a~live', 5_000],
    ]);

    expect(
      quietLinkedViewers(
        [
          { clientId: 'peer~a~old', fromServer: 'KKONAW', connectedAt: 0 },
          { clientId: 'peer~a~live', fromServer: 'KKONAW', connectedAt: 0 },
        ],
        (clientId) => heard.get(clientId) ?? null,
        NOW,
        QUIET,
      ),
    ).toEqual(['peer~a~old']);
  });

  it('measures a session that never reported from when it began', () => {
    expect(
      quietLinkedViewers(
        [
          { clientId: 'peer~a~started-long-ago', fromServer: 'KKONAW', connectedAt: 0 },
          { clientId: 'peer~a~just-started', fromServer: 'KKONAW', connectedAt: NOW - 10_000 },
        ],
        () => null,
        NOW,
        QUIET,
      ),
    ).toEqual(['peer~a~started-long-ago']);
  });

  it('leaves this server’s own sessions alone, whose connection says when they end', () => {
    expect(
      quietLinkedViewers(
        [{ clientId: 'tab-1', fromServer: null, connectedAt: 0 }],
        () => 900_000,
        NOW,
        QUIET,
      ),
    ).toEqual([]);
  });
});
