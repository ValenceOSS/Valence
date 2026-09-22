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
});
