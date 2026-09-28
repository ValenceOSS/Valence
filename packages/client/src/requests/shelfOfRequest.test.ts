import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { shelfOfRequest } from './shelfOfRequest';

const TODAY = '2026-09-20';

describe('shelfOfRequest', () => {
  it('puts a request by what it needs next', () => {
    expect(shelfOfRequest(aMediaRequest({ state: 'awaitingApproval' }), TODAY)).toBe('approve');
    expect(shelfOfRequest(aMediaRequest({ state: 'downloading' }), TODAY)).toBe('progress');
    expect(shelfOfRequest(aMediaRequest({ state: 'failed' }), TODAY)).toBe('wanted');
    expect(shelfOfRequest(aMediaRequest({ state: 'available' }), TODAY)).toBe('here');
    expect(shelfOfRequest(aMediaRequest({ state: 'refused' }), TODAY)).toBe('refused');
  });

  it('tells a film that is not out yet from one that is out and waiting to be searched for', () => {
    expect(
      shelfOfRequest(aMediaRequest({ state: 'waiting', releaseDate: '2027-01-01' }), TODAY),
    ).toBe('coming');
    expect(shelfOfRequest(aMediaRequest({ state: 'waiting', releaseDate: null }), TODAY)).toBe(
      'progress',
    );
  });
});
