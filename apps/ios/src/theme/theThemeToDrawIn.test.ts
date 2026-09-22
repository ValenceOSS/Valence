import { theThemeToDrawIn } from './theThemeToDrawIn';

describe('theThemeToDrawIn', () => {
  it('draws light where the phone says light', () => {
    expect(theThemeToDrawIn('light')).toBe('light');
  });

  it('draws dark where the phone says dark', () => {
    expect(theThemeToDrawIn('dark')).toBe('dark');
  });

  it('draws dark where the phone will not say', () => {
    expect(theThemeToDrawIn(null)).toBe('dark');
    expect(theThemeToDrawIn(undefined)).toBe('dark');
  });

  it('draws dark where the phone says something nobody expected', () => {
    expect(theThemeToDrawIn('sepia')).toBe('dark');
  });
});
