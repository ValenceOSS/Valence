import { describe, expect, it } from 'vitest';
import { describeRunSubject } from './describeRunSubject';
import type { Library } from '@ValenceContracts/schemas/Library';

const MOVIES: Library = {
  id: 'd3ecbc24-d083-4945-b2ab-000000000000',
  name: 'Movies',
  kind: 'movies',
  path: '/media/movies',
  itemCount: 107,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
};

describe('describeRunSubject', () => {
  it('names a library by its name rather than its identifier', () => {
    expect(describeRunSubject(MOVIES.id, [MOVIES])).toEqual({ name: 'Movies', library: MOVIES });
  });

  it('leaves a subject that names no library as it was written', () => {
    expect(describeRunSubject('nightly', [MOVIES])).toEqual({ name: 'nightly', library: null });
  });

  it('shows a dash where a run had no subject', () => {
    expect(describeRunSubject(null, [MOVIES])).toEqual({ name: '—', library: null });
  });

  it('falls back to the identifier for a library that has since been removed', () => {
    expect(describeRunSubject(MOVIES.id, [])).toEqual({ name: MOVIES.id, library: null });
  });
});
