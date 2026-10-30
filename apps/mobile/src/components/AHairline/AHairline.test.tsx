import { render } from '@testing-library/react-native';
import { AHairline } from './AHairline';

describe('AHairline', () => {
  it('draws without saying anything', async () => {
    const drawn = await render(<AHairline />);

    expect(drawn.toJSON()).toBeTruthy();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AHairline.displayName).toBe('AHairline');
  });
});
