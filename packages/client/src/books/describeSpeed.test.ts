import { describe, expect, it } from 'vitest';
import { describeSpeed } from '@ValenceClient/books/describeSpeed';

describe('describeSpeed', () => {
  it('says a speed as a multiple of the speed a book is read at', () => {
    expect(describeSpeed(1)).toBe('1×');
    expect(describeSpeed(1.25)).toBe('1.25×');
  });
});
