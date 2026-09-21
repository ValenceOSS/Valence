import { describe, expect, it } from 'vitest';
import { defaultLogView } from './defaultLogView';
import { logSearchFromView } from './logSearchFromView';
import { logViewFromSearch } from './logViewFromSearch';

describe('logViewFromSearch', () => {
  it('is the log as it opens where the address says nothing', () => {
    expect(logViewFromSearch({})).toStrictEqual({ view: defaultLogView(), text: '' });
  });

  it('reads the filters and the words out of q', () => {
    const { view, text } = logViewFromSearch({
      q: 'level:error level:warn source:jobs kind:library.scan job:abc unreadable file',
    });

    expect(view).toMatchObject({
      levels: ['warn', 'error'],
      sources: ['jobs'],
      jobKinds: ['library.scan'],
      ids: { jobId: 'abc' },
    });
    expect(text).toBe('unreadable file');
  });

  it('shows every level where q names none', () => {
    expect(logViewFromSearch({ q: 'source:jobs' }).view.levels).toStrictEqual([
      'debug',
      'info',
      'warn',
      'error',
    ]);
  });

  it('reads the range and the order', () => {
    expect(logViewFromSearch({ range: '7d', sort: 'oldest' }).view).toMatchObject({
      range: '7d',
      sort: 'oldest',
    });
  });

  it('reads a zoom only where both ends are given', () => {
    expect(logViewFromSearch({ from: 100, until: 900 }).view.zoom).toStrictEqual({
      fromMs: 100,
      untilMs: 900,
    });
    expect(logViewFromSearch({ from: 100 }).view.zoom).toBeNull();
  });
});

describe('logSearchFromView', () => {
  it('says nothing for the log as it opens', () => {
    expect(logSearchFromView(defaultLogView(), '')).toStrictEqual({
      q: undefined,
      range: undefined,
      from: undefined,
      until: undefined,
      sort: undefined,
    });
  });

  it('writes the filters and the words in the words the search box understands', () => {
    const asked = logSearchFromView(
      {
        ...defaultLogView(),
        levels: ['error'],
        sources: ['jobs'],
        jobKinds: ['library scan'],
        ids: { jobId: 'abc' },
      },
      ' unreadable ',
    );

    expect(asked.q).toBe('level:error source:jobs kind:"library scan" job:abc unreadable');
  });

  it('writes a range, a zoom and an order that are not the defaults', () => {
    expect(
      logSearchFromView(
        { ...defaultLogView(), range: '6h', zoom: { fromMs: 5, untilMs: 9 }, sort: 'busiest' },
        '',
      ),
    ).toMatchObject({ range: '6h', from: 5, until: 9, sort: 'busiest' });
  });

  it('gives back the view it was made from', () => {
    const view = {
      ...defaultLogView(),
      levels: ['warn' as const, 'error' as const],
      sources: ['scanner' as const],
      jobKinds: ['library.scan'],
      ids: { libraryId: 'lib 1', mediaId: 'm1' },
      range: '6h' as const,
      zoom: { fromMs: 1, untilMs: 2 },
      sort: 'severest' as const,
    };
    const address = logSearchFromView(view, 'words here');
    const back = logViewFromSearch(address);

    expect(back.view).toStrictEqual(view);
    expect(back.text).toBe('words here');
  });
});
