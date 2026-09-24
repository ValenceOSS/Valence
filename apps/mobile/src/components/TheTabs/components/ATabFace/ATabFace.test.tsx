import { render } from '@testing-library/react-native';
import { ATabFace } from './ATabFace';

describe('ATabFace', () => {
  it('draws the initial where there is no picture', async () => {
    const drawn = await render(
      <ATabFace face={{ picture: null, backdrop: '#e5484d', initial: 'M' }} isShowing={false} />,
    );

    expect(drawn.getByText('M')).toBeTruthy();
  });

  it('draws the picture in place of the initial where there is one', async () => {
    const drawn = await render(
      <ATabFace
        face={{
          picture: { uri: 'https://valence.test/face.jpg', isDrawn: false },
          backdrop: '#e5484d',
          initial: 'M',
        }}
        isShowing
      />,
    );

    expect(drawn.queryByText('M')).toBeNull();
  });
});
