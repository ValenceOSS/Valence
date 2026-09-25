import { act, render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { emitPresenceEvent } from '@ValenceClient/presence/presenceEvents';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { TheMusicRemote } from './TheMusicRemote';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('TheMusicRemote', () => {
  it('does what another of this person’s devices tells the phone to', async () => {
    const obeying = jest.spyOn(thePhonesMusicPlayer(), 'obey');

    await render(<TheMusicRemote />, { wrapper: CacheScope });

    await act(() => {
      emitPresenceEvent({
        kind: 'music',
        command: { kind: 'pause' },
        fromClientId: 'web',
        fromLabel: 'Browser',
      });
    });

    expect(obeying).toHaveBeenCalledWith({ kind: 'pause' });
  });
});
