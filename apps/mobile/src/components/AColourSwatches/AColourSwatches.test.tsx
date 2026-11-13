import { fireEvent, render, screen } from '@testing-library/react-native';
import { AColourSwatches } from './AColourSwatches';

const OPTIONS = ['#e8503a', '#3ac47d'];

describe('AColourSwatches', () => {
  it('names each colour, marking the one chosen, and tells which is pressed', async () => {
    const onChoose = jest.fn();

    await render(<AColourSwatches value="#e8503a" options={OPTIONS} onChoose={onChoose} />);

    expect(screen.getByRole('button', { name: 'Red' })).toBeSelected();

    await fireEvent.press(screen.getByRole('button', { name: 'Green' }));

    expect(onChoose).toHaveBeenCalledWith('#3ac47d');
  });

  it('offers no colour at all first, where it is wanted', async () => {
    const onClear = jest.fn();

    await render(
      <AColourSwatches
        value=""
        options={OPTIONS}
        onChoose={jest.fn()}
        clear={{ isChosen: true, onChoose: onClear }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Transparent' })).toBeSelected();

    await fireEvent.press(screen.getByRole('button', { name: 'Transparent' }));

    expect(onClear).toHaveBeenCalled();
  });

  it('opens a picker for any colour, and marks a colour chosen there', async () => {
    await render(<AColourSwatches value="#123456" options={OPTIONS} onChoose={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Custom colour' })).toBeSelected();

    await fireEvent.press(screen.getByRole('button', { name: 'Custom colour' }));

    expect(screen.getByDisplayValue('#123456')).toBeTruthy();
  });

  it('offers ready gradients after the colours, marking the one chosen rather than a colour', async () => {
    const onGradient = jest.fn();

    await render(
      <AColourSwatches
        value="#ff7a59"
        options={OPTIONS}
        onChoose={jest.fn()}
        gradients={{
          options: [
            { from: '#ff7a59', to: '#e83a90', name: 'screens.faceEditor.letterStudio.flamingo' },
            { from: '#f2c94c', to: '#e8503a', name: 'screens.faceEditor.letterStudio.blaze' },
          ],
          chosen: { from: '#ff7a59', to: '#e83a90' },
          onChoose: onGradient,
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Flamingo' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Custom colour' })).not.toBeSelected();

    await fireEvent.press(screen.getByRole('button', { name: 'Blaze' }));

    expect(onGradient).toHaveBeenCalledWith('#f2c94c', '#e8503a');
  });

  it('ends the gradients with a picker for where one of one’s own ends, starting from the colour now', async () => {
    const onGradient = jest.fn();

    await render(
      <AColourSwatches
        value="#3a8ee8"
        options={OPTIONS}
        onChoose={jest.fn()}
        gradients={{
          options: [
            { from: '#ff7a59', to: '#e83a90', name: 'screens.faceEditor.letterStudio.flamingo' },
          ],
          chosen: null,
          onChoose: onGradient,
        }}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Where the gradient ends' }));
    await fireEvent.changeText(screen.getByDisplayValue('#ff0000'), '#00ff00');

    expect(onGradient).toHaveBeenCalledWith('#3a8ee8', '#00ff00');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AColourSwatches.displayName).toBe('AColourSwatches');
  });
});
