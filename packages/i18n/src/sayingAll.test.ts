import { describe, expect, it } from 'vitest';
import { sayingAll } from './sayingAll';
import { sayingCount } from './sayingCount';

describe('sayingAll', () => {
  it('names one thing alone', () => {
    expect(sayingAll(['Alien']).message).toBe('Alien');
  });

  it('names two with "and" between them', () => {
    expect(sayingAll(['Alien', 'Heat']).message).toBe('Alien and Heat');
  });

  it('names several with commas and "and" before the last', () => {
    expect(sayingAll(['The Wire', 'Alien', 'Heat']).message).toBe('The Wire, Alien and Heat');
  });

  it('takes things said as well as names', () => {
    expect(
      sayingAll([sayingCount('common.count.episodes', 3), sayingCount('common.count.films', 1)])
        .message,
    ).toBe('3 episodes and 1 film');
  });
});
