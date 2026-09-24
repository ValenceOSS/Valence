import { describe, expect, it } from 'vitest';
import { LISTENING_CHOICES } from '@ValenceClient/books/LISTENING_CHOICES';

describe('LISTENING_CHOICES', () => {
  it('offers the speed a book is read at among the speeds', () => {
    expect(LISTENING_CHOICES.speeds).toContain(1);
  });

  it('goes back less far than it goes on', () => {
    expect(LISTENING_CHOICES.backSeconds).toBeLessThan(LISTENING_CHOICES.forwardSeconds);
  });
});
