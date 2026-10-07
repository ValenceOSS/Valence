import { act, render, screen } from '@testing-library/react';
import { ControllerHint } from '@ValenceTv/components/ControllerHint/ControllerHint';
import { theController } from '@ValenceTv/remote/theController';

const XBOX =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; Xbox; Xbox Series X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';

const HINT = 'To use your controller, hold the Menu button, then choose Use game controls.';

describe('ControllerHint in a browser', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('says nothing in a television’s own browser, which has a remote', () => {
    render(<ControllerHint />);

    expect(screen.queryByText(HINT)).toBeNull();
  });

  it('tells somebody on an Xbox how to use their controller, until it is heard', () => {
    jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(XBOX);
    render(<ControllerHint />);

    expect(screen.getByText(HINT)).toBeTruthy();

    act(() => {
      theController().hear();
    });

    expect(screen.queryByText(HINT)).toBeNull();
  });
});
