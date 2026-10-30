import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { APersonHead } from './APersonHead';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('APersonHead', () => {
  it('names them over their portrait', async () => {
    const drawn = await render(
      <APersonHead
        portraitUrl="https://image.example/amy.jpg"
        name="Amy Adams"
        ground="rgb(20, 20, 30)"
      />,
    );

    expect(drawn.getByText('Amy Adams')).toBeTruthy();
  });
});
