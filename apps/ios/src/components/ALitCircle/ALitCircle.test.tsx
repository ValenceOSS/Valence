import { Shuffle } from '@keyline-icons/react-native';
import { render, renderHook, screen } from '@testing-library/react-native';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { ALitCircle } from './ALitCircle';

describe('ALitCircle', () => {
  it('fills its circle in the page’s ink only while it is on', async () => {
    const { result } = await renderHook(() => useTheColours());
    const lit = { backgroundColor: result.current.accent };

    await render(<ALitCircle of={Shuffle} size={20} isLit={false} />);
    expect(screen.root).not.toHaveStyle(lit);

    await render(<ALitCircle of={Shuffle} size={20} isLit />);
    expect(screen.root).toHaveStyle(lit);
  });
});
