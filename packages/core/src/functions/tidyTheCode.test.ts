import { describe, expect, it } from 'vitest';
import { tidyTheCode } from './tidyTheCode';

describe('a code somebody typed off a television', () => {
  it('leaves one that was typed exactly alone', () => {
    expect(tidyTheCode('ABCD1234')).toBe('ABCD1234');
  });

  it('takes the dash out, whether or not it was on the screen', () => {
    expect(tidyTheCode('ABCD-1234')).toBe('ABCD1234');
  });

  it('takes a space out, which is what a phone keyboard offers instead', () => {
    expect(tidyTheCode('ABCD 1234')).toBe('ABCD1234');
  });

  it('raises the case, since nobody reading a screen knows it mattered', () => {
    expect(tidyTheCode('abcd-1234')).toBe('ABCD1234');
  });

  it('has nothing to say about nothing', () => {
    expect(tidyTheCode('')).toBe('');
  });
});
