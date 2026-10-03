import { describe, expect, it } from 'vitest';
import { AddLibraryFormSchema } from './AddLibraryFormSchema';
import { CUSTOM_PRESET } from './CUSTOM_PRESET';

const FILLED = {
  name: 'Films',
  preset: 'movies',
  customKind: 'movies' as const,
  flavour: '',
  path: '/media/films',
};

const problemsOf = (form: typeof FILLED): Record<string, string> => {
  const parsed = AddLibraryFormSchema.safeParse(form);

  return parsed.success
    ? {}
    : Object.fromEntries(
        parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
      );
};

describe('AddLibraryFormSchema', () => {
  it('accepts a name and a path', () => {
    expect(problemsOf(FILLED)).toEqual({});
  });

  it('requires a name, and not one of only spaces', () => {
    expect(problemsOf({ ...FILLED, name: '   ' }).name).toBe('Enter a name for this library.');
  });

  it('requires a path', () => {
    expect(problemsOf({ ...FILLED, path: '' }).path).toBe(
      'Enter the path to this library on the machine running Valence.',
    );
  });

  it('asks what kind of library a custom one is, but not otherwise', () => {
    expect(problemsOf({ ...FILLED, preset: CUSTOM_PRESET, flavour: '  ' }).flavour).toBe(
      'Say what kind of library this is.',
    );
    expect(problemsOf({ ...FILLED, preset: CUSTOM_PRESET, flavour: 'Documentaries' })).toEqual({});
  });
});
