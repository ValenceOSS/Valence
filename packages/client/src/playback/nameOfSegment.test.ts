import { describe, expect, it } from 'vitest';
import { nameOfSegment } from './nameOfSegment';

describe('nameOfSegment', () => {
  it('names each kind of marked stretch', () => {
    expect(nameOfSegment('intro')).toBe('Intro');
    expect(nameOfSegment('recap')).toBe('Recap');
    expect(nameOfSegment('credits')).toBe('Credits');
    expect(nameOfSegment('preview')).toBe('Next time');
  });
});
