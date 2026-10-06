import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { AUDIO_QUALITY_LABELS } from '@ValenceContracts/schemas/Music';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { AQualitySheet } from './AQualitySheet';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('AQualitySheet', () => {
  it('marks the quality chosen', async () => {
    const drawn = await render(<AQualitySheet isOpen onClose={jest.fn()} />);

    expect(
      drawn.getByRole('button', {
        name: AUDIO_QUALITY_LABELS[thePhonesMusicPlayer().read().quality],
      }),
    ).toBeSelected();
  });

  it('plays at the quality pressed, and closes', async () => {
    const choosing = jest.spyOn(thePhonesMusicPlayer(), 'setQuality');
    const onClose = jest.fn();
    const drawn = await render(<AQualitySheet isOpen onClose={onClose} />);

    await userEvent.press(drawn.getByRole('button', { name: AUDIO_QUALITY_LABELS.high }));

    expect(choosing).toHaveBeenCalledWith('high');
    expect(onClose).toHaveBeenCalled();
    choosing.mockRestore();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AQualitySheet.displayName).toBe('AQualitySheet');
  });
});
