import { describe, expect, it } from 'vitest';
import { channelInitials } from './channelInitials';

describe('channelInitials', () => {
  it('takes the first two letters or digits, skipping spaces and punctuation', () => {
    expect(channelInitials('5 Cops')).toBe('5C');
    expect(channelInitials('E! Entertainment')).toBe('EE');
  });

  it('keeps letters from any alphabet', () => {
    expect(channelInitials('Россия 1')).toBe('Ро');
  });

  it('falls back to whatever the name starts with when it has no letters or digits', () => {
    expect(channelInitials('★ ★ ★')).toBe('★★');
  });
});
