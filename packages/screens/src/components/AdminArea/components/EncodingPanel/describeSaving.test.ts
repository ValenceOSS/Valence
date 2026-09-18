import { describe, expect, it } from 'vitest';
import { describeSaving } from './describeSaving';

describe('describeSaving', () => {
  it('says what replacing frees', () => {
    expect(
      describeSaving({ mode: 'replace', nowBytes: 70_000_000_000, afterBytes: 6_000_000_000 }),
    ).toContain('Frees');
  });

  it('says what keeping one alongside costs, which is the opposite trade', () => {
    const said = describeSaving({
      mode: 'keep',
      nowBytes: 70_000_000_000,
      afterBytes: 76_000_000_000,
    });

    expect(said).toContain('Costs');
    expect(said).toContain('transcode');
  });

  it('says nothing changes where nothing does', () => {
    expect(describeSaving({ mode: 'replace', nowBytes: 100, afterBytes: 100 })).toContain('same');
  });

  it('does not talk about transcoding for a replacement that happens to grow', () => {
    const said = describeSaving({ mode: 'replace', nowBytes: 100, afterBytes: 200 });

    expect(said).toContain('Costs');
    expect(said).not.toContain('transcode');
  });
});
