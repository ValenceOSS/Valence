import { describe, expect, it } from 'vitest';
import { parseAssOverrides } from './parseAssOverrides';

const read = (block: string) => parseAssOverrides(block);

describe('reading the overrides a line carries in braces', () => {
  it('reads the switches that turn lettering on and off', () => {
    expect(read('\\b1\\i1\\u1\\s1').style).toEqual({
      isBold: true,
      isItalic: true,
      isUnderlined: true,
      isStruckThrough: true,
    });

    expect(read('\\b0\\i0').style).toEqual({ isBold: false, isItalic: false });
  });

  it('reads a numbered weight as bold where it is heavy enough to be', () => {
    expect(read('\\b700').style.isBold).toBe(true);
    expect(read('\\b400').style.isBold).toBe(false);
  });

  it('reads the primary colour, by either of the two names it goes by', () => {
    expect(read('\\c&HFF0000&').style.colour).toBe('#0000ff');
    expect(read('\\1c&H0000FF&').style.colour).toBe('#ff0000');
  });

  it('reads a transparency, by either of the two names it goes by', () => {
    expect(read('\\alpha&HFF&').style.opacity).toBe(0);
    expect(read('\\1a&H00&').style.opacity).toBe(1);
  });

  it('reads a font by name and a size by number', () => {
    expect(read('\\fnImpact\\fs72').style).toEqual({ fontFamily: 'Impact', fontSize: 72 });
  });

  it('reads where the line goes, which belongs to the line and not to the lettering', () => {
    expect(read('\\pos(1400,180)').position).toEqual({ x: 1400, y: 180 });
    expect(read('\\pos( 12.5 , 30 )').position).toEqual({ x: 12.5, y: 30 });
  });

  it('reads an alignment as a keypad position', () => {
    expect(read('\\an7').alignment).toBe(7);
    expect(read('\\a6').alignment).toBe(8);
  });

  it('notices a line told to start over, from its own style or from one it names', () => {
    expect(read('\\r').reset).toBe('');
    expect(read('\\rSigns').reset).toBe('Signs');
    expect(read('\\b1').reset).toBeNull();
  });

  it('takes several tags out of one block', () => {
    const found = read('\\pos(100,200)\\an5\\i1\\c&H00FF00&\\fs40');

    expect(found.position).toEqual({ x: 100, y: 200 });
    expect(found.alignment).toBe(5);
    expect(found.style).toEqual({ isItalic: true, colour: '#00ff00', fontSize: 40 });
  });

  it('ignores what a client cannot draw rather than leaving the codes in', () => {
    const found = read('\\t(0,500,\\frz360)\\k50\\blur4\\fscx120\\shad3\\fad(200,200)\\org(1,2)');

    expect(found).toEqual({
      style: {},
      alignment: null,
      position: null,
      drawing: null,
      reset: null,
    });
  });

  it('puts a moving line where its move starts', () => {
    expect(read('\\move(100,200,800,600)').position).toEqual({ x: 100, y: 200 });
    expect(read('\\move(10, 20, 30, 40, 0, 500)').position).toEqual({ x: 10, y: 20 });
  });

  it('notices a run switching into a vector drawing and back', () => {
    expect(read('\\p1').drawing).toBe(1);
    expect(read('\\p0').drawing).toBe(0);
    expect(read('\\pos(1,2)').drawing).toBeNull();
    expect(read('\\pbo-50').drawing).toBeNull();
  });

  it('does not take what an animation changes a line into for how it starts', () => {
    const found = read('\\alpha&H00&\\t(0,3000,\\alpha&HFF&\\fs80)\\i1');

    expect(found.style).toEqual({ opacity: 1, isItalic: true });
  });

  it('skips an animation whose brackets nest', () => {
    const found = read('\\t(0,500,\\clip(0,0,10,10)\\c&H0000FF&)\\b1');

    expect(found.style).toEqual({ isBold: true });
  });

  it('reads the older alignment the older way in any script', () => {
    expect(read('\\a5').alignment).toBe(7);
    expect(read('\\a10').alignment).toBe(5);
  });

  it('refuses a position or a size whose numbers are not numbers', () => {
    expect(read('\\pos(1.2.3,4)').position).toBeNull();
    expect(read('\\fs1.2.3').style.fontSize).toBeUndefined();
  });

  it('does not mistake a tag that merely starts the same way for another', () => {
    expect(read('\\blur4').style.isBold).toBeUndefined();
    expect(read('\\iclip(1,2,3,4)').style.isItalic).toBeUndefined();
    expect(read('\\fscx120').style.fontSize).toBeUndefined();
    expect(read('\\shad2').style.isStruckThrough).toBeUndefined();
    expect(read('\\alpha&H80&').alignment).toBeNull();
  });

  it('lets a later tag win over an earlier one, since that is the order they apply in', () => {
    expect(read('\\i1\\i0').style.isItalic).toBe(false);
    expect(read('\\c&HFF0000&\\c&H00FF00&').style.colour).toBe('#00ff00');
  });

  it('finds nothing in an empty block, and says so without failing', () => {
    expect(read('')).toEqual({
      style: {},
      alignment: null,
      position: null,
      drawing: null,
      reset: null,
    });
  });
});
