import { describe, expect, it } from 'vitest';
import { describeArrival } from './describeArrival';

describe('describeArrival', () => {
  it('names a programme once with how much of it arrived', () => {
    expect(describeArrival({ title: '24', episodes: 24 })).toBe('24 — 24 episodes');
  });

  it('says a film by name alone, having no episodes to count', () => {
    expect(describeArrival({ title: 'Brazil (1985)', episodes: 1 })).toBe('Brazil (1985)');
  });

  it('says a lone episode by name alone rather than counting to one', () => {
    expect(describeArrival({ title: 'The Bear', episodes: 1 })).toBe('The Bear');
  });
});
