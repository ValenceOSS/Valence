import { afterEach, describe, expect, it, vi } from 'vitest';
import { switchSounds } from './switchSounds';
import { SOUNDS } from './SOUNDS';

const cuelume = vi.hoisted(() => ({ bind: vi.fn(), setEnabled: vi.fn() }));

vi.mock('cuelume', () => cuelume);

afterEach(() => {
  SOUNDS.isOn = false;
  cuelume.bind.mockReset();
  cuelume.setEnabled.mockReset();
});

describe('switchSounds', () => {
  it('turns sounds on, and starts listening for presses', () => {
    switchSounds(true);

    expect(SOUNDS.isOn).toBe(true);
    expect(cuelume.setEnabled).toHaveBeenCalledWith(true);
    expect(cuelume.bind).toHaveBeenCalledOnce();
  });

  it('turns them off without listening for anything', () => {
    switchSounds(false);

    expect(SOUNDS.isOn).toBe(false);
    expect(cuelume.setEnabled).toHaveBeenCalledWith(false);
    expect(cuelume.bind).not.toHaveBeenCalled();
  });
});
