import { render } from '@testing-library/react';
import { useMenuToClose } from '@ValenceTv/navigation/useMenuToClose';

/**
 * Something open over a screen.
 *
 * @param onClose - What closing does.
 * @returns Nothing drawn.
 */
const Panel = ({ onClose }: { onClose: () => void }) => {
  useMenuToClose(onClose);

  return null;
};

describe('useMenuToClose in a browser', () => {
  it('closes on Back, and hears nothing once closed', () => {
    const onClose = jest.fn();
    const drawn = render(<Panel onClose={onClose} />);
    const back = () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27 }));
    };

    back();

    expect(onClose).toHaveBeenCalledTimes(1);

    drawn.unmount();
    back();

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
