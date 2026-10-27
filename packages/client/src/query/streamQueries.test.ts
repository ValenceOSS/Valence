import { describe, expect, it } from 'vitest';
import { streamQueries } from './streamQueries';

describe('streamQueries', () => {
  it('asks for a film’s offers only once somebody has asked to play it', () => {
    expect(streamQueries.offers(603, false).enabled).toBe(false);
    expect(streamQueries.offers(603, true)).toMatchObject({
      queryKey: ['streams', 'offers', 603],
      enabled: true,
    });
  });

  it('asks for the hidden library only where films are played from sources', () => {
    expect(streamQueries.library(false).enabled).toBe(false);
    expect(streamQueries.library(true).queryKey).toEqual(['streams', 'library']);
  });
});
