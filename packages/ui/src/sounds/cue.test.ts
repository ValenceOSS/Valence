import { afterEach, describe, expect, it, vi } from 'vitest';
import { cue } from './cue';
import { SOUNDS } from './SOUNDS';

const played = vi.hoisted(() => vi.fn());

vi.mock('cuelume', () => ({ play: played }));

afterEach(() => {
  SOUNDS.isOn = false;
  played.mockReset();
});

describe('cue', () => {
  it('stays silent until sounds are turned on', () => {
    cue('success');

    expect(played).not.toHaveBeenCalled();
  });

  it('plays the sound asked for once they are', () => {
    SOUNDS.isOn = true;
    cue('open', { emphasis: 'subtle' });

    expect(played).toHaveBeenCalledWith('open', { emphasis: 'subtle' });
  });
});
