import { fireEvent, render, userEvent, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ABottomSheet } from './ABottomSheet';
import { SHEETS_UP } from './SHEETS_UP';

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

  it('tells the page beneath while it is up, so a swipe on it is not taken for one on the page', async () => {
    const drawn = await render(
      <ABottomSheet isOpen label="Quality" onClose={jest.fn()}>
        <Text>Lossless</Text>
      </ABottomSheet>,
    );

    expect(SHEETS_UP.size).toBe(1);

    await drawn.unmount();

    expect(SHEETS_UP.size).toBe(0);
  });

  it('takes a drag anywhere on it, rather than only by its top, where it is asked to', async () => {
    const sheet = (isDraggedAnywhere: boolean) => (
      <ABottomSheet
        isOpen
        label="Quality"
        isDraggedAnywhere={isDraggedAnywhere}
        onClose={jest.fn()}
      >
        <Text>Lossless</Text>
      </ABottomSheet>
    );
    const drawn = await render(sheet(false));

    expect(drawn.getByLabelText('Quality').props.onMoveShouldSetResponder).toBeUndefined();

    await drawn.rerender(sheet(true));

    expect(drawn.getByLabelText('Quality').props.onMoveShouldSetResponder).toBeDefined();
  });

  it('is put away by a drag down past a little way, and springs back from a short one', async () => {
    const onClose = jest.fn();
    const drawn = await render(
      <ABottomSheet isOpen label="Quality" isDraggedAnywhere onClose={onClose}>
        <Text>Lossless</Text>
      </ABottomSheet>,
    );
    const sheet = drawn.getByLabelText('Quality');
    const at = (pageY: number, timestamp: number) => ({
      nativeEvent: { pageX: 100, pageY, timestamp },
    });
    const dragTo = async (pageY: number) => {
      await fireEvent(sheet, 'startShouldSetResponderCapture', at(400, 0));
      await fireEvent(sheet, 'responderMove', at(pageY, 1000));
      await fireEvent(sheet, 'responderRelease', at(pageY, 1000));
    };

    await dragTo(420);

    expect(onClose).not.toHaveBeenCalled();

    await dragTo(600);

    expect(onClose).toHaveBeenCalled();
  });

  it('leaves a drag to the sheet on top, where one sheet is opened over another', async () => {
    const onCloseBeneath = jest.fn();
    const onCloseAbove = jest.fn();
    const drawn = await render(
      <>
        <ABottomSheet isOpen label="Profile picture" isDraggedAnywhere onClose={onCloseBeneath}>
          <Text>Avatar</Text>
        </ABottomSheet>
        <ABottomSheet isOpen label="Custom colour" isDraggedAnywhere onClose={onCloseAbove}>
          <Text>Hue</Text>
        </ABottomSheet>
      </>,
    );
    const at = (pageY: number, timestamp: number) => ({
      nativeEvent: { pageX: 100, pageY, timestamp },
    });
    const dragDown = async (label: string) => {
      const sheet = drawn.getByLabelText(label);

      await fireEvent(sheet, 'startShouldSetResponderCapture', at(400, 0));
      await fireEvent(sheet, 'responderMove', at(600, 1000));
      await fireEvent(sheet, 'responderRelease', at(600, 1000));
    };

    await dragDown('Profile picture');

    expect(onCloseBeneath).not.toHaveBeenCalled();

    await dragDown('Custom colour');

    expect(onCloseAbove).toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ABottomSheet.displayName).toBe('ABottomSheet');
  });
});
