import { describe, expect, it } from 'vitest';
import { settleTheOwner } from './settleTheOwner';

const at = (when: string) => new Date(when);

const FIRST = { id: 'usr_first', createdAt: at('2026-01-01T00:00:00.000Z') };
const LATER = { id: 'usr_later', createdAt: at('2026-06-01T00:00:00.000Z') };

describe('settling who owns a server that never recorded one', () => {
  it('names the oldest administrator, who is whoever ran setup', () => {
    expect(settleTheOwner('', [LATER, FIRST])).toBe('usr_first');
  });

  it('leaves a server that already knows alone, however old anybody is', () => {
    expect(settleTheOwner('usr_chosen', [FIRST, LATER])).toBeNull();
  });

  it('names nobody where nobody administers it, rather than guessing', () => {
    expect(settleTheOwner('', [])).toBeNull();
  });

  it('does not care what order they arrive in', () => {
    expect(settleTheOwner('', [FIRST, LATER])).toBe(settleTheOwner('', [LATER, FIRST]));
  });

  it('leaves the accounts it was given as it found them', () => {
    const given = [LATER, FIRST];

    settleTheOwner('', given);

    expect(given[0]).toBe(LATER);
  });
});
