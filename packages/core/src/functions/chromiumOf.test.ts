import { describe, expect, it } from 'vitest';
import { chromiumOf } from '@ValenceCore/functions/chromiumOf';

describe('chromiumOf', () => {
  it('reads the Chromium a browser names', () => {
    expect(
      chromiumOf(
        'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
      ),
    ).toBe(87);
  });

  it('reads LG’s, which spells Chrome with a zero', () => {
    expect(chromiumOf('(Web0S; Linux/SmartTV) Chr0me/94.0.4606.128 Safari/537.36')).toBe(94);
  });

  it('reads Samsung’s, which gives the version without naming Chromium', () => {
    expect(chromiumOf('(SMART-TV; LINUX; Tizen 6.5) 85.0.4183.93/6.5 TV Safari/537.36')).toBe(85);
  });

  it('says nothing for a browser that is not Chromium', () => {
    expect(chromiumOf('Mozilla/5.0 (Macintosh) Gecko/20100101 Firefox/141.0')).toBeNull();
  });
});
