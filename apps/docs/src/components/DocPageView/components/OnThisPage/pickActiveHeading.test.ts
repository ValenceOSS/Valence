import { describe, expect, it } from 'vitest';
import { pickActiveHeading } from '@ValenceDocs/components/DocPageView/components/OnThisPage/pickActiveHeading';

const positions = [
  { id: 'a', top: -400 },
  { id: 'b', top: 40 },
  { id: 'c', top: 600 },
];

describe('pickActiveHeading', () => {
  it('picks the last heading that has reached the line', () => {
    expect(pickActiveHeading(positions, 120, false)).toBe('b');
  });

  it('picks the first before any has been reached', () => {
    expect(pickActiveHeading([{ id: 'a', top: 300 }], 120, false)).toBe('a');
  });

  it('picks the last at the bottom of the page', () => {
    expect(pickActiveHeading(positions, 120, true)).toBe('c');
  });

  it('picks nothing where there are no headings', () => {
    expect(pickActiveHeading([], 120, false)).toBeNull();
  });
});
