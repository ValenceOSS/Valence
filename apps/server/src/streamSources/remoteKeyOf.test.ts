import { describe, expect, it } from 'vitest';
import { remoteKeyOf } from './remoteKeyOf';

const CHOSEN = {
  path: 'streamed://film/603',
  pluginId: 'example-files',
  sourceId: 'files',
  streamKey: 'a',
};

describe('remoteKeyOf', () => {
  it('names a film’s chosen stream the same each time, in letters, digits and dashes', () => {
    expect(remoteKeyOf(CHOSEN)).toBe(remoteKeyOf({ ...CHOSEN }));
    expect(remoteKeyOf(CHOSEN)).toMatch(/^streamed-[0-9a-f]{32}$/);
  });

  it('names another stream of the same film differently', () => {
    expect(remoteKeyOf({ ...CHOSEN, streamKey: 'b' })).not.toBe(remoteKeyOf(CHOSEN));
  });
});
