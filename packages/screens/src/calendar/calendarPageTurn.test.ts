import { describe, expect, it } from 'vitest';
import { calendarPageTurn } from './calendarPageTurn';
import type { Variant } from 'motion/react';

const resolve = (variant: Variant | undefined, direction: number) =>
  typeof variant === 'function' ? variant(direction, {}, {}) : variant;

describe('calendarPageTurn', () => {
  it('slides the next page in from the side it was turned towards', () => {
    const turn = calendarPageTurn(false);

    expect(resolve(turn.enter, 1)).toMatchObject({ opacity: 0, x: 48, y: 0 });
    expect(resolve(turn.enter, -1)).toMatchObject({ opacity: 0, x: -48, y: 0 });
  });

  it('slides the old page out of the other side', () => {
    const turn = calendarPageTurn(false);

    expect(resolve(turn.leave, 1)).toMatchObject({ opacity: 0, x: -48 });
    expect(resolve(turn.leave, -1)).toMatchObject({ opacity: 0, x: 48 });
  });

  it('lifts a new view into place rather than sliding it', () => {
    expect(resolve(calendarPageTurn(false).enter, 0)).toMatchObject({ opacity: 0, x: 0, y: 10 });
  });

  it('settles every page in the centre', () => {
    expect(resolve(calendarPageTurn(false).centre, 1)).toMatchObject({ opacity: 1, x: 0, y: 0 });
  });

  it('moves before the system has said whether less motion is wanted', () => {
    expect(resolve(calendarPageTurn(null).enter, 1)).toMatchObject({ x: 48 });
  });

  it('only fades for somebody who asked for less motion', () => {
    const turn = calendarPageTurn(true);

    expect(resolve(turn.enter, 1)).toEqual({ opacity: 0 });
    expect(resolve(turn.centre, 1)).toMatchObject({ opacity: 1 });
    expect(resolve(turn.centre, 1)).not.toHaveProperty('x');
    expect(resolve(turn.leave, 1)).toMatchObject({ opacity: 0 });
    expect(resolve(turn.leave, 1)).not.toHaveProperty('x');
  });
});
