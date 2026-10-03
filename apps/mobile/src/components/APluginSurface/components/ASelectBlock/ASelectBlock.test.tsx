import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { ASelectBlock } from './ASelectBlock';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

const options = [
  { value: 'watching', label: 'Watching' },
  { value: 'completed', label: 'Completed' },
];

describe('ASelectBlock', () => {
  it('shows what is chosen and chooses another from a sheet', async () => {
    const onChoose = jest.fn();
    const drawn = await render(
      <ASelectBlock label="Which list" value="watching" options={options} onChoose={onChoose} />,
    );

    await userEvent.press(drawn.getByLabelText('Which list: Watching'));
    await userEvent.press(drawn.getByText('Completed'));

    expect(onChoose).toHaveBeenCalledWith('completed');
  });

  it('says nothing is chosen where the value matches no option', async () => {
    const drawn = await render(
      <ASelectBlock label="Which list" value="" options={options} onChoose={jest.fn()} />,
    );

    expect(drawn.getByLabelText('Which list: Nothing selected')).toBeTruthy();
  });
});
