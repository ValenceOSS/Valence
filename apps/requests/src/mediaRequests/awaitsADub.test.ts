import { describe, expect, it } from 'vitest';
import { awaitsADub } from './awaitsADub';

describe('awaitsADub', () => {
  it('waits on a dub only where subtitles do until one comes', () => {
    expect(awaitsADub('subbedUntilDubbed', '[Group] Show - 01 [1080p]')).toBe(true);
    expect(awaitsADub('subbedUntilDubbed', '[Group] Show - 01 [1080p] [Dual Audio]')).toBe(false);
    expect(awaitsADub('subbed', '[Group] Show - 01 [1080p]')).toBe(false);
  });
});
