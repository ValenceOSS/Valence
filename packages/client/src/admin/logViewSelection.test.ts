import { describe, expect, it } from 'vitest';
import { defaultLogView } from './defaultLogView';
import { logFilterId, logViewSelection } from './logViewSelection';
import { logViewFromSelection } from './logViewFromSelection';

describe('logFilterId', () => {
  it('names a filter the way the search box does', () => {
    expect(logFilterId('level', 'error')).toBe('level:error');
  });

  it('quotes a value with a space in it, so it can be read back', () => {
    expect(logFilterId('kind', 'library scan')).toBe('kind:"library scan"');
  });
});

describe('logViewSelection', () => {
  it('names every filter a view has, and only those', () => {
    const selection = logViewSelection({
      ...defaultLogView(),
      levels: ['error'],
      sources: ['jobs'],
      jobKinds: ['library.scan'],
      ids: { jobId: 'j1', sessionId: 's1' },
    });

    expect([...selection].sort()).toStrictEqual([
      'job:j1',
      'kind:library.scan',
      'level:error',
      'session:s1',
      'source:jobs',
    ]);
  });

  it('names all four levels for a view that has not been narrowed', () => {
    expect(logViewSelection(defaultLogView()).size).toBe(4);
  });
});

describe('logViewFromSelection', () => {
  it('reads the filters back out of their names, leaving the rest of the view alone', () => {
    const before = {
      ...defaultLogView(),
      search: 'abc',
      sort: 'oldest' as const,
      range: '6h' as const,
    };
    const after = logViewFromSelection(
      before,
      new Set(['level:warn', 'source:scanner', 'kind:library.scan', 'library:l1', 'request:r1']),
    );

    expect(after).toMatchObject({
      levels: ['warn'],
      sources: ['scanner'],
      jobKinds: ['library.scan'],
      ids: { libraryId: 'l1', requestId: 'r1' },
      search: 'abc',
      sort: 'oldest',
      range: '6h',
    });
  });

  it('comes back to the same selection it was given', () => {
    const view = {
      ...defaultLogView(),
      levels: ['error' as const],
      jobKinds: ['library scan'],
      ids: { mediaId: 'm 1' },
    };

    expect(
      logViewSelection(logViewFromSelection(defaultLogView(), logViewSelection(view))),
    ).toEqual(logViewSelection(view));
  });

  it('has no filters for an empty selection', () => {
    expect(logViewFromSelection(defaultLogView(), new Set())).toMatchObject({
      levels: [],
      sources: [],
      jobKinds: [],
      ids: {},
    });
  });
});
