import { render, userEvent } from '@testing-library/react-native';
import { TheAudioAndSubtitles } from './TheAudioAndSubtitles';
import type { ASetOfChoices } from '@ValenceMobile/components/Watching/components/TheChoices/TheChoices.types';

const subtitles: ASetOfChoices = {
  heading: 'Subtitles',
  chosen: 'off',
  choices: [
    { id: 'off', label: 'Off' },
    { id: 'en', label: 'English' },
  ],
  onChoose: jest.fn(),
};

describe('TheAudioAndSubtitles', () => {
  it('offers to find subtitles under the ones there are', async () => {
    const onFind = jest.fn();
    const drawn = await render(
      <TheAudioAndSubtitles
        audio={null}
        subtitles={subtitles}
        timing={null}
        onClose={jest.fn()}
        only="subtitles"
        onFind={onFind}
      />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Find subtitles' }));

    expect(onFind).toHaveBeenCalled();
  });

  it('offers to find subtitles for something that has none', async () => {
    const drawn = await render(
      <TheAudioAndSubtitles
        audio={null}
        subtitles={null}
        timing={null}
        onClose={jest.fn()}
        only="subtitles"
        onFind={jest.fn()}
      />,
    );

    expect(drawn.getByText('There are no subtitles for this.')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Find subtitles' })).toBeTruthy();
  });

  it('offers no search to somebody who may not add to the library', async () => {
    const drawn = await render(
      <TheAudioAndSubtitles
        audio={null}
        subtitles={subtitles}
        timing={{ offset: 0, onChange: jest.fn() }}
        onClose={jest.fn()}
      />,
    );

    expect(drawn.getByText('English')).toBeTruthy();
    expect(drawn.queryByRole('button', { name: 'Find subtitles' })).toBeNull();
  });
});
