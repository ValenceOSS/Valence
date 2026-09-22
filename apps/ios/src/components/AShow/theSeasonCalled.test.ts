import { theSeasonCalled } from './theSeasonCalled';

describe('theSeasonCalled', () => {
  it('calls a season by its number', () => {
    expect(theSeasonCalled(2)).toBe('Season 2');
  });

  it('calls season nought specials, since that is what they are', () => {
    expect(theSeasonCalled(0)).toBe('Specials');
  });

  it('calls a season nobody numbered the rest of it', () => {
    expect(theSeasonCalled(null)).toBe('Other');
  });
});
