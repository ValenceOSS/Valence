import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { WatchingHeld } from './WatchingHeld';

jest.mock('@ValenceClient/downloads/keepingFiles', () => ({
  sourceForAFile: (downloadId: string) => `file:///phone/held/${downloadId}.mp4`,
}));

const HELD = {
  downloadId: '00000000-0000-4000-8000-000000000001',
  mediaId: '00000000-0000-4000-8000-000000000002',
  seriesId: null,
  seriesTitle: null,
  title: 'Arrival',
  quality: 'original' as const,
  durationSeconds: 6960,
  ofBytes: null,
  state: 'here' as const,
  bytes: 4,
  bytesPerSecond: null,
  failure: null,
  keptAt: '2026-09-23T10:00:00.000Z',
  hasPoster: false,
};

describe('WatchingHeld', () => {
  it('plays a film kept on this phone, and leaves when done', async () => {
    installPlatform(aFakePlatform());
    const onDone = jest.fn();
    const drawn = await render(<WatchingHeld file={HELD} onDone={onDone} />, {
      wrapper: CacheScope,
    });

    await userEvent.press(drawn.getByRole('button', { name: 'Back' }));

    expect(onDone).toHaveBeenCalled();
  });
});
