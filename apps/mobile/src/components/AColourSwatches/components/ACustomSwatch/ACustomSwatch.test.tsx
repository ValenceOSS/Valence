import { fireEvent, render, screen } from '@testing-library/react-native';
import { ACustomSwatch } from './ACustomSwatch';

describe('ACustomSwatch', () => {
  it('opens a picker for any colour, marked as chosen once a colour is chosen there', async () => {
    await render(<ACustomSwatch label="Custom colour" value="#123456" onChoose={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Custom colour' })).toBeSelected();

    await fireEvent.press(screen.getByRole('button', { name: 'Custom colour' }));

    expect(screen.getByDisplayValue('#123456')).toBeTruthy();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ACustomSwatch.displayName).toBe('ACustomSwatch');
  });
});
