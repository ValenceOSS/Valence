import { describe, expect, it } from 'vitest';
import { describeWords } from './describeWords';

describe('describeWords', () => {
  it.each([
    ['readAgain', 'Read again'],
    ['read-again', 'Read again'],
    ['read_again', 'Read again'],
    ['reachable', 'Reachable'],
    ['regenerateTrickplay', 'Regenerate trickplay'],
    ['CheckDisk2Space', 'Check disk2 space'],
    ['', ''],
  ])('says %s as %s', (name, said) => {
    expect(describeWords(name)).toBe(said);
  });
});
