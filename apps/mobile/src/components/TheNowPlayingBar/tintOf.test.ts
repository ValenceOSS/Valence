import { tintOf } from './tintOf';

describe('tintOf', () => {
  it('takes the most vivid light and darkens it to sit words on', () => {
    expect(
      tintOf([
        { colour: 'rgb(120, 120, 120)', at: '8% 10%' },
        { colour: 'rgb(200, 40, 40)', at: '36% 10%' },
      ]),
    ).toBe('rgb(84, 17, 17)');
  });

  it('has no tint without lights to take one from', () => {
    expect(tintOf([])).toBeNull();
  });
});
