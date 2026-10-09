import { describe, expect, it } from 'vitest';
import { namesOfAskers } from './namesOfAskers';

describe('namesOfAskers', () => {
  it('names the first asker alone', () => {
    expect(namesOfAskers({ requestedBy: { id: 'p', name: 'Priya' }, alsoAskedBy: [] })).toBe(
      'Priya',
    );
  });

  it('names everybody who asked, the first first', () => {
    expect(
      namesOfAskers({
        requestedBy: { id: 'p', name: 'Priya' },
        alsoAskedBy: [
          { id: 's', name: 'Sam' },
          { id: 'a', name: 'Ali' },
        ],
      }),
    ).toBe('Priya, Sam and Ali');
  });
});
