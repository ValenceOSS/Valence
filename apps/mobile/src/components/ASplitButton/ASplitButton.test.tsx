import { CircleCheck, Info } from '@keyline-icons/react-native/fill';
import { render, userEvent } from '@testing-library/react-native';
import { ASplitButton } from './ASplitButton';

describe('ASplitButton', () => {
  it('does what each segment says when it is pressed', async () => {
    const onMark = jest.fn();
    const onAbout = jest.fn();
    const drawn = await render(
      <ASplitButton
        parts={[
          { icon: CircleCheck, label: 'Mark as watched', onPress: onMark, isChosen: false },
          { icon: Info, label: 'About it', onPress: onAbout },
        ]}
      />,
    );

    await userEvent.press(drawn.getByLabelText('About it'));
    await userEvent.press(drawn.getByLabelText('Mark as watched'));

    expect(onAbout).toHaveBeenCalled();
    expect(onMark).toHaveBeenCalled();
  });
});
