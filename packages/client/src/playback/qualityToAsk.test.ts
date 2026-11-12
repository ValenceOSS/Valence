import { describe, expect, it } from 'vitest';
import { qualityToAsk } from './qualityToAsk';

describe('qualityToAsk', () => {
  it('follows automatic quality where somebody chose automatic', () => {
    expect(qualityToAsk('auto', '720p', '2160p')).toBe('720p');
  });

  it('follows automatic quality where the sharpest step the picture reaches was pinned', () => {
    expect(qualityToAsk('1080p', 'original', '1080p')).toBe('original');
  });

  it('asks for a pinned step below the sharpest one as it is', () => {
    expect(qualityToAsk('720p', 'original', '1080p')).toBe('720p');
  });

  it('asks for a pinned step as it is where the sharpest one is not known', () => {
    expect(qualityToAsk('720p', 'original', null)).toBe('720p');
  });

  it('asks for the original where the original was chosen', () => {
    expect(qualityToAsk('original', '720p', '1080p')).toBe('original');
  });
});
