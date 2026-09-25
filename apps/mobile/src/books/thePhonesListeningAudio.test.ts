import { thePhonesListeningAudio } from '@ValenceMobile/books/thePhonesListeningAudio';
import { aFakeSpeaker } from '@ValenceMobile/testing/aFakeSpeaker';

describe('thePhonesListeningAudio', () => {
  it('plays through the speaker kept for books', async () => {
    const { speaker } = aFakeSpeaker();
    const audio = thePhonesListeningAudio(speaker);

    await audio.play();

    expect(speaker.play).toHaveBeenCalledWith('book');
  });

  it('refuses in a build that cannot play', () => {
    expect(() => thePhonesListeningAudio(null)).toThrow(
      'This build of Valence cannot play audiobooks.',
    );
  });
});
