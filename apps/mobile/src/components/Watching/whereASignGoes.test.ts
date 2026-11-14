import { whereASignGoes } from './whereASignGoes';

const SCREEN = { width: 800, height: 400 };

const FRAME = { left: 100, top: 0, width: 600, height: 400 };

const THE_SCREEN = { left: 0, top: 0, width: 800, height: 400 };

const WIDER = { left: -200, top: -50, width: 1200, height: 500 };

describe('whereASignGoes', () => {
  it('starts a sign aligned to its top left at the point, with the rest of the screen to run into', () => {
    expect(whereASignGoes({ x: 0.5, y: 0.25 }, 7, FRAME, SCREEN)).toEqual({
      left: 400,
      maxWidth: 400,
      top: 100,
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      textAlign: 'left',
    });
  });

  it('ends a sign aligned to its bottom right at the point', () => {
    expect(whereASignGoes({ x: 0.5, y: 0.75 }, 3, FRAME, SCREEN)).toEqual({
      right: 400,
      maxWidth: 400,
      bottom: 100,
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      textAlign: 'right',
    });
  });

  it('centres a sign aligned to its middle on the point, as wide and tall as the screen allows', () => {
    expect(whereASignGoes({ x: 0.25, y: 0.25 }, 5, FRAME, SCREEN)).toEqual({
      left: 0,
      width: 500,
      top: 0,
      height: 200,
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
    });
  });

  it('finds the point on the frame as drawn, wherever that sits on the screen', () => {
    expect(whereASignGoes({ x: 0.5, y: 0.5 }, 7, WIDER, SCREEN)).toMatchObject({
      left: 400,
      top: 200,
    });
  });

  it('holds a point past the edge of the screen at the edge', () => {
    expect(whereASignGoes({ x: 0.05, y: 0.02 }, 7, WIDER, SCREEN)).toMatchObject({
      left: 0,
      maxWidth: 800,
      top: 0,
    });
    expect(whereASignGoes({ x: 0.98, y: 0.99 }, 3, WIDER, SCREEN)).toMatchObject({
      right: 0,
      maxWidth: 800,
      bottom: 0,
    });
  });

  it('keeps a sign centred near the left or right edge at least half the screen wide', () => {
    expect(whereASignGoes({ x: 1 / 32, y: 7 / 8 }, 2, THE_SCREEN, SCREEN)).toEqual({
      left: -175,
      width: 400,
      bottom: 50,
      alignItems: 'center',
      justifyContent: 'flex-end',
      textAlign: 'center',
    });
    expect(whereASignGoes({ x: 31 / 32, y: 1 / 32 }, 8, THE_SCREEN, SCREEN)).toEqual({
      left: 575,
      width: 400,
      top: 12.5,
      alignItems: 'center',
      justifyContent: 'flex-start',
      textAlign: 'center',
    });
    expect(whereASignGoes({ x: 1 / 32, y: 1 / 2 }, 5, THE_SCREEN, SCREEN)).toMatchObject({
      left: -175,
      width: 400,
    });
    expect(whereASignGoes({ x: 31 / 32, y: 1 / 2 }, 5, THE_SCREEN, SCREEN)).toMatchObject({
      left: 575,
      width: 400,
    });
  });

  it('keeps a sign centred on a point past the left or right edge half the screen wide', () => {
    expect(whereASignGoes({ x: 0.05, y: 0.5 }, 2, WIDER, SCREEN)).toMatchObject({
      left: -200,
      width: 400,
    });
    expect(whereASignGoes({ x: 0.99, y: 0.5 }, 2, WIDER, SCREEN)).toMatchObject({
      left: 600,
      width: 400,
    });
    expect(whereASignGoes({ x: 0.05, y: 0.5 }, 5, WIDER, SCREEN)).toMatchObject({
      left: -200,
      width: 400,
    });
    expect(whereASignGoes({ x: 0.99, y: 0.5 }, 8, WIDER, SCREEN)).toMatchObject({
      left: 600,
      width: 400,
    });
  });

  it('keeps a sign centred near the top or the foot at least a quarter of the screen tall', () => {
    expect(whereASignGoes({ x: 1 / 2, y: 1 / 32 }, 5, THE_SCREEN, SCREEN)).toEqual({
      left: 0,
      width: 800,
      top: -37.5,
      height: 100,
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
    });
    expect(whereASignGoes({ x: 1 / 2, y: 31 / 32 }, 5, THE_SCREEN, SCREEN)).toMatchObject({
      top: 337.5,
      height: 100,
    });
  });

  it('keeps a sign centred on a point past the top or the foot a quarter of the screen tall', () => {
    expect(whereASignGoes({ x: 0.5, y: 0.02 }, 5, WIDER, SCREEN)).toMatchObject({
      top: -50,
      height: 100,
    });
    expect(whereASignGoes({ x: 0.5, y: 0.99 }, 5, WIDER, SCREEN)).toMatchObject({
      top: 350,
      height: 100,
    });
  });

  it('hangs a sign at the top or the foot from a point near or past that edge', () => {
    expect(whereASignGoes({ x: 1 / 2, y: 1 / 32 }, 8, THE_SCREEN, SCREEN)).toMatchObject({
      top: 12.5,
    });
    expect(whereASignGoes({ x: 0.5, y: 0.02 }, 8, WIDER, SCREEN)).toMatchObject({ top: 0 });
    expect(whereASignGoes({ x: 1 / 2, y: 31 / 32 }, 2, THE_SCREEN, SCREEN)).toMatchObject({
      bottom: 12.5,
    });
    expect(whereASignGoes({ x: 0.5, y: 0.99 }, 2, WIDER, SCREEN)).toMatchObject({ bottom: 0 });
  });

  it('gives a sign anchored by a side near the far edge half the screen to run into', () => {
    expect(whereASignGoes({ x: 31 / 32, y: 1 / 2 }, 7, THE_SCREEN, SCREEN)).toMatchObject({
      left: 775,
      maxWidth: 400,
    });
    expect(whereASignGoes({ x: 1 / 32, y: 1 / 2 }, 3, THE_SCREEN, SCREEN)).toMatchObject({
      right: 775,
      maxWidth: 400,
    });
  });

  it('gives a sign anchored by a side to a point held at the far edge half the screen to run into', () => {
    expect(whereASignGoes({ x: 0.99, y: 0.99 }, 7, WIDER, SCREEN)).toEqual({
      left: 800,
      maxWidth: 400,
      top: 400,
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      textAlign: 'left',
    });
    expect(whereASignGoes({ x: 0.99, y: 0.02 }, 1, WIDER, SCREEN)).toEqual({
      left: 800,
      maxWidth: 400,
      bottom: 400,
      alignItems: 'flex-start',
      justifyContent: 'flex-end',
      textAlign: 'left',
    });
    expect(whereASignGoes({ x: 0.05, y: 0.99 }, 9, WIDER, SCREEN)).toEqual({
      right: 800,
      maxWidth: 400,
      top: 400,
      alignItems: 'flex-end',
      justifyContent: 'flex-start',
      textAlign: 'right',
    });
    expect(whereASignGoes({ x: 0.05, y: 0.02 }, 3, WIDER, SCREEN)).toEqual({
      right: 800,
      maxWidth: 400,
      bottom: 400,
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      textAlign: 'right',
    });
  });

  it('reads an alignment off the keypad as the nearest key there is', () => {
    expect(whereASignGoes({ x: 0.5, y: 0.5 }, 12, FRAME, SCREEN)).toMatchObject({
      alignItems: 'flex-end',
      justifyContent: 'flex-start',
    });
    expect(whereASignGoes({ x: 0.5, y: 0.5 }, 0, FRAME, SCREEN)).toMatchObject({
      alignItems: 'flex-start',
      justifyContent: 'flex-end',
    });
  });
});
