import { describe, expect, it } from 'vitest';
import { cuesOfScript } from './cuesOfScript';

const SCRIPT = [
  '[Events]',
  'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  'Dialogue: 0,0:00:01.00,0:00:02.00,Default,,0,0,0,,Spoken',
].join('\n');

describe('cuesOfScript', () => {
  it('reads the lines of a script', () => {
    expect(cuesOfScript(SCRIPT)?.map((cue) => cue.spans[0]?.text)).toEqual(['Spoken']);
  });

  it('answers nothing where there is no script', () => {
    expect(cuesOfScript(null)).toBeNull();
  });

  it('answers nothing for a script with no line in it, so the plain track is read instead', () => {
    expect(cuesOfScript('[Script Info]\nTitle: Nothing said')).toBeNull();
  });
});
