import { describe, expect, it } from 'vitest';
import { saying } from './saying';
import { wordsFor } from './wordsFor';

describe('wordsFor', () => {
  it('keeps words and numbers, and puts anything said in turn into words', () => {
    expect(
      wordsFor({ name: 'NZBGet', status: 500, why: saying('common.noReasonGiven') }, (inner) =>
        inner.message.toUpperCase(),
      ),
    ).toEqual({ name: 'NZBGet', status: 500, why: 'NO REASON GIVEN' });
  });
});
