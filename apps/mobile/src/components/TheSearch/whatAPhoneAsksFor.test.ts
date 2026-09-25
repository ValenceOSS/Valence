import { whatAPhoneAsksFor } from './whatAPhoneAsksFor';

describe('whatAPhoneAsksFor', () => {
  it('asks for films and programmes', () => {
    expect(whatAPhoneAsksFor('film')).toBe(true);
    expect(whatAPhoneAsksFor('series')).toBe(true);
  });

  it('leaves music and books for later', () => {
    expect(whatAPhoneAsksFor('album')).toBe(false);
    expect(whatAPhoneAsksFor('artist')).toBe(false);
    expect(whatAPhoneAsksFor('book')).toBe(false);
  });
});
