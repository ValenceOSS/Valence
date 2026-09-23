import { View } from 'react-native';
import { fireEvent, render, renderHook } from '@testing-library/react-native';
import { useRoomToFill } from '@ValenceTv/layout/useRoomToFill';

describe('useRoomToFill', () => {
  it('knows no height until the space has been measured', async () => {
    const { result } = await renderHook(() => useRoomToFill());

    expect(result.current.height).toBeNull();
  });

  it('takes the height the space is laid out at', async () => {
    const { result } = await renderHook(() => useRoomToFill());
    const drawn = await render(<View testID="space" onLayout={result.current.onLayout} />);

    await fireEvent(drawn.getByTestId('space'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 1920, height: 720 } },
    });

    expect(result.current.height).toBe(720);
  });
});
