import { describe, expect, it } from 'vitest';
import { STATUS_LOOK } from './STATUS_LOOK';

describe('STATUS_LOOK', () => {
  it('names finishing the same word wherever it is said', () => {
    expect(STATUS_LOOK.done.label).toBe('Done');
  });

  it('gives each kind of standing a tone of its own', () => {
    const tones = Object.values(STATUS_LOOK).map((look) => look.tone);

    expect(new Set(tones).size).toBe(tones.length);
  });

  it('paints work under way in the tone the badge keeps for it', () => {
    expect(STATUS_LOOK.working.tone).toBe('busy');
  });
});
