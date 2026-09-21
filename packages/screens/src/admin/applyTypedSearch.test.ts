import { describe, expect, it } from 'vitest';
import { defaultLogView } from '@ValenceClient/admin/defaultLogView';
import { applyTypedSearch } from './applyTypedSearch';

describe('applyTypedSearch', () => {
  it('leaves what is still being typed alone', () => {
    const view = defaultLogView();

    expect(applyTypedSearch('job:abc1', view)).toStrictEqual({ typed: 'job:abc1', view });
  });

  it('leaves plain words alone even once they are followed by a space', () => {
    const view = defaultLogView();

    expect(applyTypedSearch('unreadable file ', view)).toStrictEqual({
      typed: 'unreadable file ',
      view,
    });
  });

  it('turns a finished identifier into a filter and empties the box', () => {
    const { typed, view } = applyTypedSearch('job:abc123 ', defaultLogView());

    expect(typed).toBe('');
    expect(view.ids).toStrictEqual({ jobId: 'abc123' });
  });

  it('keeps the words that were typed beside it', () => {
    const { typed, view } = applyTypedSearch('failed level:error ', defaultLogView());

    expect(typed).toBe('failed ');
    expect(view.levels).toStrictEqual(['error']);
  });

  it('adds a source to the sources already chosen, once', () => {
    const start = { ...defaultLogView(), sources: ['jobs' as const] };
    const { view } = applyTypedSearch('source:scanner source:jobs ', start);

    expect(view.sources).toStrictEqual(['jobs', 'scanner']);
  });

  it('adds a kind of job to the kinds already chosen', () => {
    const start = { ...defaultLogView(), jobKinds: ['library.scan'] };

    expect(applyTypedSearch('kind:library.reencode ', start).view.jobKinds).toStrictEqual([
      'library.scan',
      'library.reencode',
    ]);
  });

  it('replaces an identifier of the same kind and keeps the others', () => {
    const start = { ...defaultLogView(), ids: { jobId: 'old', mediaId: 'm1' } };

    expect(applyTypedSearch('job:new ', start).view.ids).toStrictEqual({
      jobId: 'new',
      mediaId: 'm1',
    });
  });

  it('keeps the range, the search order and everything else about the view', () => {
    const start = { ...defaultLogView(), range: '24h' as const, sort: 'oldest' as const };
    const { view } = applyTypedSearch('level:warn ', start);

    expect(view).toMatchObject({ range: '24h', sort: 'oldest', levels: ['warn'] });
  });
});
