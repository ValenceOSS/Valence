import { describe, expect, it } from 'vitest';
import { describeTitleDetails } from './describeTitleDetails';

describe('describeTitleDetails', () => {
  it('names what the critics thought', () => {
    expect(describeTitleDetails({ rottenTomatoes: 93 })).toEqual([
      { label: 'Rotten Tomatoes', value: '93%' },
    ]);
  });

  it('leaves out what nobody knows, and money that was never counted', () => {
    expect(describeTitleDetails({ status: '', budget: 0, revenue: null })).toEqual([]);
  });

  it('says when it came out', () => {
    expect(describeTitleDetails({ releaseDate: '2016-11-11' })[0]?.label).toBe('Released');
  });

  it('says an episode aired rather than came out', () => {
    expect(describeTitleDetails({ seriesTitle: 'ted', releaseDate: '2024-01-11' })[0]?.label).toBe(
      'Aired',
    );
  });

  it('says nothing of how the programme stands on one of its episodes', () => {
    expect(describeTitleDetails({ seriesTitle: 'ted', status: 'Ended' })).toEqual([]);
  });
});
