import { describe, expect, it } from 'vitest';
import { tidyName } from './tidyName';

describe('tidyName', () => {
  it('turns separators and brackets into single spaces', () => {
    expect(tidyName('The_Office.(US)..S01')).toBe('The Office US S01');
  });
});
