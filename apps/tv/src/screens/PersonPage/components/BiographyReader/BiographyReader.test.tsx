import { fireEvent, render } from '@testing-library/react-native';
import { BackHandler, TVEventControl } from 'react-native';
import { BiographyReader } from '@ValenceTv/screens/PersonPage/components/BiographyReader/BiographyReader';
import { tokens } from '@ValenceTv/theme/tokens';

const BIOGRAPHY = 'Born in Paris.\n\nTrained in Oxford.\n';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('BiographyReader', () => {
  it('reads the whole biography under their name, a paragraph at a time', async () => {
    const drawn = await render(
      <BiographyReader name="Emma Watson" biography={BIOGRAPHY} onClose={jest.fn()} />,
    );

    expect(drawn.getByText('About Emma Watson')).toBeTruthy();
    expect(drawn.getAllByRole('button')).toHaveLength(2);
    expect(drawn.getByText('Born in Paris.')).toBeTruthy();
    expect(drawn.getByText('Trained in Oxford.')).toBeTruthy();
  });

  it('lights the paragraph the remote is on', async () => {
    const drawn = await render(
      <BiographyReader name="Emma Watson" biography={BIOGRAPHY} onClose={jest.fn()} />,
    );

    await fireEvent(drawn.getByRole('button', { name: 'Trained in Oxford.' }), 'focus');

    expect(drawn.getByText('Trained in Oxford.')).toHaveStyle({ color: tokens.colours.text });
    expect(drawn.getByText('Born in Paris.')).toHaveStyle({ color: tokens.colours.muted });
  });

  it('closes with the remote’s back button', async () => {
    const pressed: { back: Parameters<typeof BackHandler.addEventListener>[1] | null } = {
      back: null,
    };

    jest.spyOn(TVEventControl, 'enableTVMenuKey').mockImplementation(() => undefined);
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_type, handler) => {
      pressed.back = handler;

      return { remove: () => undefined };
    });

    const onClose = jest.fn();

    await render(<BiographyReader name="Emma Watson" biography={BIOGRAPHY} onClose={onClose} />);

    pressed.back?.({ type: 'hardwareBackPress', timeStamp: 0 });

    expect(onClose).toHaveBeenCalled();
  });
});
