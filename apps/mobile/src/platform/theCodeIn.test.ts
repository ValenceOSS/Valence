import { theCodeIn } from './theCodeIn';

describe('theCodeIn', () => {
  it('reads the code off the address', () => {
    expect(theCodeIn('valence://signed-in?code=abc')).toBe('abc');
  });

  it('reads it wherever it falls among the rest', () => {
    expect(theCodeIn('valence://signed-in?from=web&code=abc&then=1')).toBe('abc');
  });

  it('undoes what was escaped to carry it', () => {
    expect(theCodeIn('valence://signed-in?code=a%2Bb%2Fc')).toBe('a+b/c');
  });

  it('finds nothing where there is none', () => {
    expect(theCodeIn('valence://signed-in')).toBeNull();
  });

  it('does not mistake a longer name for it', () => {
    expect(theCodeIn('valence://signed-in?postcode=abc')).toBeNull();
  });
});
