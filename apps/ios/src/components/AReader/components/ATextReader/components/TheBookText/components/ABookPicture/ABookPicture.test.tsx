import { render } from '@testing-library/react-native';
import { ABookPicture } from './ABookPicture';

describe('ABookPicture', () => {
  it('shows a picture at the shape the book gives it, named for who cannot see it', async () => {
    const drawn = await render(
      <ABookPicture address="http://one.local/map.png" label="A map of Arrakis" ratio={2} />,
    );

    expect(drawn.getByLabelText('A map of Arrakis')).toHaveStyle({ aspectRatio: 2 });
  });
});
