import { describe, expect, it } from 'vitest';
import { layoutFor } from './layoutFor';

const LG =
  'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36';

const LG_2025 =
  'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chr0me/120.0.6099.270 Safari/537.36';

describe('layoutFor', () => {
  it('shows a television’s browser the TV layout, and any other the web app', () => {
    expect(layoutFor(LG, undefined)).toBe('tv');
    expect(layoutFor('Mozilla/5.0 (Macintosh) Chrome/140.0', undefined)).toBe('web');
  });

  it('keeps to what somebody chose on this browser, either way', () => {
    expect(layoutFor(LG_2025, 'web')).toBe('web');
    expect(layoutFor('Mozilla/5.0 (Macintosh) Chrome/140.0', 'tv')).toBe('tv');
  });

  it('keeps a television that cannot run the web app on the TV layout, whatever was chosen', () => {
    expect(layoutFor(LG, 'web')).toBe('tv');
  });

  it('ignores a choice it does not know', () => {
    expect(layoutFor(LG, 'sideways')).toBe('tv');
  });
});
