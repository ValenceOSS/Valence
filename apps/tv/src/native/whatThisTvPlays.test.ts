import { whatThisTvPlays } from '@ValenceTv/native/whatThisTvPlays';

const saying = (answer: object) => ({ whatThisPlays: () => answer });

describe('whatThisTvPlays', () => {
  it('says nothing on a television without the module', () => {
    expect(whatThisTvPlays()).toBeNull();
    expect(whatThisTvPlays(null)).toBeNull();
  });

  it('passes on what the television says it plays', () => {
    const answer = {
      video: [{ codec: 'hevc', maxLevel: 153, isTenBit: true, maxWidth: 3840, maxHeight: 2160 }],
      audio: ['aac'],
      passthrough: ['eac3'],
      hdr: ['HDR10'],
      screen: { width: 3840, height: 2160 },
    };

    expect(whatThisTvPlays(saying(answer))).toEqual(answer);
  });

  it('says nothing where the answer cannot be read', () => {
    expect(whatThisTvPlays(saying({ video: 'lots' }))).toBeNull();
  });
});
