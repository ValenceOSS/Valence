import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { AFramer } from './AFramer';

const thePicture = () => {
  const [picture] = theDrawnRoot().queryAll((node) => node.type === 'Image');

  if (picture === undefined) {
    throw new Error('No picture was drawn.');
  }

  return picture;
};

const aFramer = async (onFrame = jest.fn<undefined, [PhotoFrame]>()) => {
  await render(
    <AFramer
      uri="file:///chosen.jpg"
      frame={{ zoom: 1, x: 1, y: 0 }}
      aspect={1}
      width={100}
      roundness={0.5}
      onFrame={onFrame}
    />,
  );

  return onFrame;
};

describe('AFramer', () => {
  it('fills its shape with the picture until the picture’s size is known', async () => {
    await aFramer();

    expect(thePicture().parent).not.toHaveStyle({ position: 'absolute' });
  });

  it('shows the part its frame chose once the picture has loaded', async () => {
    await aFramer();

    await fireEvent(thePicture(), 'load', {
      nativeEvent: { source: { width: 2000, height: 1000 } },
    });

    expect(thePicture().parent).toHaveStyle({ position: 'absolute', left: -100, width: 200 });
  });

  it('draws the picture nearer or further for a screen reader swiping up or down on it', async () => {
    const onFrame = await aFramer();

    await fireEvent(thePicture(), 'load', {
      nativeEvent: { source: { width: 2000, height: 1000 } },
    });
    await fireEvent(screen.getByRole('adjustable'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });

    expect(onFrame.mock.lastCall?.[0]).toMatchObject({ zoom: 1.25 });
  });

  it('is drawn as round as asked', async () => {
    await aFramer();

    expect(screen.getByRole('adjustable')).toHaveStyle({
      borderRadius: 50,
      width: 100,
      height: 100,
    });
  });
});
