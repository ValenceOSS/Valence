import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { thisTvsId } from '@ValenceTv/platform/thisTvsId';

describe('thisTvsId', () => {
  it('makes an identifier the first time and keeps it', () => {
    const first = thisTvsId();

    expect(first).not.toBe('');
    expect(thisTvsId()).toBe(first);
    expect(platformInUse().store.read('valence.tv.id')).toBe(first);
  });

  it('answers with the one it already kept', () => {
    platformInUse().store.write('valence.tv.id', 'living-room');

    expect(thisTvsId()).toBe('living-room');
  });
});
