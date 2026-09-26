import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as Motion from 'motion/react';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { FaceFlight } from './FaceFlight';

const motion = vi.hoisted((): { isReduced: boolean; moves: Record<string, number>[] } => ({
  isReduced: false,
  moves: [],
}));

vi.mock('motion/react', async (original) => {
  const real = await original<typeof Motion>();

  return {
    ...real,
    useReducedMotionConfig: () => motion.isReduced,
    useAnimate: () => {
      const scope = { current: null, animations: [] };

      return [
        scope,
        (_: Element, to: Record<string, number>) => {
          motion.moves.push(to);

          return Promise.resolve();
        },
      ];
    },
  };
});

const PROFILE: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Marques',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: 'gilroy' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const AT = { x: 100, y: 200, width: 160, height: 160 };

afterEach(() => {
  motion.isReduced = false;
  motion.moves = [];
  document.body.innerHTML = '';
  delete document.documentElement.dataset['faceArriving'];
});

describe('FaceFlight', () => {
  it('draws the face where it was on the way in', () => {
    const { container } = render(<FaceFlight profile={PROFILE} at={AT} onLanded={vi.fn()} />);

    expect(container.firstElementChild).toHaveStyle({ left: '100px', top: '200px' });
  });

  it('lifts and rounds the face, then springs it into the place the bar drew', async () => {
    const place = document.createElement('span');

    place.dataset['faceLands'] = '';
    place.getBoundingClientRect = () => DOMRect.fromRect({ x: 900, y: 12, width: 32, height: 32 });
    document.body.append(place);

    const onLanded = vi.fn();

    render(<FaceFlight profile={PROFILE} at={AT} onLanded={onLanded} />);

    await waitFor(() => {
      expect(onLanded).toHaveBeenCalled();
    });

    expect(motion.moves[0]).toMatchObject({ borderRadius: 80 });
    expect(motion.moves[1]).toEqual({ x: 736, y: -252, scale: 0.2 });
    expect(document.documentElement.dataset['faceArriving']).toBeUndefined();
  });

  it('says the face is in the air while it flies, so the bar hides its own', () => {
    render(<FaceFlight profile={PROFILE} at={AT} onLanded={vi.fn()} />);

    expect(document.documentElement.dataset['faceArriving']).toBe('true');
  });

  it('lands at once for somebody who asked for less movement', () => {
    motion.isReduced = true;

    const onLanded = vi.fn();

    render(<FaceFlight profile={PROFILE} at={AT} onLanded={onLanded} />);

    expect(onLanded).toHaveBeenCalled();
    expect(motion.moves).toEqual([]);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FaceFlight.displayName).toBe('FaceFlight');
  });
});
