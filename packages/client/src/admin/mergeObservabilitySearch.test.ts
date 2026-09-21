import { describe, expect, it } from 'vitest';
import { ObservabilitySearchSchema } from './ObservabilitySearchSchema';
import { mergeObservabilitySearch } from './mergeObservabilitySearch';

describe('mergeObservabilitySearch', () => {
  it('lays a change over what is there', () => {
    expect(mergeObservabilitySearch({ view: 'logs', range: '7d' }, { range: '24h' })).toStrictEqual(
      {
        view: 'logs',
        range: '24h',
      },
    );
  });

  it('takes off a field the change gives as nothing', () => {
    expect(
      mergeObservabilitySearch({ view: 'logs', q: 'level:error' }, { q: undefined }),
    ).toStrictEqual({
      view: 'logs',
    });
  });

  it('leaves what the change does not mention', () => {
    expect(mergeObservabilitySearch({ rq: 'scan' }, { view: 'jobs' })).toStrictEqual({
      rq: 'scan',
      view: 'jobs',
    });
  });
});

describe('ObservabilitySearchSchema', () => {
  it('reads a bare address', () => {
    expect(ObservabilitySearchSchema.parse({})).toStrictEqual({});
  });

  it('reads the fields it knows', () => {
    expect(
      ObservabilitySearchSchema.parse({
        view: 'logs',
        q: 'level:error',
        range: '7d',
        from: 100,
        until: 200,
        sort: 'oldest',
        rq: 'scan',
        rstatus: 'failed',
        rsort: 'longest',
      }),
    ).toMatchObject({
      view: 'logs',
      range: '7d',
      from: 100,
      until: 200,
      rstatus: 'failed',
    });
  });

  it('drops a field it cannot read rather than refusing the address', () => {
    const read = ObservabilitySearchSchema.parse({
      view: 'sideways',
      range: 'forever',
      from: 'x',
      q: 'ok',
    });

    expect(read.view).toBeUndefined();
    expect(read.range).toBeUndefined();
    expect(read.from).toBeUndefined();
    expect(read.q).toBe('ok');
  });
});
