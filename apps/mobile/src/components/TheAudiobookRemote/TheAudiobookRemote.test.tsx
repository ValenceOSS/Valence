import { act, render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { emitPresenceEvent } from '@ValenceClient/presence/presenceEvents';
import { thePhonesAudiobookPlayer } from '@ValenceMobile/books/thePhonesAudiobookPlayer';
import { TheAudiobookRemote } from './TheAudiobookRemote';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('TheAudiobookRemote', () => {
  it('pauses the audiobook when an administrator says to', async () => {
    const pausing = jest.spyOn(thePhonesAudiobookPlayer(), 'pause');

    await render(<TheAudiobookRemote />);

    await act(() => {
      emitPresenceEvent({ kind: 'book', command: 'pause' });
    });

    expect(pausing).toHaveBeenCalled();
  });
});
