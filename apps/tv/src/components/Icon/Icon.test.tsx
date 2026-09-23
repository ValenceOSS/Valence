import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Play } from '@keyline-icons/react-native';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import type { IconProps as KeylineProps } from '@keyline-icons/react-native';

const Traced = ({ size, color }: KeylineProps) => <Text>{`${String(size)} ${String(color)}`}</Text>;

describe('Icon', () => {
  it('draws the icon it is given in the colour it is given', async () => {
    const drawn = await render(<Icon of={Traced} size={48} colour="#ff0000" />);

    expect(drawn.getByText('48 #ff0000')).toBeTruthy();
  });

  it('is drawn at a standard size unless told otherwise', async () => {
    const drawn = await render(<Icon of={Traced} colour="#ffffff" />);

    expect(drawn.getByText('32 #ffffff')).toBeTruthy();
  });

  it('draws one of the real icons', async () => {
    const drawn = await render(<Icon of={Play} colour="#ffffff" />);

    expect(drawn.toJSON()).not.toBeNull();
  });
});
