import { describe, expect, it } from 'vitest';
import { REENCODE_CODECS } from '@ValenceContracts/schemas/Reencode';
import { describeCodecTrade } from './describeCodecTrade';

describe('describeCodecTrade', () => {
  it('has something to say about every codec on offer', () => {
    for (const codec of REENCODE_CODECS) {
      expect(describeCodecTrade(codec).length).toBeGreaterThan(0);
    }
  });

  it('says what the older codec buys, which is that everything plays it', () => {
    expect(describeCodecTrade('h264')).toContain('everything');
  });

  it('names the bill as well as the saving for the newest one', () => {
    expect(describeCodecTrade('av1')).toContain('every play');
  });
});
