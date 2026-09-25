import { describe, expect, it, vi } from 'vitest';
import { showTheWindowControls } from './showTheWindowControls';

const aWindow = () => ({
  setWindowButtonVisibility: vi.fn(),
  setTitleBarOverlay: vi.fn(),
});

describe('showTheWindowControls', () => {
  it('takes the traffic lights away on macOS, and brings them back', () => {
    const window = aWindow();

    showTheWindowControls(window, false, 'darwin');
    showTheWindowControls(window, true, 'darwin');

    expect(window.setWindowButtonVisibility.mock.calls).toEqual([[false], [true]]);
    expect(window.setTitleBarOverlay).not.toHaveBeenCalled();
  });

  it('draws the controls clear elsewhere, since they cannot be taken away', () => {
    const window = aWindow();

    showTheWindowControls(window, false, 'win32');
    showTheWindowControls(window, true, 'linux');

    expect(window.setTitleBarOverlay.mock.calls).toEqual([
      [{ symbolColor: '#00000000' }],
      [{ symbolColor: '#ffffff' }],
    ]);
    expect(window.setWindowButtonVisibility).not.toHaveBeenCalled();
  });
});
