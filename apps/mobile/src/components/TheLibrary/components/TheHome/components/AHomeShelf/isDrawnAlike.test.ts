import { isDrawnAlike } from './isDrawnAlike';
import type { AHomeShelfProps } from './AHomeShelf.types';
import type { Rail } from '@ValenceClient/library/groupIntoRails';

const rail: Rail = { id: 'recent', title: 'Recently added', items: [] };

const drawnFrom: AHomeShelfProps = {
  shelf: { kind: 'rail', rail },
  upcoming: [],
  progress: new Map(),
  today: '2026-09-24',
  onLookAt: jest.fn(),
  onLookAtShow: jest.fn(),
  flagOf: () => null,
};

describe('isDrawnAlike', () => {
  it('draws a row again only when what it is drawn from changes, however the page wraps it', () => {
    expect(isDrawnAlike(drawnFrom, { ...drawnFrom, shelf: { kind: 'rail', rail } })).toBe(true);
    expect(
      isDrawnAlike(drawnFrom, { ...drawnFrom, shelf: { kind: 'rail', rail: { ...rail } } }),
    ).toBe(false);
    expect(isDrawnAlike(drawnFrom, { ...drawnFrom, progress: new Map() })).toBe(false);
    expect(isDrawnAlike(drawnFrom, { ...drawnFrom, flagOf: () => null })).toBe(false);
    expect(isDrawnAlike(drawnFrom, { ...drawnFrom, onLookAt: jest.fn() })).toBe(false);
    expect(isDrawnAlike(drawnFrom, { ...drawnFrom, onDismiss: jest.fn() })).toBe(false);
    expect(isDrawnAlike(drawnFrom, { ...drawnFrom, onLookAtShow: jest.fn() })).toBe(false);
  });

  it('leaves a row alone when only what is coming up changes', () => {
    expect(isDrawnAlike(drawnFrom, { ...drawnFrom, upcoming: [], today: '2026-09-25' })).toBe(true);
  });

  it('draws what is coming up again only when it, or the day, changes', () => {
    const comingUp: AHomeShelfProps = { ...drawnFrom, shelf: { kind: 'comingUp' } };

    expect(isDrawnAlike(comingUp, { ...comingUp, shelf: { kind: 'comingUp' } })).toBe(true);
    expect(isDrawnAlike(comingUp, { ...comingUp, progress: new Map() })).toBe(true);
    expect(isDrawnAlike(comingUp, { ...comingUp, upcoming: [] })).toBe(false);
    expect(isDrawnAlike(comingUp, { ...comingUp, today: '2026-09-25' })).toBe(false);
    expect(isDrawnAlike(comingUp, drawnFrom)).toBe(false);
  });
});
