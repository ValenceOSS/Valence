import { buttonOfKey } from '@ValenceTv/remote/buttonOfKey';

describe('buttonOfKey', () => {
  it('names the arrows, select and the media keys as the Siri Remote does', () => {
    expect(buttonOfKey('ArrowLeft', 37)).toBe('left');
    expect(buttonOfKey('Enter', 13)).toBe('select');
    expect(buttonOfKey('MediaPlayPause', 179)).toBe('playPause');
    expect(buttonOfKey('MediaFastForward', 228)).toBe('fastForward');
  });

  it('reads LG’s and Samsung’s remotes by their codes where the browser gives no name', () => {
    expect(buttonOfKey('Unidentified', 461)).toBe('back');
    expect(buttonOfKey('Unidentified', 10009)).toBe('back');
    expect(buttonOfKey('Unidentified', 415)).toBe('playPause');
    expect(buttonOfKey('Unidentified', 412)).toBe('rewind');
  });

  it('says nothing of a key that is not the remote’s', () => {
    expect(buttonOfKey('a', 65)).toBeNull();
  });
});
