import { shortenedForAPhone } from './shortenedForAPhone';

describe('shortenedForAPhone', () => {
  it('shortens the long names of sound and picture formats', () => {
    expect(shortenedForAPhone('Dolby Atmos')).toBe('Atmos');
    expect(shortenedForAPhone('Dolby Vision')).toBe('DV');
  });

  it('leaves a badge that is already short as it is', () => {
    expect(shortenedForAPhone('4K')).toBe('4K');
  });
});
