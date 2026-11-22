import { whyItAsksAgain } from '@ValenceTv/playback/whyItAsksAgain';
import type { Asked } from '@ValenceTv/playback/whyItAsksAgain';

const asked: Asked = {
  mediaId: 'film-1',
  audioStreamIndex: undefined,
  audioLanguage: undefined,
  requestedQuality: undefined,
  converted: undefined,
  attempt: 0,
};

describe('whyItAsksAgain', () => {
  it('says a title is being opened the first time, or when it is another title', () => {
    expect(whyItAsksAgain(null, asked)).toBe('opened');
    expect(whyItAsksAgain(asked, { ...asked, mediaId: 'film-2' })).toBe('opened');
  });

  it('says what changed since it last asked', () => {
    expect(whyItAsksAgain(asked, { ...asked, converted: 'picture' })).toBe('converting');
    expect(whyItAsksAgain(asked, { ...asked, attempt: 1 })).toBe('retried');
    expect(whyItAsksAgain(asked, { ...asked, audioStreamIndex: 2 })).toBe('audio');
    expect(whyItAsksAgain(asked, { ...asked, audioLanguage: 'ja' })).toBe('audio');
    expect(whyItAsksAgain(asked, { ...asked, requestedQuality: '720p' })).toBe('quality');
  });
});
