import { createElement as mockCreateElement } from 'react';
import { Image as mockNativeImage } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { ChannelLogo } from '@ValenceTv/components/ChannelLogo/ChannelLogo';

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

const CHANNEL = 'fe8bc221-ae31-5ce4-aeca-89ba3a969595';

describe('ChannelLogo', () => {
  beforeEach(() => {
    rememberServerAddress('https://valence.test');
  });

  it('shows the channel’s logo, read through the server', async () => {
    const drawn = await render(
      <ChannelLogo channelId={CHANNEL} name="5 Cops" hasLogo width={96} height={56} />,
    );

    expect(
      drawn.getByRole('image', {
        name: `https://valence.test/api/live/channels/${CHANNEL}/logo?v=2`,
      }),
    ).toBeTruthy();
  });

  it('shows the first letters of the name where the channel has no logo', async () => {
    const drawn = await render(
      <ChannelLogo channelId={CHANNEL} name="5 Cops" hasLogo={false} width={96} height={56} />,
    );

    expect(drawn.getByText('5C')).toBeTruthy();
    expect(drawn.queryByRole('image')).toBeNull();
  });

  it('falls back to the letters when the logo will not load', async () => {
    const drawn = await render(
      <ChannelLogo channelId={CHANNEL} name="Sky News" hasLogo width={96} height={56} />,
    );

    await fireEvent(drawn.getByRole('image'), 'error');

    expect(drawn.getByText('SK')).toBeTruthy();
  });
});
