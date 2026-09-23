import { fireEvent, render } from '@testing-library/react-native';
import { theDrawnRoot } from '@ValencePhone/testing/theDrawnRoot';
import { APicture } from './APicture';

describe('APicture', () => {
  it('shows a picture from its address', async () => {
    const drawn = await render(
      <APicture
        picture={{ uri: 'http://one.local/face.jpg', isDrawn: false }}
        onMissing={jest.fn()}
      />,
    );

    expect(drawn.toJSON()).toMatchObject({
      props: { source: { uri: 'http://one.local/face.jpg' } },
    });
  });

  it('says so where the picture cannot be had', async () => {
    const onMissing = jest.fn();
    await render(
      <APicture
        picture={{ uri: 'http://one.local/gone.jpg', isDrawn: false }}
        onMissing={onMissing}
      />,
    );

    await fireEvent(theDrawnRoot(), 'error');

    expect(onMissing).toHaveBeenCalled();
  });
});
