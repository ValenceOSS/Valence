import { theThemeToDrawIn } from './theThemeToDrawIn';

describe('theThemeToDrawIn', () => {
  it('gives somebody the theme they asked for, whatever the phone is in', () => {
    expect(theThemeToDrawIn('dark', 'light')).toBe('dark');
    expect(theThemeToDrawIn('light', 'dark')).toBe('light');
  });

  it('follows the phone where that is what was asked for', () => {
    expect(theThemeToDrawIn('system', 'light')).toBe('light');
    expect(theThemeToDrawIn('system', 'dark')).toBe('dark');
  });

  it('draws dark where the phone will not say', () => {
    expect(theThemeToDrawIn('system', null)).toBe('dark');
    expect(theThemeToDrawIn('system', undefined)).toBe('dark');
  });

  it('draws dark where the phone says something nobody expected', () => {
    expect(theThemeToDrawIn('system', 'sepia')).toBe('dark');
  });
});
