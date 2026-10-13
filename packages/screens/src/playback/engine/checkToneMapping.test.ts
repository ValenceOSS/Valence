import { describe, expect, it } from 'vitest';
import { checkToneMapping } from '@ValenceScreens/playback/engine/checkToneMapping';

describe('checkToneMapping', () => {
  it('trusts nothing in a browser without WebCodecs, saying it cannot decode', async () => {
    expect(await checkToneMapping('hevc')).toEqual({ outcome: 'notDecodable' });
  });
});
