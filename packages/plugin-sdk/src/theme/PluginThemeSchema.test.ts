import { describe, expect, it } from 'vitest';
import { aTheme } from '@ValenceSDK/testing/aTheme';
import { PluginThemeSchema } from './PluginThemeSchema';

describe('PluginThemeSchema', () => {
  it('accepts a dark theme and gives it standard corners', () => {
    const theme = PluginThemeSchema.parse({ id: 'midnight', name: 'Midnight', dark: aTheme() });

    expect(theme.corners).toBe('standard');
  });

  it('refuses a theme with neither scheme', () => {
    const read = PluginThemeSchema.safeParse({ id: 'empty', name: 'Empty' });

    expect(read.success ? [] : read.error.issues.map((issue) => issue.message)).toContain(
      'A theme gives a dark scheme, a light one, or both',
    );
  });

  it('refuses a scheme that would be hard to read, naming the scheme', () => {
    const read = PluginThemeSchema.safeParse({
      id: 'murky',
      name: 'Murky',
      light: aTheme({ text: '#1a1a1a' }),
    });

    expect(read.success).toBe(false);
    expect(read.success ? [] : read.error.issues.map((issue) => issue.path[0])).toContain('light');
  });
});
