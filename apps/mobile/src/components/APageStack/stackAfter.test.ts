import { stackAfter } from './stackAfter';

const aPage = (key: string) => ({ key, page: null });

describe('stackAfter', () => {
  it('starts the pages it is first given in place, the top one in place and the rest beneath it', () => {
    const held = stackAfter(null, [aPage('home'), aPage('title')], null);

    expect(held.places.get('home')?.value).toBe(-1);
    expect(held.places.get('title')?.value).toBe(0);
  });

  it('starts a page opened on top off to the side, and keeps where the others stood', () => {
    const first = stackAfter(null, [aPage('home')], null);
    const after = stackAfter(first, [aPage('home'), aPage('title')], null);

    expect(after.places.get('home')).toBe(first.places.get('home'));
    expect(after.places.get('title')?.value).toBe(1);
  });

  it('gives a page swapped in on top the slot and place of the one it replaced', () => {
    const first = stackAfter(null, [aPage('home'), aPage('asking')], null);
    const after = stackAfter(first, [aPage('home'), aPage('title')], null);

    expect(after.slots.get('title')).toBe('asking');
    expect(after.places.get('asking')).toBe(first.places.get('asking'));
  });

  it('keeps the slot of a page on its way out, giving one opened over it a slot of its own', () => {
    const asking = stackAfter(null, [aPage('home'), aPage('asking')], null);
    const swapped = stackAfter(asking, [aPage('home'), aPage('title')], null);
    const popped = stackAfter(swapped, [aPage('home')], aPage('title'));
    const reopened = stackAfter(popped, [aPage('home'), aPage('asking')], aPage('title'));

    expect(popped.slots.get('title')).toBe('asking');
    expect(reopened.slots.get('title')).toBe('asking');
    expect(reopened.slots.get('asking')).not.toBe('asking');
    expect(reopened.places.get(reopened.slots.get('asking') ?? '')?.value).toBe(1);
  });

  it('lets go of the slots of pages no longer drawn', () => {
    const first = stackAfter(null, [aPage('home'), aPage('shelf'), aPage('title')], null);
    const after = stackAfter(first, [aPage('home')], aPage('title'));

    expect([...after.slots.keys()]).toEqual(['title', 'home']);
  });
});
