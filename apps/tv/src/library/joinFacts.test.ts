import { joinFacts } from '@ValenceTv/library/joinFacts';

describe('joinFacts', () => {
  it('puts the known facts on one line in the order given', () => {
    expect(joinFacts(['2023', '2h 10m', 'Drama'])).toBe('2023   ·   2h 10m   ·   Drama');
  });

  it('leaves out what is not known or is empty', () => {
    expect(joinFacts([null, '2023', undefined, '', 'PG'])).toBe('2023   ·   PG');
  });

  it('is an empty line when nothing is known', () => {
    expect(joinFacts([null, undefined])).toBe('');
  });
});
