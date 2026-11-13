import { fireEvent, render, screen } from '@testing-library/react-native';
import { AColourPicker } from './AColourPicker';

describe('AColourPicker', () => {
  it('writes out the colour it is given, and takes one typed in', async () => {
    const onChange = jest.fn();

    await render(<AColourPicker value="#3a8ee8" onChange={onChange} />);

    expect(screen.getByDisplayValue('#3a8ee8')).toBeTruthy();

    await fireEvent.changeText(screen.getByDisplayValue('#3a8ee8'), '#E8503A');

    expect(onChange).toHaveBeenCalledWith('#e8503a');
  });

  it('shows the colour its field starts on where it is given none', async () => {
    await render(<AColourPicker value="" onChange={jest.fn()} />);

    expect(screen.getByDisplayValue('#ff0000')).toBeTruthy();
  });

  it('picks a hue from where the strip is touched', async () => {
    const onChange = jest.fn();

    await render(<AColourPicker value="#ff0000" onChange={onChange} />);
    await fireEvent(screen.root ?? screen.getByLabelText('Hue'), 'layout', {
      nativeEvent: { layout: { width: 392, height: 300 } },
    });
    await fireEvent(screen.getByLabelText('Hue'), 'responderGrant', {
      nativeEvent: { locationX: 120, locationY: 10 },
    });

    expect(onChange).toHaveBeenLastCalledWith('#00ff00');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AColourPicker.displayName).toBe('AColourPicker');
  });
});
