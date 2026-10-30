import { cardTintOf } from './cardTintOf';

describe('cardTintOf', () => {
  it('takes its colour from the foot of the picture, not from what is most vivid above it', () => {
    const tint = cardTintOf([
      { colour: 'rgb(230, 120, 60)', at: '50% 10%' },
      { colour: 'rgb(30, 90, 40)', at: '25% 90%' },
      { colour: 'rgb(30, 90, 40)', at: '75% 90%' },
    ]);

    expect(tint).toBe('rgb(25, 56, 30)');
  });

  it('holds a warm foot near charcoal, so a face does not turn the card brown', () => {
    expect(cardTintOf([{ colour: 'rgb(200, 120, 60)', at: '50% 90%' }])).toBe('rgb(47, 40, 34)');
  });

  it('has no tint without lights to take one from', () => {
    expect(cardTintOf([])).toBeNull();
  });
});
