import { describe, expect, it } from 'vitest';
import { nameVideoQuality } from './nameVideoQuality';

describe('nameVideoQuality', () => {
  it('names a quality by its source and resolution', () => {
    expect(nameVideoQuality('webdl-1080p')).toBe('WEB-DL 1080p');
  });

  it('names a cinema recording by its source alone', () => {
    expect(nameVideoQuality('telesync')).toBe('Telesync');
  });
});
