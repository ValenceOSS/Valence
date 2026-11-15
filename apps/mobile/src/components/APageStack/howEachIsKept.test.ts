import { howEachIsKept } from './howEachIsKept';

const aPage = (key: string, isCard = false) => ({ key, page: null, isCard });

describe('howEachIsKept', () => {
  it('keeps the top page and the one beneath it live, and freezes and detaches the rest', () => {
    const pages = [aPage('home'), aPage('shelf'), aPage('middle'), aPage('top')];

    expect([...howEachIsKept(pages, pages)]).toEqual([
      ['top', { activity: 2, isFrozen: false }],
      ['middle', { activity: 1, isFrozen: false }],
      ['shelf', { activity: 0, isFrozen: true }],
      ['home', { activity: 0, isFrozen: true }],
    ]);
  });

  it('keeps on the screen, frozen, a page that shows around the page a card shrinks', () => {
    const pages = [aPage('home'), aPage('shelf'), aPage('middle'), aPage('card', true)];
    const kept = howEachIsKept(pages, pages);

    expect(kept.get('shelf')).toEqual({ activity: 1, isFrozen: true });
    expect(kept.get('home')).toEqual({ activity: 0, isFrozen: true });
  });

  it('keeps a page on its way out live, with the two beneath it', () => {
    const pages = [aPage('home'), aPage('shelf'), aPage('middle')];
    const leaving = aPage('gone');
    const kept = howEachIsKept([...pages, leaving], pages);

    expect(kept.get('gone')).toEqual({ activity: 1, isFrozen: false });
    expect(kept.get('middle')).toEqual({ activity: 2, isFrozen: false });
    expect(kept.get('shelf')).toEqual({ activity: 1, isFrozen: false });
    expect(kept.get('home')).toEqual({ activity: 0, isFrozen: true });
  });
});
