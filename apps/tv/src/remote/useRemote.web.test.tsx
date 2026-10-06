import { render } from '@testing-library/react';
import { useRemote } from '@ValenceTv/remote/useRemote';
import type { HWEvent } from 'react-native';

/**
 * A screen that listens to the remote.
 *
 * @param hear - Told of each button.
 * @returns Nothing drawn.
 */
const Listening = ({ hear }: { hear: (event: HWEvent) => void }) => {
  useRemote(hear);

  return null;
};

const key = (type: 'keydown' | 'keyup', name: string, repeat = false) => {
  document.dispatchEvent(new KeyboardEvent(type, { key: name, repeat }));
};

describe('useRemote in a browser', () => {
  it('says each press as the Siri Remote does, and a held button by its held name', () => {
    const hear = jest.fn();

    render(<Listening hear={hear} />);
    key('keydown', 'ArrowLeft');
    key('keydown', 'ArrowLeft', true);
    key('keydown', 'ArrowLeft', true);
    key('keyup', 'ArrowLeft');
    key('keydown', 'MediaPlayPause');

    expect(hear).toHaveBeenCalledTimes(4);
    expect(hear).toHaveBeenNthCalledWith(1, { eventType: 'left', eventKeyAction: 0 });
    expect(hear).toHaveBeenNthCalledWith(2, { eventType: 'longLeft', eventKeyAction: 0 });
    expect(hear).toHaveBeenNthCalledWith(3, { eventType: 'longLeft', eventKeyAction: 1 });
    expect(hear).toHaveBeenNthCalledWith(4, { eventType: 'playPause', eventKeyAction: 0 });
  });

  it('ignores a key that is not the remote’s', () => {
    const hear = jest.fn();

    render(<Listening hear={hear} />);
    key('keydown', 'a');

    expect(hear).not.toHaveBeenCalled();
  });
});
