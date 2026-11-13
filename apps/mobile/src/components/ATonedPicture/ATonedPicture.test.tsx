import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { toneMatrix } from '@ValenceCore/pictures/toneMatrix';
import { ATonedPicture } from './ATonedPicture';

const AS_IT_IS = { saturate: 1, hueRotate: 0, contrast: 1, brightness: 1, layer: null };

describe('ATonedPicture', () => {
  it('draws a picture with no filter as any other picture is', async () => {
    await render(<ATonedPicture uri="file:///chosen.jpg" tone={null} />);

    expect(screen.queryByTestId('skia-canvas')).toBeNull();
  });

  it('draws a filtered one through its colour sums, the filter’s colour blended over it, and says how large it is', async () => {
    const onLoad = jest.fn();

    const tone = {
      ...AS_IT_IS,
      saturate: 0,
      layer: { colour: '#1f4fff', blend: 'soft-light', opacity: 0.65 },
    } as const;

    await render(
      <ATonedPicture
        uri="file:///chosen.jpg"
        tone={tone}
        style={{ height: 52, width: 52 }}
        onLoad={onLoad}
      />,
    );

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalledWith({ width: 1200, height: 800 });
    });

    if (screen.root !== null) {
      await fireEvent(screen.root, 'layout', {
        nativeEvent: { layout: { width: 52, height: 52 } },
      });
    }

    expect(screen.getByTestId('skia-colour-matrix')).toHaveProp(
      'accessibilityHint',
      toneMatrix(tone).join(','),
    );
    expect(screen.getByTestId('skia-layer')).toHaveStyle({
      backgroundColor: '#1f4fff',
      opacity: 0.65,
    });
    expect(screen.getByTestId('skia-layer')).toHaveProp('accessibilityHint', 'softLight');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ATonedPicture.displayName).toBe('ATonedPicture');
  });
});
