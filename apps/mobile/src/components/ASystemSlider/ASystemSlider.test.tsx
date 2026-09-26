import { fireEvent, render } from '@testing-library/react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { ASystemSlider } from './ASystemSlider';

const theSlider = () => {
  const [slider] = theDrawnRoot().queryAll((node) => node.props.step === 1);

  if (slider === undefined) {
    throw new Error('The slider was not drawn.');
  }

  return slider;
};

const aSlider = (onScrubbing = jest.fn(), onScrubbed = jest.fn()) =>
  render(
    <ASystemSlider
      label="Page"
      value={3}
      furthest={10}
      tint="#e9f3ef"
      onScrubbing={onScrubbing}
      onScrubbed={onScrubbed}
    />,
  );

describe('ASystemSlider', () => {
  it('says the whole number it is dragged to as it moves', async () => {
    const onScrubbing = jest.fn();
    await aSlider(onScrubbing);

    await fireEvent(theSlider(), 'valueChanged', { nativeEvent: { value: 6.6, eventCount: 1 } });

    expect(onScrubbing).toHaveBeenCalledWith(7);
  });

  it('says where it was let go once it is', async () => {
    const onScrubbed = jest.fn();
    await aSlider(jest.fn(), onScrubbed);

    await fireEvent(theSlider(), 'valueChanged', { nativeEvent: { value: 4.2, eventCount: 1 } });
    await fireEvent(theSlider(), 'editingChanged', { nativeEvent: { isEditing: false } });

    expect(onScrubbed).toHaveBeenCalledWith(4);
  });

  it('says where it sits now when let go untouched, after the book turned under it', async () => {
    const onScrubbed = jest.fn();
    const drawn = await aSlider(jest.fn(), onScrubbed);

    await drawn.rerender(
      <ASystemSlider
        label="Page"
        value={8}
        furthest={10}
        tint="#e9f3ef"
        onScrubbing={jest.fn()}
        onScrubbed={onScrubbed}
      />,
    );
    await fireEvent(theSlider(), 'editingChanged', { nativeEvent: { isEditing: false } });

    expect(onScrubbed).toHaveBeenCalledWith(8);
  });

  it('says nothing of letting go when it is taken hold of', async () => {
    const onScrubbed = jest.fn();
    await aSlider(jest.fn(), onScrubbed);

    await fireEvent(theSlider(), 'editingChanged', { nativeEvent: { isEditing: true } });

    expect(onScrubbed).not.toHaveBeenCalled();
  });
});
