import { Shuffle } from '@keyline-icons/react-native';
import { render } from '@testing-library/react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { ALitCircle } from './ALitCircle';

const theCircle = () => theDrawnRoot().children[0];

describe('ALitCircle', () => {
  it('shows its circle in the page’s ink only while it is on', async () => {
    await render(<ALitCircle of={Shuffle} size={20} isLit={false} />);
    expect(theCircle()).toHaveStyle({ opacity: 0 });

    await render(<ALitCircle of={Shuffle} size={20} isLit />);
    expect(theCircle()).toHaveStyle({ opacity: 1 });
  });
});
