import { deckStylesOf } from './deckStylesOf';

describe('deckStylesOf', () => {
  it('draws three cards in the box, the front one in the ink and the two behind faded into the ground', () => {
    const styles = deckStylesOf(120, 90, 1, '#ffffff', '#000000');

    expect(styles.box).toEqual({ width: 120, height: 90 });
    expect(styles.cards.map((card) => card.card.backgroundColor)).toEqual([
      '#242424',
      '#474747',
      '#ffffff',
    ]);
  });

  it('cuts each face through in the ground', () => {
    const [front] = deckStylesOf(120, 90, 1, '#ffffff', '#101010').cards.slice(-1);

    expect(front?.ring.borderColor).toBe('#101010');
    expect(front?.caps.map((cap) => cap.backgroundColor)).toEqual(['#101010', '#101010']);
  });

  it('hides the frowns while the deck is stacked, and keeps the smile', () => {
    const stacked = deckStylesOf(120, 90, 0, '#ffffff', '#000000').cards;

    expect(stacked.map((card) => card.face.opacity)).toEqual([0, 0, 1]);
  });

  it('stacks the cards in one place before they fan out', () => {
    const stacked = deckStylesOf(120, 90, 0, '#ffffff', '#000000').cards;
    const fanned = deckStylesOf(120, 90, 1, '#ffffff', '#000000').cards;

    expect(new Set(stacked.map((card) => JSON.stringify(card.card.transform))).size).toBe(1);
    expect(new Set(fanned.map((card) => JSON.stringify(card.card.transform))).size).toBe(3);
  });
});
