import { fireEvent, render } from '@testing-library/react-native';
import { AWordOpening } from './AWordOpening';

const HIDDEN_TOO = { includeHiddenElements: true };

describe('AWordOpening', () => {
  it('writes the word out one letter at a time', async () => {
    const drawn = await render(
      <AWordOpening word="Valence" isShown isStill before={13} style={{}} onWide={jest.fn()} />,
    );

    expect(drawn.getByText('V', HIDDEN_TOO)).toBeTruthy();
    expect(drawn.getAllByText('e', HIDDEN_TOO)).toHaveLength(2);
  });

  it('says how wide it is', async () => {
    const onWide = jest.fn();
    const drawn = await render(
      <AWordOpening
        word="Va"
        isShown={false}
        isStill={false}
        before={13}
        style={{}}
        onWide={onWide}
      />,
    );

    await fireEvent(drawn.getByText('V', HIDDEN_TOO), 'layout', {
      nativeEvent: { layout: { width: 80, height: 40, x: 0, y: 0 } },
    });

    expect(onWide).toHaveBeenCalledWith(80);
  });
});
