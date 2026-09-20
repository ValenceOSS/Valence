import { describe, expect, it } from 'vitest';
import { workOf } from './workOf';
import type { ScanEntry } from '@ValenceScreens/components/AdminArea/scanCoordinator';

const entry = (libraryId: string, kind: string): ScanEntry => ({
  libraryId,
  kind,
  phase: null,
  processed: null,
  total: null,
  jobId: null,
});

describe('workOf', () => {
  it('gathers every kind of work against the library', () => {
    const progress = new Map([
      ['a:scan', entry('a', 'scan')],
      ['a:library.regeneratePreviews', entry('a', 'library.regeneratePreviews')],
      ['b:scan', entry('b', 'scan')],
    ]);

    expect(workOf(progress, 'a').map((found) => found.kind)).toEqual([
      'scan',
      'library.regeneratePreviews',
    ]);
  });

  it('is empty for a library nothing is being done to', () => {
    expect(workOf(new Map([['b:scan', entry('b', 'scan')]]), 'a')).toEqual([]);
  });
});
