import { createElement as mockCreateElement } from 'react';
import { Image as mockNativeImage } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { CastPortrait } from '@ValenceTv/components/CastRow/components/CastPortrait/CastPortrait';

type MockImageProps = { source: { uri: string }; onError?: () => void };

jest.mock('expo-image', () => ({
  Image: (props: MockImageProps) =>
    mockCreateElement(mockNativeImage, {
      source: { uri: props.source.uri },
      accessible: true,
      accessibilityRole: 'image',
      accessibilityLabel: props.source.uri,
      onError: props.onError,
    }),
}));

const SIZE = { width: 200, height: 300 };

const theFigureIn = (drawn: Awaited<ReturnType<typeof render>>) =>
  drawn.root?.queryAll((node) => node.props.importantForAccessibility === 'no') ?? [];

describe('CastPortrait', () => {
  it('shows their photograph from the catalogue, without the session', async () => {
    const drawn = await render(
      <CastPortrait imageUrl="https://image.tmdb.org/t/p/w185/amy.jpg" size={SIZE} />,
    );

    expect(
      drawn.getByRole('image', { name: 'https://image.tmdb.org/t/p/w185/amy.jpg' }),
    ).toBeTruthy();
    expect(theFigureIn(drawn)).toHaveLength(0);
  });

  it('stands a figure in for somebody the catalogue has no photograph of', async () => {
    const drawn = await render(<CastPortrait imageUrl={null} size={SIZE} />);

    expect(drawn.queryByRole('image')).toBeNull();
    expect(theFigureIn(drawn)).toHaveLength(1);
  });

  it('stands the figure in for a photograph that will not load', async () => {
    const drawn = await render(
      <CastPortrait imageUrl="https://image.tmdb.org/t/p/w185/gone.jpg" size={SIZE} />,
    );

    await fireEvent(drawn.getByRole('image'), 'error');

    expect(drawn.queryByRole('image')).toBeNull();
    expect(theFigureIn(drawn)).toHaveLength(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CastPortrait.displayName).toBe('CastPortrait');
  });
});
