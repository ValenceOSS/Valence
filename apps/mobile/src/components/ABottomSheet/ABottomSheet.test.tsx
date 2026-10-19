import { render, userEvent, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ABottomSheet } from './ABottomSheet';

describe('ABottomSheet', () => {
  it('rises with its title and what it holds', async () => {
    const drawn = await render(
      <ABottomSheet isOpen label="Quality" title="Quality" onClose={jest.fn()}>
        <Text>Lossless</Text>
      </ABottomSheet>,
    );

    expect(drawn.getByText('Quality')).toBeTruthy();
    expect(drawn.getByText('Lossless')).toBeTruthy();
  });

  it('closes when what is behind it is pressed', async () => {
    const onClose = jest.fn();
    const drawn = await render(
      <ABottomSheet isOpen label="Quality" onClose={onClose}>
        <Text>Lossless</Text>
      </ABottomSheet>,
    );

    await userEvent.press(
      drawn.getByRole('button', { name: 'Close', includeHiddenElements: true }),
    );

    expect(onClose).toHaveBeenCalled();
  });

  it('draws nothing while it has never been opened', async () => {
    const drawn = await render(
      <ABottomSheet isOpen={false} label="Quality" onClose={jest.fn()}>
        <Text>Lossless</Text>
      </ABottomSheet>,
    );

    expect(drawn.queryByText('Lossless')).toBeNull();
  });

  it('stays up when opened again while it is still sinking', async () => {
    const sheet = (isOpen: boolean) => (
      <ABottomSheet isOpen={isOpen} label="Quality" onClose={jest.fn()}>
        <Text>Lossless</Text>
      </ABottomSheet>
    );
    const drawn = await render(sheet(true));

    await drawn.rerender(sheet(false));
    await drawn.rerender(sheet(true));

    await waitFor(() => {
      expect(drawn.getByText('Lossless')).toBeTruthy();
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ABottomSheet.displayName).toBe('ABottomSheet');
  });
});
