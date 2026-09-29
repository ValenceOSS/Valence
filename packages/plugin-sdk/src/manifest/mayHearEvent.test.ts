import { describe, expect, it } from 'vitest';
import { mayHearEvent } from './mayHearEvent';

describe('mayHearEvent', () => {
  it('tells a plugin about watching only with its viewing permission', () => {
    expect(mayHearEvent([{ kind: 'viewing', access: 'read' }], 'playback.finished')).toBe(true);
    expect(mayHearEvent([{ kind: 'library', access: 'read' }], 'playback.started')).toBe(false);
  });

  it('tells a plugin about the library only with its library permission', () => {
    expect(mayHearEvent([{ kind: 'library', access: 'read' }], 'media.added')).toBe(true);
    expect(mayHearEvent([{ kind: 'viewing', access: 'write' }], 'library.scanned')).toBe(false);
    expect(mayHearEvent([], 'requests.available')).toBe(false);
  });
});
