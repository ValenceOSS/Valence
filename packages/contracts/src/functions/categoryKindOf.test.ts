import { describe, expect, it } from 'vitest';
import { categoryKindOf } from './categoryKindOf';

describe('categoryKindOf', () => {
  it('files anime under the series category, and every other kind under its own', () => {
    expect(categoryKindOf('anime')).toBe('shows');
    expect(categoryKindOf('movies')).toBe('movies');
    expect(categoryKindOf('books')).toBe('books');
  });
});
