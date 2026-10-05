import { describe, expect, it, vi } from 'vitest';
import { showTheWindowControls } from './showTheWindowControls';

const aWindow = () => ({ setWindowButtonVisibility: vi.fn() });

describe('showTheWindowControls', () => {
  it('takes the traffic lights away on macOS, and brings them back', () => {
    const window = aWindow();

    showTheWindowControls(window, false, 'darwin');
    showTheWindowControls(window, true, 'darwin');

    expect(window.setWindowButtonVisibility.mock.calls).toEqual([[false], [true]]);
  });

  it('leaves Windows and Linux to the page, which draws their controls itself', () => {
    const window = aWindow();

    showTheWindowControls(window, false, 'win32');
    showTheWindowControls(window, true, 'linux');

    expect(window.setWindowButtonVisibility).not.toHaveBeenCalled();
  });
});
