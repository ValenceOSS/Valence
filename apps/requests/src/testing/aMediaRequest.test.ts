import { describe, expect, it } from 'vitest';
import { aMediaRequest } from './aMediaRequest';

describe('aMediaRequest', () => {
  it('makes an approved request for a film, with what was changed', () => {
    expect(aMediaRequest({ title: 'Heat' })).toMatchObject({
      kind: 'film',
      approval: 'approved',
      title: 'Heat',
    });
  });
});
